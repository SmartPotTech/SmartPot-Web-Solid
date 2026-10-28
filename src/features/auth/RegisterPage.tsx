import {A, useNavigate} from "@solidjs/router";
import {createSignal, Show} from "solid-js";
import {Button} from "../../components/ui/Button";
import {Alert} from "../../components/ui/Feedback";
import {TextField} from "../../components/ui/Field";
import {usePageMeta} from "../../hooks/usePageMeta";
import {ApiError} from "../../lib/api/client";
import {authApi} from "../../lib/api/services";
import {AuthCard} from "./AuthCard";
import {useAuth} from "./AuthContext";
import {passwordStrength, validateEmail, validateName, validatePassword} from "./validation";

type Fields = "name" | "lastName" | "email" | "password";

export function RegisterPage() {
    usePageMeta("Crear cuenta", {
        index: true,
        description: "Crea tu cuenta gratis de SmartPot y crea tu primer cultivo, real o virtual."
    });
    const auth = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = createSignal<Record<Fields, string>>({name: "", lastName: "", email: "", password: ""});
    const [errors, setErrors] = createSignal<Partial<Record<Fields, string>>>({});
    const [error, setError] = createSignal<string | null>(null);
    const [loading, setLoading] = createSignal(false);
    const strength = () => passwordStrength(form().password);

    const update = (field: Fields) => (event: Event & { currentTarget: HTMLInputElement }) =>
        setForm((current) => ({...current, [field]: event.currentTarget.value}));

    async function submit(event: SubmitEvent) {
        event.preventDefault();
        const current = form();
        const found = {
            name: validateName(current.name, "nombre", 40),
            lastName: validateName(current.lastName, "apellido", 60),
            email: validateEmail(current.email),
            password: validatePassword(current.password),
        };
        setErrors(found);
        if (Object.values(found).some(Boolean)) return;
        setLoading(true);
        setError(null);
        try {
            auth.signIn(await authApi.register({...current, email: current.email.trim()}), true);
            navigate("/app", {replace: true});
        } catch (caught) {
            if (caught instanceof ApiError) {
                setError(caught.message);
                setErrors(caught.fields as Partial<Record<Fields, string>>);
            } else {
                setError("No pudimos crear tu cuenta");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthCard title="Crea tu cuenta" subtitle="Gratis y en menos de un minuto."
                  footer={<>¿Ya tienes cuenta? <A href="/login"
                                                  class="font-semibold text-leaf-700">Ingresa</A></>}>
            <form onSubmit={submit} class="space-y-4" noValidate>
                <Show when={error()}><Alert tone="danger">{error()}</Alert></Show>
                <div class="grid gap-4 sm:grid-cols-2">
                    <TextField label="Nombre" autocomplete="given-name" value={form().name} error={errors().name}
                               onChange={update("name")}/>
                    <TextField label="Apellido" autocomplete="family-name" value={form().lastName} error={errors().lastName}
                               onChange={update("lastName")}/>
                </div>
                <TextField label="Correo" type="email" autocomplete="email" value={form().email} error={errors().email}
                           onChange={update("email")}/>
                <TextField label="Contraseña" type="password" autocomplete="new-password" value={form().password}
                           error={errors().password} onChange={update("password")}
                           hint={form().password ? `Seguridad: ${strength().label}` : "Mínimo 8 caracteres con mayúscula, minúscula y número"}/>
                <Button type="submit" size="lg" loading={loading()} class="w-full">Crear cuenta</Button>
                <p class="text-center text-xs text-muted">
                    Tus datos solo se usan para tu cuenta y tus cultivos. Puedes eliminarlos cuando quieras desde tu
                    perfil.
                </p>
            </form>
        </AuthCard>
    );
}
