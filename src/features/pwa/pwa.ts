import {createSignal, onCleanup} from "solid-js";

interface InstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferred = event as InstallPromptEvent;
        listeners.forEach((listener) => listener());
    });
    window.addEventListener("appinstalled", () => {
        deferred = null;
        listeners.forEach((listener) => listener());
    });
}

export function registerServiceWorker() {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    });
}

export function isStandalone(): boolean {
    return window.matchMedia?.("(display-mode: standalone)").matches || "standalone" in navigator;
}

export function isIos(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Estado del aviso de instalación: en Android y escritorio se instala con un clic; en iOS se explica el paso. */
export function useInstallPrompt() {
    const [available, setAvailable] = createSignal(Boolean(deferred));

    const update = () => setAvailable(Boolean(deferred));
    listeners.add(update);
    onCleanup(() => {
        listeners.delete(update);
    });

    const install = async () => {
        if (!deferred) return false;
        await deferred.prompt();
        const choice = await deferred.userChoice;
        deferred = null;
        setAvailable(false);
        return choice.outcome === "accepted";
    };

    return {
        get available() {
            return available();
        },
        install,
        get iosHint() {
            return !available() && isIos() && !isStandalone();
        },
    };
}
