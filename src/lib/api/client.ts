import {API_URL} from "../../config/env";

const TIMEOUT_MS = 15_000;
const MAX_ETAG_ENTRIES = 64;

export class ApiError extends Error {
    readonly status: number;
    readonly fields: Record<string, string>;

    constructor(status: number, message: string, fields: Record<string, string> = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.fields = fields;
    }
}

interface ApiHooks {
    getToken: () => string | null;
    onUnauthorized: () => void;
}

interface CachedResource {
    etag: string;
    value: unknown;
}

let hooks: ApiHooks = {getToken: () => null, onUnauthorized: () => undefined};
const etagCache = new Map<string, CachedResource>();

export function configureApi(next: ApiHooks) {
    hooks = next;
    etagCache.clear();
}

export function getApiToken(): string | null {
    return hooks.getToken();
}

export function clearApiCache() {
    etagCache.clear();
}

interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    auth?: boolean;
    signal?: AbortSignal;
    accept?: "json" | "text";
}

const FALLBACK_MESSAGES: Record<number, string> = {
    400: "Revisa los datos enviados.",
    401: "Tu sesión expiró. Inicia sesión de nuevo.",
    403: "No tienes permiso para realizar esta acción.",
    404: "No encontramos lo que buscas.",
    409: "Ya existe un registro con esos datos.",
    429: "Hiciste demasiadas solicitudes. Espera un momento.",
    503: "El servicio no está disponible en este momento.",
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const {method = "GET", body, auth = true, signal, accept = "json"} = options;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    signal?.addEventListener("abort", () => controller.abort(), {once: true});

    const headers: Record<string, string> = {Accept: accept === "json" ? "application/json" : "text/csv"};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const token = auth ? hooks.getToken() : null;
    if (token) headers.Authorization = `Bearer ${token}`;

    const cacheKey = method === "GET" && accept === "json" ? `${token ?? ""}:${path}` : null;
    const cached = cacheKey ? etagCache.get(cacheKey) : undefined;
    if (cached) headers["If-None-Match"] = cached.etag;

    if (method !== "GET") {
        etagCache.clear();
    }

    let response: Response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal,
        });
    } catch (error) {
        if (signal?.aborted) throw error;
        const offline = typeof navigator !== "undefined" && !navigator.onLine;
        throw new ApiError(0, offline
            ? "Estás sin conexión. Revisa tu internet e inténtalo de nuevo."
            : "No pudimos conectar con SmartPot. Inténtalo de nuevo en unos segundos.");
    } finally {
        clearTimeout(timeout);
    }

    if (response.status === 401 && token) {
        etagCache.clear();
        hooks.onUnauthorized();
    }

    if (response.status === 304 && cached) {
        return structuredClone(cached.value) as T;
    }

    if (!response.ok) {
        let message = FALLBACK_MESSAGES[response.status] ?? "Ocurrió un error inesperado.";
        let fields: Record<string, string> = {};
        try {
            const data = await response.json();
            if (typeof data?.message === "string") message = data.message;
            if (data?.fields && typeof data.fields === "object") fields = data.fields;
        } catch {
            // El cuerpo no es JSON: se usa el mensaje por defecto.
        }
        throw new ApiError(response.status, message, fields);
    }

    const text = response.status === 204 ? "" : await response.text();
    if (accept === "text") return text as T;
    const parsed = (text ? JSON.parse(text) : undefined) as T;

    const etag = response.headers?.get("ETag");
    if (cacheKey && etag && parsed !== undefined) {
        if (etagCache.size >= MAX_ETAG_ENTRIES) {
            const oldestKey = etagCache.keys().next().value;
            if (oldestKey !== undefined) etagCache.delete(oldestKey);
        }
        etagCache.set(cacheKey, {etag, value: parsed});
    }

    return parsed;
}
