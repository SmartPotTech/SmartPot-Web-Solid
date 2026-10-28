import {A} from "@solidjs/router";
import {BellRing, Copy, ExternalLink, Save, Share2, Trash2} from "lucide-solid";
import {createSignal, For, Show} from "solid-js";
import {Button} from "../../../components/ui/Button";
import {Alert} from "../../../components/ui/Feedback";
import {Switch} from "../../../components/ui/Switch";
import {useResource} from "../../../hooks/useResource";
import {ApiError} from "../../../lib/api/client";
import {cropChannelApi} from "../../../lib/api/services";
import {timeAgo} from "../../../lib/format";
import type {Crop, CropChannel, Delivery, LinkCode, NotificationType} from "../../../lib/api/types";

/** Qué puede avisar un cultivo (las novedades de la cuenta no son de un cultivo). */
const CROP_EVENTS: { type: NotificationType; label: string }[] = [
    {type: "ALERT", label: "Alertas de sus variables"},
    {type: "DEVICE", label: "Se desconecta"},
    {type: "AI", label: "Acciones del asistente"},
    {type: "COMMAND", label: "Órdenes que fallan o vencen"},
];
const DIGEST_HOURS = [1, 2, 3, 6, 12, 24];

/**
 * Avisos de este cultivo fuera de la app, por cada aplicación vinculada en el perfil (hoy Telegram). Si no hay
 * ninguna vinculada, solo se invita a vincularla; así la sección crece sola cuando se sumen más aplicaciones.
 */
export function CropNotifications(props: { crop: Crop }) {
    const channels = useResource(() => cropChannelApi.list(props.crop.id), () => [props.crop.id]);
    const ready = () => (channels.data ?? []).filter((channel) => channel.available && channel.linked);

    return (
        <Show when={!channels.error} fallback={<Alert tone="danger">{channels.error}</Alert>}>
            <Show when={channels.data}>
                <Show when={ready().length > 0} fallback={
                    <section class="card p-5">
                        <h3 class="flex items-center gap-2 font-semibold"><BellRing size={16} class="text-leaf-700"/> Avisos
                            fuera de SmartPot</h3>
                        <p class="mt-1 text-sm text-muted">
                            Vincula una aplicación en <A href="/app/profile"
                                                         class="font-semibold text-water-700 hover:underline">tu
                            perfil</A> y aquí eliges qué avisa este cultivo, cada cuánto y con quién lo compartes.
                        </p>
                    </section>
                }>
                    <For each={ready()}>
                        {(channel) => (
                            <ChannelSettings crop={props.crop} channel={channel}
                                             onChanged={() => void channels.reload()}/>
                        )}
                    </For>
                </Show>
            </Show>
        </Show>
    );
}

function ChannelSettings(props: { crop: Crop; channel: CropChannel; onChanged: () => void }) {
    const [enabled, setEnabled] = createSignal(props.channel.enabled);
    const [events, setEvents] = createSignal<NotificationType[]>(props.channel.events);
    const [delivery, setDelivery] = createSignal<Delivery>(props.channel.delivery);
    const [digestHours, setDigestHours] = createSignal(props.channel.digestHours || 6);
    const [daily, setDaily] = createSignal(Boolean(props.channel.dailySummaryAt));
    const [dailyAt, setDailyAt] = createSignal(props.channel.dailySummaryAt ?? "07:00");
    const [code, setCode] = createSignal<LinkCode | null>(null);
    const [busy, setBusy] = createSignal<string | null>(null);
    const [message, setMessage] = createSignal<{ tone: "success" | "danger" | "info"; text: string } | null>(null);

    async function run(key: string, task: () => Promise<unknown>, success?: string) {
        setBusy(key);
        setMessage(null);
        try {
            await task();
            if (success) setMessage({tone: "success", text: success});
            props.onChanged();
        } catch (caught) {
            setMessage({tone: "danger", text: caught instanceof ApiError ? caught.message : "No se pudo completar"});
        } finally {
            setBusy(null);
        }
    }

    const save = () => void run("save", () => cropChannelApi.update(props.crop.id, props.channel.type, {
        enabled: enabled(),
        events: events(),
        delivery: delivery(),
        digestHours: digestHours(),
        dailySummaryAt: daily() ? dailyAt() : "",
    }), "Avisos guardados");

    const share = () => void run("share", async () => {
        const created = await cropChannelApi.share(props.crop.id, props.channel.type);
        setCode(created);
    });

    async function copy(url: string) {
        try {
            await navigator.clipboard.writeText(url);
            setMessage({tone: "info", text: "Enlace copiado: envíaselo a quien quieras que reciba los avisos."});
        } catch {
            setMessage({tone: "danger", text: "No se pudo copiar; selecciona el enlace y cópialo a mano."});
        }
    }

    return (
        <section class="card space-y-4 p-5" aria-label={`Avisos por ${props.channel.name}`}>
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h3 class="flex items-center gap-2 font-semibold"><BellRing size={16} class="text-leaf-700"/> Avisos
                        por {props.channel.name}</h3>
                    <p class="text-sm text-muted">Lo que este cultivo te avisa a ti y a los chats con los que lo
                        compartes.</p>
                </div>
                <Switch checked={enabled()} label={`Avisos de este cultivo por ${props.channel.name}`}
                        onChange={setEnabled}/>
            </div>
            <Show when={message()}>
                {(msg) => <Alert tone={msg().tone}>{msg().text}</Alert>}
            </Show>

            <fieldset disabled={!enabled()} class="space-y-4 disabled:opacity-60">
                <div>
                    <p class="text-sm font-semibold">Qué avisar</p>
                    <div class="mt-2 grid gap-2 sm:grid-cols-2">
                        <For each={CROP_EVENTS}>
                            {(item) => (
                                <label class="flex items-center gap-2 text-sm">
                                    <input type="checkbox" class="h-4 w-4 accent-leaf-700"
                                           checked={events().includes(item.type)}
                                           onChange={(event) => setEvents((current) => event.currentTarget.checked
                                               ? [...new Set([...current, item.type])]
                                               : current.filter((type) => type !== item.type))}/>
                                    {item.label}
                                </label>
                            )}
                        </For>
                    </div>
                </div>

                <div>
                    <p class="text-sm font-semibold">Cuándo</p>
                    <div class="mt-2 flex flex-wrap items-center gap-4 text-sm" role="radiogroup"
                         aria-label="Cuándo avisar">
                        <label class="flex items-center gap-2">
                            <input type="radio" name={`delivery-${props.channel.type}`} class="accent-leaf-700"
                                   checked={delivery() === "INSTANT"} onChange={() => setDelivery("INSTANT")}/>
                            Al instante
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="radio" name={`delivery-${props.channel.type}`} class="accent-leaf-700"
                                   checked={delivery() === "DIGEST"} onChange={() => setDelivery("DIGEST")}/>
                            Un resumen cada
                        </label>
                        <select value={digestHours()} disabled={delivery() !== "DIGEST"}
                                aria-label="Horas entre resúmenes"
                                onChange={(event) => setDigestHours(Number(event.currentTarget.value))}
                                class="h-9 rounded-lg border border-line bg-white px-2 disabled:opacity-50">
                            <For each={DIGEST_HOURS}>
                                {(hours) => <option value={hours}>{hours === 1 ? "1 hora" : `${hours} horas`}</option>}
                            </For>
                        </select>
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-3 text-sm">
                    <label class="flex items-center gap-2">
                        <input type="checkbox" class="h-4 w-4 accent-leaf-700" checked={daily()}
                               onChange={(event) => setDaily(event.currentTarget.checked)}/>
                        <span class="font-semibold">Resumen diario</span> a las
                    </label>
                    <input type="time" value={dailyAt()} disabled={!daily()} aria-label="Hora del resumen diario"
                           onChange={(event) => setDailyAt(event.currentTarget.value)}
                           class="h-9 rounded-lg border border-line bg-white px-2 disabled:opacity-50"/>
                    <span class="text-xs text-muted">Salud, última lectura y lo que pasó en 24 h.</span>
                </div>
            </fieldset>

            <Button icon={<Save size={16}/>} loading={busy() === "save"} onClick={save}>Guardar avisos</Button>

            <div class="border-t border-line pt-4">
                <p class="text-sm font-semibold">Compartido con</p>
                <p class="text-xs text-muted">
                    Si cuidas este cultivo con alguien, compártele un enlace: recibirá en su {props.channel.name} los
                    mismos
                    avisos, sin
                    entrar a tu cuenta. Hasta 10 chats.
                </p>
                <ul class="mt-2 divide-y divide-line">
                    <For each={props.channel.recipients}>
                        {(recipient) => (
                            <li class="flex items-center justify-between gap-2 py-2 text-sm">
                                <span>{recipient.displayName ?? "Chat sin nombre"}
                                    {recipient.addedAt &&
                                        <span class="text-muted"> · desde {timeAgo(recipient.addedAt)}</span>}</span>
                                <Button size="sm" variant="ghost" icon={<Trash2 size={14}/>}
                                        loading={busy() === `remove-${recipient.id}`}
                                        aria-label={`Dejar de compartir con ${recipient.displayName ?? "este chat"}`}
                                        onClick={() => void run(`remove-${recipient.id}`,
                                            () => cropChannelApi.removeRecipient(props.crop.id, props.channel.type, recipient.id), "Dejaste de compartirlo")}>
                                    Quitar
                                </Button>
                            </li>
                        )}
                    </For>
                    <Show when={props.channel.recipients.length === 0}>
                        <li class="py-2 text-sm text-muted">Todavía no lo compartes.</li>
                    </Show>
                </ul>
                <Button size="sm" variant="secondary" class="mt-2" icon={<Share2 size={14}/>}
                        loading={busy() === "share"}
                        disabled={props.channel.recipients.length >= 10} onClick={share}>
                    Compartir con otro chat
                </Button>
                <Show when={code()}>
                    {(c) => (
                        <div class="mt-3 space-y-2 rounded-xl bg-surface p-3 text-sm">
                            <p>Envía este enlace; vence {timeAgo(c().expiresAt)} y sirve una sola vez.</p>
                            <p class="break-all font-mono text-xs">{c().url}</p>
                            <div class="flex flex-wrap gap-2">
                                <Button size="sm" variant="secondary" icon={<Copy size={14}/>}
                                        onClick={() => void copy(c().url)}>Copiar enlace</Button>
                                <Button size="sm" variant="ghost" icon={<ExternalLink size={14}/>}
                                        onClick={() => window.open(c().url, "_blank", "noopener,noreferrer")}>Abrir</Button>
                                <Button size="sm" variant="ghost" onClick={() => {
                                    setCode(null);
                                    props.onChanged();
                                }}>Ya lo usaron</Button>
                            </div>
                        </div>
                    )}
                </Show>
            </div>
        </section>
    );
}
