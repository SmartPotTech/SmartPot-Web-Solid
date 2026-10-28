import {Navigate, useLocation} from "@solidjs/router";
import {type JSX, Show} from "solid-js";
import {useAuth} from "./AuthContext";

export function RequireAuth(props: { children: JSX.Element }) {
    const auth = useAuth();
    const location = useLocation();
    return (
        <Show
            when={auth.token}
            fallback={<Navigate href="/login" state={{from: location.pathname + location.search}}/>}
        >
            {props.children}
        </Show>
    );
}

export function RedirectIfAuthenticated(props: { children: JSX.Element }) {
    const auth = useAuth();
    return (
        <Show when={!auth.token} fallback={<Navigate href="/app"/>}>
            {props.children}
        </Show>
    );
}
