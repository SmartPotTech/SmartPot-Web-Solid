import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe, expect, it} from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf-8");

describe("SEO y PWA", () => {
    const page = new DOMParser().parseFromString(read("index.html"), "text/html");
    const attribute = (selector: string, name: string) => page.querySelector(selector)?.getAttribute(name) ?? "";

    it("index.html trae metadatos, Open Graph y datos estructurados en español", () => {
        expect(page.documentElement.lang).toBe("es");
        expect(attribute('meta[name="description"]', "content").length).toBeGreaterThanOrEqual(80);
        expect(attribute('meta[name="description"]', "content").length).toBeLessThanOrEqual(160);
        expect(attribute('link[rel="canonical"]', "href")).toBe("https://smartpot.app/");
        expect(attribute('meta[property="og:image"]', "content")).toBe("https://smartpot.app/og-image.png");
        expect(attribute('link[rel="manifest"]', "href")).toBe("/manifest.webmanifest");
        const jsonLd = page.querySelector('script[type="application/ld+json"]')?.textContent ?? "{}";
        const types = JSON.parse(jsonLd)["@graph"].map((node: { "@type": string }) => node["@type"]);
        expect(types).toEqual(expect.arrayContaining(["Organization", "WebSite", "SoftwareApplication", "FAQPage"]));
    });

    it("el manifiesto es instalable", () => {
        const manifest = JSON.parse(read("public/manifest.webmanifest"));
        expect(manifest.display).toBe("standalone");
        expect(manifest.lang).toBe("es");
        const sizes = manifest.icons.map((icon: { sizes: string; purpose: string }) => `${icon.sizes}:${icon.purpose}`);
        expect(sizes).toEqual(expect.arrayContaining(["192x192:any", "512x512:any", "512x512:maskable"]));
    });

    it("robots bloquea la app privada y publica el sitemap", () => {
        const robots = read("public/robots.txt");
        expect(robots).toContain("Disallow: /app");
        expect(robots).toContain("Sitemap: https://smartpot.app/sitemap.xml");
        expect(read("public/sitemap.xml")).toContain("<loc>https://smartpot.app/</loc>");
    });

    it("el service worker no guarda la API ni la configuración", () => {
        const worker = read("public/sw.js");
        expect(worker).toContain('url.origin !== self.location.origin || url.pathname === "/config.js"');
    });
});
