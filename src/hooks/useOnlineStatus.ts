import {createSignal, onCleanup} from "solid-js";

export function useOnlineStatus(): () => boolean {
    const [online, setOnline] = createSignal(typeof navigator === "undefined" ? true : navigator.onLine);
    if (typeof window !== "undefined") {
        const update = () => setOnline(navigator.onLine);
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        onCleanup(() => {
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        });
    }
    return online;
}
