declare global {
    interface Window {
        SMARTPOT_CONFIG?: { apiUrl?: string };
    }
}

// La URL de la API llega en /config.js, que el contenedor genera al arrancar.
const runtimeUrl = typeof window !== "undefined" ? window.SMARTPOT_CONFIG?.apiUrl : undefined;

export const API_URL = (runtimeUrl || import.meta.env.VITE_API_URL || "http://localhost:8091").replace(/\/+$/, "");

export const SITE_URL = "https://smartpot.app";
