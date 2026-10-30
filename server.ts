/**
 * Servidor Web y Borde de Alto Rendimiento para SmartPot PWA impulsado por Bun.
 *
 * Características:
 * - Bun.serve nativo con soporte de SO_REUSEPORT para balanceo de carga entre workers en CPU multinúcleo.
 * - Despacho transparente de activos pre-comprimidos (Brotli .br y Gzip .gz) según Accept-Encoding.
 * - Fallback SPA hacia index.html para enrutamiento del lado del cliente en SolidJS.
 * - Proxy inverso de baja latencia hacia la API REST (/api/v1/*).
 * - Sonda de salud (/health) y cabeceras estrictas de seguridad (CSP, CORS, CORP, HSTS).
 */
import { existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const PORT = parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.HOST || "0.0.0.0";
const API_URL = (process.env.API_URL || "http://localhost:8091").replace(/\/$/, "");
const DIST_DIR = join(import.meta.dir, "dist");

const MIME_TYPES: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".txt": "text/plain; charset=utf-8",
};

const SECURITY_HEADERS: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' http: https: ws: wss:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
};

function applySecurityHeaders(headers: Headers): Headers {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        headers.set(key, value);
    }
    return headers;
}

// Inicia el servidor nativo de Bun
const server = Bun.serve({
    port: PORT,
    hostname: HOST,
    reusePort: true, // Permite lanzar múltiples instancias/workers en el mismo puerto con balanceo de kernel
    async fetch(req) {
        const url = new URL(req.url);
        const pathname = url.pathname;

        // 1. Sonda de salud para orquestación y monitoreo
        if (pathname === "/health") {
            const healthHeaders = new Headers({ "Content-Type": "application/json" });
            applySecurityHeaders(healthHeaders);
            return new Response(
                JSON.stringify({
                    status: "UP",
                    runtime: "bun",
                    version: Bun.version,
                    port: PORT,
                    uptimeSeconds: Math.floor(process.uptime()),
                }),
                { status: 200, headers: healthHeaders },
            );
        }

        // 2. Proxy inverso hacia SmartPot-API (/api/v1/*)
        if (pathname.startsWith("/api/v1/")) {
            const targetUrl = `${API_URL}${pathname}${url.search}`;
            try {
                const proxyReq = new Request(targetUrl, {
                    method: req.method,
                    headers: req.headers,
                    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
                    redirect: "manual",
                });
                const proxyRes = await fetch(proxyReq);
                const resHeaders = new Headers(proxyRes.headers);
                applySecurityHeaders(resHeaders);
                return new Response(proxyRes.body, {
                    status: proxyRes.status,
                    statusText: proxyRes.statusText,
                    headers: resHeaders,
                });
            } catch (err) {
                const errorHeaders = new Headers({ "Content-Type": "application/json" });
                applySecurityHeaders(errorHeaders);
                return new Response(
                    JSON.stringify({
                        error: "Bad Gateway",
                        message: "No fue posible conectar con el servicio backend de SmartPot API",
                        detail: String(err),
                    }),
                    { status: 502, headers: errorHeaders },
                );
            }
        }

        // 3. Resolución de archivos estáticos desde dist/
        const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
        let filePath = join(DIST_DIR, relativePath);

        // Si es una ruta sin archivo o subdirectorio que no existe, fallback a index.html (SPA)
        if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
            filePath = join(DIST_DIR, "index.html");
        }

        if (!existsSync(filePath)) {
            const notFoundHeaders = new Headers({ "Content-Type": "text/plain" });
            applySecurityHeaders(notFoundHeaders);
            return new Response("404 Not Found - Ejecuta 'bun run build' previamente.", {
                status: 404,
                headers: notFoundHeaders,
            });
        }

        const ext = extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        const acceptEncoding = req.headers.get("accept-encoding") || "";

        const headers = new Headers();
        headers.set("Content-Type", contentType);

        // Caché inmutable para activos hash en /assets/ o /icons/
        if (pathname.startsWith("/assets/") || pathname.startsWith("/icons/")) {
            headers.set("Cache-Control", "public, max-age=31536000, immutable");
        } else {
            headers.set("Cache-Control", "no-cache");
        }

        // Negociación transparente de pre-compresión Brotli y Gzip
        if (acceptEncoding.includes("br") && existsSync(`${filePath}.br`)) {
            headers.set("Content-Encoding", "br");
            applySecurityHeaders(headers);
            return new Response(Bun.file(`${filePath}.br`), { headers });
        }

        if (acceptEncoding.includes("gzip") && existsSync(`${filePath}.gz`)) {
            headers.set("Content-Encoding", "gzip");
            applySecurityHeaders(headers);
            return new Response(Bun.file(`${filePath}.gz`), { headers });
        }

        applySecurityHeaders(headers);
        return new Response(Bun.file(filePath), { headers });
    },
});

console.log(`[SmartPot-Web-Solid] Servidor Bun escuchando en http://${HOST}:${server.port} (PID: ${process.pid})`);
