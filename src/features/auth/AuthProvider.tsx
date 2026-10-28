import {createEffect, createSignal, type JSX, onCleanup} from "solid-js";
import {clearApiCache, configureApi} from "../../lib/api/client";
import type {AuthResponse, User} from "../../lib/api/types";
import {AuthContext, type AuthState} from "./AuthContext";
import {
    clearSession,
    currentSessionToken,
    loadSession,
    saveSession,
    type Session,
    SESSION_STORAGE_KEY,
    updateStoredUser,
} from "./session";

const EXPIRED = "Tu sesión expiró. Inicia sesión de nuevo.";
let handleUnauthorized: () => void = () => undefined;

configureApi({getToken: currentSessionToken, onUnauthorized: () => handleUnauthorized()});

export function AuthProvider(props: { children: JSX.Element }) {
    const [session, setSession] = createSignal<Session | null>(loadSession());
    const [notice, setNotice] = createSignal<string | null>(null);

    const signOut = (reason?: string) => {
        clearSession();
        clearApiCache();
        setSession(null);
        if (reason) setNotice(reason);
    };

    handleUnauthorized = () => signOut(EXPIRED);
    configureApi({getToken: currentSessionToken, onUnauthorized: () => handleUnauthorized()});

    if (typeof window !== "undefined") {
        const onStorage = (event: StorageEvent) => {
            if (event.key === SESSION_STORAGE_KEY || event.key === null) {
                clearApiCache();
                setSession(loadSession());
            }
        };
        window.addEventListener("storage", onStorage);
        onCleanup(() => window.removeEventListener("storage", onStorage));
    }

    createEffect(() => {
        const current = session();
        if (!current) return;
        const remaining = new Date(current.expiresAt).getTime() - Date.now();
        const timer = setTimeout(() => signOut(EXPIRED), Math.max(0, Math.min(remaining, 2_000_000_000)));
        onCleanup(() => clearTimeout(timer));
    });

    const signIn = (auth: AuthResponse, remember: boolean) => {
        clearApiCache();
        setSession(saveSession(auth, remember));
        setNotice(null);
    };

    const updateUser = (user: User) => {
        updateStoredUser(user);
        setSession((current) => (current ? {...current, user} : current));
    };

    const value: AuthState = {
        get user() {
            return session()?.user ?? null;
        },
        get token() {
            return session()?.token ?? null;
        },
        signIn,
        signOut,
        updateUser,
        get notice() {
            return notice();
        },
        clearNotice: () => setNotice(null),
    };

    return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}
