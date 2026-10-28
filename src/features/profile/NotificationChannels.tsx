import {AppWindow, ExternalLink, Send, Unlink} from "lucide-solid";
import {createSignal, For, Show} from "solid-js";
import {Button} from "../../components/ui/Button";
import {Alert, Badge} from "../../components/ui/Feedback";
import {Switch} from "../../components/ui/Switch";
import {useResource} from "../../hooks/useResource";
import {ApiError} from "../../lib/api/client";
import {channelApi} from "../../lib/api/services";
import {timeAgo} from "../../lib/format";
import type {ChannelLink, ChannelOption, LinkCode, NotificationType} from "../../lib/api/types";

const EVENT_LABELS: Record<NotificationType, string> = {
    ALERT: "Alertas del cultivo",
    DEVICE: "Cultivo desconectado",
    AI: "Acciones del asistente",
    COMMAND: "Comandos que fallan o vencen",
    INFO: "Novedades de la cuenta",
};
const EVENTS = Object.keys(EVENT_LABELS) as NotificationType[];

type Message = { tone: "success" | "danger" | "info"; text: string } | null;

/**
 * Aplicaciones donde llegan los avisos fuera de SmartPot. Hoy Telegram; el servidor dice cuáles ofrece y, si falta
 * configurar una, se ve en gris con lo que necesita. Aquí se vincula el chat y se eligen los avisos por defecto; cada
 * cultivo afina los suyos en Ajustes.
 */
export function NotificationChannels() {
    const channels = useResource(() => channelApi.list(), []);
    const [code, setCode] = createSignal<LinkCode | null>(null);
    const [message, setMessage] = createSignal<Message>(null);
    const [busy, setBusy] = createSignal<string | null>(null);

    async function run(key: string, action: () => Promise<unknown>, success?: string) {
        setBusy(key);
        setMessage(null);
        try {
            await action();
            if (success) setMessage({tone: "success", text: success});
            await channels.reload();
        } catch (caught) {
            setMessage({tone: "danger", text: caught instanceof ApiError ? caught.message : "No se pudo completar"});
        } finally {
            setBusy(null);
        }
    }

    async function startLink() {
        await run("link", async () => {
            const created = await channelApi.link("telegram");
            setCode(created);
            window.open(created.url, "_blank", "noopener,noreferrer");
        });
    }

    return (
        <section class="card space-y-4 p-5" aria-labelledby="channels-title">
            <div>
                <h2 id="channels-title" class="flex items-center gap-2 text-lg font-semibold">
                    <AppWindow size={18} class="text-leaf-700"/> Aplicaciones
                </h2>
                <p class="text-sm text-muted">
                    Recibe los avisos de tus cultivos donde ya conversas. Cada cultivo elige en Ajustes qué avisa, cada
                    cuánto y
                    con quién lo compartes.
                </p>
            </div>
            <Show when={message()}>
                {(msg) => <Alert tone={msg().tone}>{msg().text}</Alert>}
            </Show>
            <Show when={channels.error}>
                {(err) => <Alert tone="danger">{err()}</Alert>}
            </Show>
            <For each={channels.data ?? []}>
                {(option) => (
                    <ChannelRow option={option} code={code()} busy={busy()}
                                onLink={() => void startLink()}
                                onRefresh={() => void channels.reload()}
                                onUpdate={(link, body) => void run(`update-${link.id}`, () => channelApi.update(link.id, body))}
                                onTest={(link) => void run(`test-${link.id}`, () => channelApi.test(link.id), "Mensaje de prueba enviado")}
                                onUnlink={(link) => void run(`unlink-${link.id}`, () => channelApi.unlink(link.id), "Canal desvinculado")}/>
                )}
            </For>
        </section>
    );
}

interface ChannelRowProps {
    option: ChannelOption;
    code: LinkCode | null;
    busy: string | null;
    onLink: () => void;
    onRefresh: () => void;
    onUpdate: (link: ChannelLink, body: { enabled?: boolean; events?: NotificationType[] }) => void;
    onTest: (link: ChannelLink) => void;
    onUnlink: (link: ChannelLink) => void;
}

export function ChannelRow(props: ChannelRowProps) {
    const link = () => props.option.link;
    const requirements = () => props.option.requirements ?? [];

    return (
        <Show when={props.option.available} fallback={
            <div class="rounded-xl border border-dashed border-line bg-surface p-4 text-sm opacity-75"
                 aria-disabled="true">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="font-semibold text-muted">{props.option.name}</p>
                    <Badge tone="neutral">No disponible</Badge>
                </div>
                <Show when={props.option.description}>
                    <p class="mt-1 text-muted">{props.option.description}</p>
                </Show>
                <Button size="sm" class="mt-3" disabled>Vincular {props.option.name}</Button>
                <details class="mt-3 text-xs text-muted">
                    <summary class="cursor-pointer font-semibold">Detalle técnico</summary>
                    <p class="mt-1">
                        Este servidor aún no ofrece {props.option.name}. Quien lo administra debe definir{" "}
                        <For each={requirements()}>
                            {(name, index) => (
                                <span>
                                    <code>{name}</code>
                                    {index() < requirements().length - 2 ? ", " : index() === requirements().length - 2 ? " y " : ""}
                                </span>
                            )}
                        </For>{" "}
                        en el entorno de SmartPot-API y reiniciarla.
                    </p>
                </details>
            </div>
        }>
            <Show when={link()} fallback={
                <div class="rounded-xl bg-surface p-4">
                    <p class="font-semibold">{props.option.name} <span
                        class="font-normal text-muted">{props.option.handle}</span></p>
                    <Show when={props.option.description}>
                        <p class="mt-1 text-sm text-muted">{props.option.description}</p>
                    </Show>
                    <p class="mt-1 text-sm text-muted">
                        Toca «Vincular»: se abrirá {props.option.name} con un código de un solo uso.
                        Presiona <strong>Iniciar</strong> en el
                        chat del bot y listo.
                    </p>
                    <div class="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" icon={<ExternalLink size={14}/>} loading={props.busy === "link"}
                                onClick={props.onLink}>
                            Vincular {props.option.name}
                        </Button>
                        <Show when={props.code}>
                            <Button size="sm" variant="secondary" onClick={props.onRefresh}>Ya lo vinculé</Button>
                        </Show>
                    </div>
                    <Show when={props.code}>
                        {(c) => (
                            <p class="mt-2 text-xs text-muted">
                                Si no se abrió, entra a <a class="font-semibold text-water-700 underline" href={c().url}
                                                           target="_blank"
                                                           rel="noopener noreferrer">{c().url.replace(/\?.*$/, "")}</a> y
                                escribe <code>/start {c().code}</code>.
                                El código vence {timeAgo(c().expiresAt)}.
                            </p>
                        )}
                    </Show>
                </div>
            }>
                {(currentLink) => {
                    const toggle = (event: NotificationType, checked: boolean) => {
                        const events = checked
                            ? [...new Set([...currentLink().events, event])]
                            : currentLink().events.filter((item) => item !== event);
                        props.onUpdate(currentLink(), {events});
                    };

                    return (
                        <div class="rounded-xl border border-line p-4">
                            <div class="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p class="flex items-center gap-2 font-semibold">{props.option.name}
                                        <Badge
                                            tone={currentLink().enabled ? "success" : "neutral"}>
                                            {currentLink().enabled ? "Activo" : "En pausa"}
                                        </Badge>
                                    </p>
                                    <p class="text-sm text-muted">
                                        Vinculado a {currentLink().displayName ?? "tu chat"}
                                        {currentLink().address && <> · id del chat <code>{currentLink().address}</code></>}
                                        {currentLink().lastDeliveredAt ? ` · último aviso ${timeAgo(currentLink().lastDeliveredAt)}` : ""}
                                    </p>
                                </div>
                                <Switch checked={currentLink().enabled}
                                        label={`Recibir avisos por ${props.option.name}`}
                                        onChange={(enabled) => props.onUpdate(currentLink(), {enabled})}/>
                            </div>
                            <fieldset class="mt-3">
                                <legend class="text-sm font-semibold">Qué quieres recibir por defecto</legend>
                                <div class="mt-2 grid gap-2 sm:grid-cols-2">
                                    <For each={EVENTS}>
                                        {(event) => (
                                            <label class="flex items-center gap-2 text-sm">
                                                <input type="checkbox" class="h-4 w-4 accent-leaf-700"
                                                       checked={currentLink().events.includes(event)}
                                                       onChange={(changed) => toggle(event, changed.currentTarget.checked)}/>
                                                {EVENT_LABELS[event]}
                                            </label>
                                        )}
                                    </For>
                                </div>
                            </fieldset>
                            <div class="mt-3 flex flex-wrap gap-2">
                                <Button size="sm" variant="secondary" icon={<Send size={14}/>}
                                        loading={props.busy === `test-${currentLink().id}`}
                                        onClick={() => props.onTest(currentLink())}>Enviar prueba</Button>
                                <Button size="sm" variant="ghost" icon={<Unlink size={14}/>}
                                        loading={props.busy === `unlink-${currentLink().id}`}
                                        onClick={() => props.onUnlink(currentLink())}>Desvincular</Button>
                            </div>
                        </div>
                    );
                }}
            </Show>
        </Show>
    );
}
