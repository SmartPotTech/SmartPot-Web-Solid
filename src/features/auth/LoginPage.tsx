import {A, useLocation, useNavigate} from "@solidjs/router";
import {createSignal, Show} from "solid-js";
import {Button} from "../../components/ui/Button";
import {Alert} from "../../components/ui/Feedback";
import {TextField} from "../../components/ui/Field";
import {usePageMeta} from "../../hooks/usePageMeta";
import {ApiError} from "../../lib/api/client";
import {authApi} from "../../lib/api/services";
import {AuthCard} from "./AuthCard";
import {useAuth} from "./AuthContext";
import {validateEmail} from "./validation";

export function LoginPage() {
    usePageMeta("Ingresar", {index: true, description: "Ingresa a SmartPot para ver y controlar tus cultivos."});
    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation<{ from?: string }>();
    const [email, setEmail] = createSignal("");
    const [password, setPassword] = createSignal("");
    const [remember, setRemember] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);
    const [emailError, setEmailError] = createSignal<string>();
    const [loading, setLoading] = createSignal(false);

    async function submit(event: SubmitEvent) {
        event.preventDefault();
        auth.clearNotice();
        const invalid = validateEmail(email());
        setEmailError(invalid);
        if (invalid || !password()) {
            setError(invalid ? null : "Escribe tu contraseña");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            auth.signIn(await authApi.login(email().trim(), password()), remember());
            const from = location.state?.from;
            navigate(from && from.startsWith("/app") ? from : "/app", {replace: true});
        } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : "No pudimos iniciar sesión");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthCard title="Ingresa a SmartPot" subtitle="Monitorea y cuida tus cultivos desde cualquier lugar."
                  footer={<>¿No tienes cuenta? <A href="/register" class="font-semibold text-leaf-700">Créala
                      gratis</A></>}>
            <form onSubmit={submit} class="space-y-4" noValidate>
                <Show when={auth.notice}><Alert tone="warning">{auth.notice}</Alert></Show>
                <Show when={error()}><Alert tone="danger">{error()}</Alert></Show>
                <TextField label="Correo" type="email" autocomplete="email" value={email()} error={emailError()}
                           onChange={(event) => setEmail(event.currentTarget.value)}/>
                <TextField label="Contraseña" type="password" autocomplete="current-password" value={password()}
                           onChange={(event) => setPassword(event.currentTarget.value)}/>
                <div class="flex items-center justify-between text-sm">
                    <label class="flex items-center gap-2 text-muted">
                        <input type="checkbox" checked={remember()}
                               onChange={(event) => setRemember(event.currentTarget.checked)}
                               class="h-4 w-4 accent-leaf-700"/>
                        Mantener sesión iniciada
                    </label>
                    <A href="/forgot-password" class="font-semibold text-leaf-700">¿Olvidaste tu contraseña?</A>
                </div>
                <Button type="submit" size="lg" loading={loading()} class="w-full">Ingresar</Button>
            </form>
        </AuthCard>
    );
}
