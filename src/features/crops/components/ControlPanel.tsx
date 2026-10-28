import {Bot, Plus, Trash2} from "lucide-solid";
import {createSignal, For, onCleanup, onMount, Show} from "solid-js";
import {Button} from "../../../components/ui/Button";
import {SelectField} from "../../../components/ui/Field";
import {Alert, Badge} from "../../../components/ui/Feedback";
import {Switch} from "../../../components/ui/Switch";
import {ApiError} from "../../../lib/api/client";
import {actuatorApi, commandApi} from "../../../lib/api/services";
import {ACTUATORS, COMMAND_STATUS} from "../../../lib/catalog";
import {describeAction, formatDateTime, formatDuration, timeAgo} from "../../../lib/format";
import type {Actuator, ActuatorType, Command, CommandAction, Crop} from "../../../lib/api/types";
import {pendingCommands, runningActuators} from "../live";

interface ControlPanelProps {
    crop: Crop;
    actuators: Actuator[];
    commands: Command[];
    onAutomation: (enabled: boolean) => Promise<void>;
    onChanged: () => void;
}

/** 0 en el selector de duración: encendido hasta apagarlo. */
const UNLIMITED = 0;

export function ControlPanel(props: ControlPanelProps) {
    const [busy, setBusy] = createSignal<string | null>(null);
    const [error, setError] = createSignal<string | null>(null);
    const [newType, setNewType] = createSignal<ActuatorType | "">("");
    // Órdenes enviadas desde aquí que aún no aparecen en la lista de comandos: el switch no vuelve atrás mientras tanto.
    const [sending, setSending] = createSignal<Partial<Record<ActuatorType, { action: CommandAction; at: number }>>>({});
    const [durations, setDurations] = createSignal<Partial<Record<ActuatorType, number>>>({});
    const [now, setNow] = createSignal(Date.now());
    const available = () => (Object.keys(ACTUATORS) as ActuatorType[]).filter((type) => !props.actuators.some((a) => a.type === type));
    const running = () => runningActuators(props.actuators, props.commands, [], now());
    const pending = () => pendingCommands(props.commands);
    const online = () => props.crop.device.online;

    // Cuenta regresiva de los encendidos por tiempo.
    onMount(() => {
        const timer = setInterval(() => setNow(Date.now()), 1_000);
        onCleanup(() => clearInterval(timer));
    });

    /**
     * La orden recién enviada vale hasta que la lista de comandos la trae (con 5 s de margen por la diferencia de
     * relojes entre el navegador y el servidor); desde ahí manda el estado que informa la API.
     */
    function sentFromHere(type: ActuatorType): CommandAction | undefined {
        const sent = sending()[type];
        if (!sent || now() - sent.at > 30_000) return undefined;
        const arrived = props.commands.some((command) => command.actuatorType === type
            && Date.parse(command.createdAt) >= sent.at - 5_000);
        return arrived ? undefined : sent.action;
    }

    async function run(key: string, task: () => Promise<unknown>) {
        setBusy(key);
        setError(null);
        try {
            await task();
            props.onChanged();
        } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : "No se pudo completar la acción");
        } finally {
            setBusy(null);
        }
    }

    async function toggle(actuator: Actuator, on: boolean) {
        const info = ACTUATORS[actuator.type];
        const chosen = durations()[actuator.type] ?? info.defaultSeconds ?? UNLIMITED;
        const action: CommandAction = on ? "ACTIVATE" : "DEACTIVATE";
        setSending((current) => ({...current, [actuator.type]: {action, at: Date.now()}}));
        setError(null);
        try {
            await commandApi.send(props.crop.id, actuator.id, action, on && chosen !== UNLIMITED ? chosen : undefined);
            props.onChanged();
        } catch (caught) {
            setSending((current) => ({...current, [actuator.type]: undefined}));
            setError(caught instanceof ApiError ? caught.message : "No se pudo enviar la orden");
            props.onChanged();
        }
    }

    function status(actuator: Actuator, on: boolean, waiting: CommandAction | undefined): string {
        if (waiting) return waiting === "ACTIVATE" ? "Encendiendo… esperando al dispositivo" : "Apagando… esperando al dispositivo";
        if (!on) return actuator.lastChangedAt ? `Apagado · ${timeAgo(actuator.lastChangedAt)}` : "Apagado";
        if (actuator.active) return "Encendido hasta que lo apagues";
        const until = actuator.runningUntil ? Date.parse(actuator.runningUntil) : null;
        return until ? `Encendido · se apaga en ${formatDuration(Math.max(1, Math.round((until - now()) / 1000)))}` : "Encendido";
    }

    return (
        <div class="space-y-5">
            <section class="card flex items-start justify-between gap-4 p-5">
                <div class="flex gap-3">
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700">
                        <Bot size={20}/></div>
                    <div>
                        <h3 class="font-semibold">Modo automático</h3>
                        <p class="text-sm text-muted">
                            El agente de IA ejecuta sus recomendaciones sobre los actuadores de este cultivo, con una
                            pausa de 10 minutos
                            entre acciones del mismo actuador.
                        </p>
                    </div>
                </div>
                <Switch label="Modo automático" checked={props.crop.automationEnabled} disabled={busy() === "automation"}
                        onChange={(enabled) => void run("automation", () => props.onAutomation(enabled))}/>
            </section>

            <Show when={error()}>
                {(err) => <Alert tone="danger">{err()}</Alert>}
            </Show>
            <Show when={!online()}>
                <Alert tone="warning" title="El cultivo está desconectado">
                    Los actuadores se controlan
                    cuando {props.crop.kind === "VIRTUAL" ? "la simulación" : "el dispositivo"} vuelve a
                    conectarse.
                </Alert>
            </Show>

            <section class="card p-5">
                <h3 class="font-semibold">Actuadores</h3>
                <p class="text-sm text-muted">Enciende o apaga cada uno con su switch; al encender eliges por cuánto
                    tiempo.</p>
                <ul class="mt-3 divide-y divide-line">
                    <For each={props.actuators}>
                        {(actuator) => {
                            const info = ACTUATORS[actuator.type];
                            const waiting = () => sentFromHere(actuator.type) ?? pending().get(actuator.type)?.action;
                            const on = () => waiting() ? waiting() === "ACTIVATE" : running().has(actuator.type);
                            const chosen = () => durations()[actuator.type] ?? info.defaultSeconds ?? UNLIMITED;
                            return (
                                <li class="flex flex-wrap items-center justify-between gap-3 py-3"
                                    data-actuator-row={actuator.type}>
                                    <div class="min-w-0">
                                        <p class="font-medium">{info.label}</p>
                                        <p class={`text-xs ${waiting() ? "text-water-700" : on() ? "text-leaf-700" : "text-muted"}`}>
                                            {status(actuator, on(), waiting())}
                                        </p>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <Show when={!on() && !waiting()}>
                                            <select value={chosen()} aria-label={`Duración de ${info.label}`}
                                                    disabled={!online()}
                                                    onChange={(event) => setDurations((current) => ({
                                                        ...current,
                                                        [actuator.type]: Number(event.currentTarget.value),
                                                    }))}
                                                    class="h-9 rounded-lg border border-line bg-white px-2 text-sm disabled:opacity-50">
                                                <For each={info.durations}>
                                                    {(seconds) => (
                                                        <option value={seconds}>{formatDuration(seconds)}</option>
                                                    )}
                                                </For>
                                                <Show when={info.unlimited}>
                                                    <option value={UNLIMITED}>Sin límite</option>
                                                </Show>
                                            </select>
                                        </Show>
                                        <Switch checked={on()} label={info.label} disabled={!online() || Boolean(waiting())}
                                                onChange={(next) => void toggle(actuator, next)}/>
                                        <Button size="sm" variant="ghost" aria-label={`Quitar ${info.label}`}
                                                disabled={on() || Boolean(waiting())}
                                                loading={busy() === `${actuator.id}-remove`}
                                                onClick={() => void run(`${actuator.id}-remove`, () => actuatorApi.remove(props.crop.id, actuator.id))}>
                                            <Trash2 size={14}/>
                                        </Button>
                                    </div>
                                </li>
                            );
                        }}
                    </For>
                    <Show when={props.actuators.length === 0}>
                        <p class="py-3 text-sm text-muted">Este cultivo no tiene actuadores.</p>
                    </Show>
                </ul>
                <Show when={available().length > 0}>
                    <div class="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-4">
                        <SelectField label="Agregar actuador" class="min-w-56 flex-1" value={newType()}
                                     onChange={(event) => setNewType(event.currentTarget.value as ActuatorType)}>
                            <option value="">Elige un tipo</option>
                            <For each={available()}>
                                {(type) => <option value={type}>{ACTUATORS[type].label}</option>}
                            </For>
                        </SelectField>
                        <Button icon={<Plus size={16}/>} disabled={!newType()} loading={busy() === "add"}
                                onClick={() => {
                                    const t = newType();
                                    if (t) {
                                        void run("add", async () => {
                                            await actuatorApi.add(props.crop.id, t);
                                            setNewType("");
                                        });
                                    }
                                }}>
                            Agregar
                        </Button>
                    </div>
                </Show>
            </section>

            <section class="card p-5">
                <h3 class="font-semibold">Últimos comandos</h3>
                <ul class="mt-3 divide-y divide-line text-sm">
                    <For each={props.commands}>
                        {(command) => (
                            <li class="flex flex-wrap items-center justify-between gap-2 py-2.5">
                                <div>
                                    <p class="font-medium">
                                        {describeAction(command.actuatorType, command.action, command.durationSeconds)}
                                    </p>
                                    <p class="text-xs text-muted">
                                        {command.source === "AGENT" ? "Agente de IA" : "Tú"} · {formatDateTime(command.createdAt)}
                                        {command.message ? ` · ${command.message}` : ""}
                                    </p>
                                </div>
                                <Badge
                                    tone={COMMAND_STATUS[command.status].tone}>{COMMAND_STATUS[command.status].label}</Badge>
                            </li>
                        )}
                    </For>
                    <Show when={props.commands.length === 0}>
                        <p class="py-2 text-muted">Todavía no se han enviado comandos.</p>
                    </Show>
                </ul>
            </section>
        </div>
    );
}
