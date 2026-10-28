import {createEffect, createMemo, createSignal, onCleanup, untrack} from "solid-js";
import {ApiError} from "../lib/api/client";

export interface Resource<T> {
    readonly data: T | undefined;
    readonly error: string | null;
    readonly loading: boolean;
    reload: () => Promise<void>;
    setData: (value: T | undefined) => void;
}

/**
 * Carga un recurso de la API y, con intervalo, lo refresca mientras la pestaña está visible.
 * Al cambiar las dependencias conserva los datos anteriores hasta que llegan los nuevos.
 */
export function useResource<T>(
    loader: () => Promise<T>,
    deps: (() => unknown) | unknown[] = [],
    intervalMs?: number,
): Resource<T> {
    const [data, setDataSignal] = createSignal<T | undefined>(undefined);
    const [error, setError] = createSignal<string | null>(null);
    const [loadedKey, setLoadedKey] = createSignal<string | null>(null);

    const key = createMemo(() => {
        const raw = typeof deps === "function"
            ? deps()
            : deps.map((item) => (typeof item === "function" ? (item as () => unknown)() : item));
        return JSON.stringify(raw);
    });

    const load = async (forKey: string) => {
        try {
            const value = await untrack(loader);
            setDataSignal(() => value);
            setError(null);
        } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : "Ocurrió un error inesperado.");
        } finally {
            setLoadedKey(forKey);
        }
    };

    createEffect(() => {
        const currentKey = key();
        void load(currentKey);
        if (!intervalMs) return;
        const refresh = () => {
            if (document.visibilityState === "visible") void load(currentKey);
        };
        const timer = window.setInterval(refresh, intervalMs);
        document.addEventListener("visibilitychange", refresh);
        onCleanup(() => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", refresh);
        });
    });

    return {
        get data() {
            return data();
        },
        get error() {
            return error();
        },
        get loading() {
            return loadedKey() !== key();
        },
        reload: () => load(key()),
        setData: (value: T | undefined) => setDataSignal(() => value),
    };
}
