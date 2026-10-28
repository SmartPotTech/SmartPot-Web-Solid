import {A, useNavigate, useSearchParams} from "@solidjs/router";
import {createSignal, Show} from "solid-js";
import {Button} from "../../components/ui/Button";
import {Alert} from "../../components/ui/Feedback";
import {TextField} from "../../components/ui/Field";
import {usePageMeta} from "../../hooks/usePageMeta";
import {ApiError} from "../../lib/api/client";
import {authApi} from "../../lib/api/services";
import {AuthCard} from "./AuthCard";
import {validateEmail, validatePassword} from "./validation";

export function ForgotPasswordPage() {
    usePageMeta("Recuperar contraseña");
    const [email, setEmail] = createSignal("");
    const [emailError, setEmailError] = createSignal<string>();
    const [sent, setSent] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [loading, setLoading] = createSignal(false);

    async function submit(event: SubmitEvent) {
        event.preventDefault();
        const invalid = validateEmail(email());
        setEmailError(invalid);
        if (invalid) return;
        setLoading(true);
        setError(null);
        try {
            await authApi.forgotPassword(email().trim());
            setSent(true);
        } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : "No pudimos enviar el correo");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthCard title="Recupera tu contraseña" subtitle="Te enviaremos un enlace para crear una nueva."
                  footer={<A href="/login" class="font-semibold text-leaf-700">Volver a ingresar</A>}>
            <Show when={sent()} fallback={
                <form onSubmit={submit} class="space-y-4" noValidate>
                    <Show when={error()}><Alert tone="danger">{error()}</Alert></Show>
                    <TextField label="Correo" type="email" autocomplete="email" value={email()} error={emailError()}
                               onChange={(event) => setEmail(event.currentTarget.value)}/>
                    <Button type="submit" size="lg" loading={loading()} class="w-full">Enviar enlace</Button>
                </form>
            }>
                <Alert tone="success" title="Revisa tu correo">
                    Si hay una cuenta con ese correo, recibirás un enlace válido por 30 minutos.
                </Alert>
            </Show>
        </AuthCard>
    );
}

export function ResetPasswordPage() {
    usePageMeta("Nueva contraseña");
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const token = () => (typeof params.token === "string" ? params.token : "");
    const [password, setPassword] = createSignal("");
    const [confirm, setConfirm] = createSignal("");
    const [errors, setErrors] = createSignal<{ password?: string; confirm?: string }>({});
    const [error, setError] = createSignal<string | null>(token() ? null : "El enlace de recuperación no es válido.");
    const [loading, setLoading] = createSignal(false);

    async function submit(event: SubmitEvent) {
        event.preventDefault();
        const found = {
            password: validatePassword(password()),
            confirm: password() === confirm() ? undefined : "Las contraseñas no coinciden",
        };
        setErrors(found);
        if (found.password || found.confirm || !token()) return;
        setLoading(true);
        setError(null);
        try {
            await authApi.resetPassword(token(), password());
            navigate("/login", {replace: true});
        } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : "No pudimos cambiar la contraseña");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthCard title="Crea una nueva contraseña"
                  footer={<A href="/forgot-password" class="font-semibold text-leaf-700">Pedir otro enlace</A>}>
            <form onSubmit={submit} class="space-y-4" noValidate>
                <Show when={error()}><Alert tone="danger">{error()}</Alert></Show>
                <TextField label="Nueva contraseña" type="password" autocomplete="new-password" value={password()}
                           error={errors().password} onChange={(event) => setPassword(event.currentTarget.value)}/>
                <TextField label="Repite la contraseña" type="password" autocomplete="new-password" value={confirm()}
                           error={errors().confirm} onChange={(event) => setConfirm(event.currentTarget.value)}/>
                <Button type="submit" size="lg" loading={loading()} disabled={!token()} class="w-full">Guardar
                    contraseña</Button>
            </form>
        </AuthCard>
    );
}
