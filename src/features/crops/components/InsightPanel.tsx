import {
    BrainCircuit,
    CircleHelp,
    MapPinned,
    Minus,
    Play,
    RefreshCw,
    Sparkles,
    TrendingDown,
    TrendingUp,
} from "lucide-solid";
import {createSignal, For, Show} from "solid-js";
import {Button} from "../../../components/ui/Button";
import {Alert, Badge} from "../../../components/ui/Feedback";
import {describePlacement, METRICS} from "../../../lib/catalog";
import {describeAction, formatHoursAhead, formatMetric, timeAgo} from "../../../lib/format";
import {ApiError} from "../../../lib/api/client";
import type {Actuator, Insight, PlacementAdvice} from "../../../lib/api/types";
import {HealthGauge} from "./HealthGauge";
import {LearningCard} from "./LearningCard";

interface InsightPanelProps {
    insight: Insight | undefined;
    error: string | null;
    loading: boolean;
    actuators: Actuator[];
    onRefresh: () => void;
    onRunAction: (action: Insight["actions"][number], actuator: Actuator) => Promise<void>;
    onOpenTab?: (tab: string) => void;
}

const PLACEMENT_TONE = {
    OK: "border-leaf-500/30 bg-leaf-50",
    UNKNOWN: "border-line bg-surface",
    TIP: "border-water-500/30 bg-water-100",
    MOVE: "border-sun-500/40 bg-sun-100",
} as const;

/** El consejo de lugar: la planta puede estar donde se quiera, pero el asistente sube el tono si su salud lo sufre. */
function PlacementCard(props: { advice: PlacementAdvice; onOpenTab?: (tab: string) => void }) {
    const ideal = () => describePlacement({setting: props.advice.idealSetting, exposure: props.advice.idealExposure});
    return (
        <section class={`rounded-2xl border p-5 ${PLACEMENT_TONE[props.advice.level]}`} aria-label="Lugar del cultivo">
            <p class="flex items-center gap-2 text-sm font-semibold text-leaf-800"><MapPinned
                size={16}/> {props.advice.title}</p>
            <p class="mt-1 text-sm">{props.advice.message}</p>
            <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                <Show when={props.advice.level !== "OK" && ideal()}>
                    <span>Lugar ideal: {ideal()}</span>
                </Show>
                <Show when={props.advice.level !== "OK" && props.onOpenTab}>
                    <button type="button" onClick={() => props.onOpenTab?.("settings")}
                            class="font-semibold text-water-700 hover:underline">
                        {props.advice.level === "UNKNOWN" ? "Indicar dónde está" : "Cambiar el lugar"}
                    </button>
                </Show>
            </div>
        </section>
    );
}

const SEVERITY = {OK: "success", WARNING: "warning", CRITICAL: "danger"} as const;
const STATUS_TEXT = {LOW: "Bajo", OPTIMAL: "Ideal", HIGH: "Alto", REST: "Descanso"} as const;

export function InsightPanel(props: InsightPanelProps) {
    const [running, setRunning] = createSignal<string | null>(null);
    const [actionError, setActionError] = createSignal<string | null>(null);

    return (
        <Show when={!(props.error && !props.insight)} fallback={
            <Alert tone="info" title="El asistente todavía no puede evaluar">{props.error}</Alert>
        }>
            <Show when={props.insight} fallback={
                <p class="py-10 text-center text-sm text-muted">
                    {props.loading ? "Analizando tu cultivo…" : "Sin evaluación."}
                </p>
            }>
                {(insight) => {
                    const issues = () => insight().diagnosis.filter((item) => item.status !== "OPTIMAL" && item.status !== "REST");

                    return (
                        <div class="space-y-5">
                            <section class="card grid gap-6 p-5 md:grid-cols-[auto_1fr] md:items-center">
                                <HealthGauge index={insight().health.index} level={insight().health.level}
                                             label={insight().health.label}/>
                                <div>
                                    <p class="flex items-center gap-2 text-sm font-semibold text-leaf-700"><Sparkles
                                        size={16}/> Resumen del asistente</p>
                                    <p class="mt-2 text-lg leading-snug">{insight().summary}</p>
                                    <div class="mt-3 flex items-center gap-3 text-xs text-muted">
                                        <span>Evaluado {timeAgo(insight().evaluatedAt)}</span>
                                        <Button variant="ghost" size="sm" onClick={props.onRefresh}
                                                loading={props.loading}
                                                icon={<RefreshCw size={14}/>}>
                                            Volver a evaluar
                                        </Button>
                                    </div>
                                </div>
                            </section>

                            <Show when={insight().placement}>
                                {(placement) => <PlacementCard advice={placement()} onOpenTab={props.onOpenTab}/>}
                            </Show>

                            <Show when={insight().actions.length > 0}>
                                <section class="card p-5">
                                    <h3 class="font-semibold">Acciones sugeridas por el agente</h3>
                                    <Show when={actionError()}>
                                        {(err) => <div class="mt-3"><Alert tone="danger">{err()}</Alert></div>}
                                    </Show>
                                    <ul class="mt-3 divide-y divide-line">
                                        <For each={insight().actions}>
                                            {(action) => {
                                                const actuator = () => props.actuators.find((item) => item.type === action.actuator);
                                                const key = `${action.actuator}-${action.action}`;
                                                return (
                                                    <li class="flex flex-wrap items-center justify-between gap-3 py-3">
                                                        <div>
                                                            <p class="font-medium">
                                                                {describeAction(action.actuator, action.action, action.durationSeconds)}
                                                            </p>
                                                            <p class="text-sm text-muted">{action.reason}</p>
                                                        </div>
                                                        <Show when={actuator()}>
                                                            {(act) => (
                                                                <Button size="sm" variant="secondary"
                                                                        icon={<Play size={14}/>}
                                                                        loading={running() === key}
                                                                        onClick={async () => {
                                                                            setRunning(key);
                                                                            setActionError(null);
                                                                            try {
                                                                                await props.onRunAction(action, act());
                                                                            } catch (caught) {
                                                                                setActionError(caught instanceof ApiError ? caught.message : "No se pudo ejecutar la acción");
                                                                            } finally {
                                                                                setRunning(null);
                                                                            }
                                                                        }}>
                                                                    Ejecutar
                                                                </Button>
                                                            )}
                                                        </Show>
                                                    </li>
                                                );
                                            }}
                                        </For>
                                    </ul>
                                </section>
                            </Show>

                            <Outlook insight={insight()}/>

                            <Show when={insight().learning}>
                                {(learning) => <LearningCard learning={learning()}/>}
                            </Show>

                            <div class="grid gap-5 lg:grid-cols-2">
                                <section class="card p-5">
                                    <h3 class="font-semibold">Diagnóstico por variable</h3>
                                    <Show when={issues().length === 0}>
                                        <p class="mt-2 text-sm text-muted">Todas las variables están en su rango
                                            ideal.</p>
                                    </Show>
                                    <ul class="mt-3 space-y-3">
                                        <For each={insight().diagnosis}>
                                            {(item) => (
                                                <li class="rounded-xl bg-surface p-3">
                                                    <div class="flex items-center justify-between gap-2">
                                                        <p class="text-sm font-semibold">{METRICS[item.parameter]?.label ?? item.parameter}</p>
                                                        <Badge
                                                            tone={item.status === "REST" ? "info" : SEVERITY[item.severity]}>{STATUS_TEXT[item.status]} · {formatMetric(item.parameter, item.value)}</Badge>
                                                    </div>
                                                    <Show when={item.status !== "OPTIMAL"}>
                                                        <p class="mt-1 text-sm text-muted">{item.message}</p>
                                                        <Show when={item.recommendation}>
                                                            <p class="mt-1 text-sm text-leaf-800">{item.recommendation}</p>
                                                        </Show>
                                                    </Show>
                                                </li>
                                            )}
                                        </For>
                                    </ul>
                                </section>

                                <div class="space-y-5">
                                    <section class="card p-5">
                                        <h3 class="flex items-center gap-2 font-semibold"><BrainCircuit size={18}
                                                                                                        class="text-leaf-700"/> Conclusiones
                                            del sistema experto</h3>
                                        <ul class="mt-3 space-y-3">
                                            <For each={insight().conclusions}>
                                                {(conclusion) => (
                                                    <li>
                                                        <p class="text-sm font-semibold">{conclusion.title}
                                                            <span
                                                                class="ml-2 text-xs font-normal text-muted">certeza {Math.round(conclusion.certainty * 100)} %</span>
                                                        </p>
                                                        <p class="text-sm text-muted">{conclusion.message}</p>
                                                    </li>
                                                )}
                                            </For>
                                            <Show when={insight().conclusions.length === 0}>
                                                <p class="text-sm text-muted">Sin conclusiones para esta lectura.</p>
                                            </Show>
                                        </ul>
                                    </section>

                                    <section class="card p-5">
                                        <h3 class="font-semibold">Predicciones de los modelos</h3>
                                        <ul class="mt-3 space-y-3">
                                            <For each={insight().predictions}>
                                                {(prediction) => (
                                                    <li>
                                                        <div class="flex justify-between text-sm">
                                                            <span>{prediction.label}</span>
                                                            <span
                                                                class="font-semibold">{Math.round(prediction.probability * 100)} %</span>
                                                        </div>
                                                        <div class="mt-1 h-2 rounded-full bg-surface">
                                                            <div class="h-2 rounded-full bg-leaf-500"
                                                                 style={{"width": `${Math.round(prediction.probability * 100)}%`}}/>
                                                        </div>
                                                        <p class="mt-0.5 text-xs text-muted">{prediction.model}</p>
                                                    </li>
                                                )}
                                            </For>
                                        </ul>
                                    </section>
                                </div>
                            </div>

                            <details class="card p-5 text-sm">
                                <summary class="flex cursor-pointer items-center gap-2 font-semibold"><CircleHelp
                                    size={16}/> ¿Cómo
                                    decide el asistente?
                                </summary>
                                <div class="mt-3 space-y-2 text-muted">
                                    <p><strong class="text-ink">Sistema experto:</strong> compara cada lectura con los
                                        rangos
                                        ideales de la especie y encadena reglas de agronomía; la certeza indica qué tan
                                        confiable es
                                        cada conclusión.</p>
                                    <p><strong class="text-ink">Lógica difusa:</strong> mide qué tan lejos está cada
                                        variable de su
                                        rango y lo resume en el índice de salud, dando más peso al pH, la temperatura y
                                        el sustrato.</p>
                                    <p><strong class="text-ink">Aprendizaje automático:</strong> una regresión logística
                                        estima la
                                        necesidad de ventilar, una red neuronal la de corregir el pH y un Isolation
                                        Forest detecta
                                        lecturas atípicas que pueden ser fallas de sensor.</p>
                                    <p><strong class="text-ink">Aprendizaje continuo:</strong> con las lecturas reales
                                        de todos los
                                        cultivos de la especie aprende a anticipar riego y calor en la próxima hora,
                                        estima la humedad
                                        del sustrato y reconoce estados típicos y lecturas poco habituales. Se reentrena
                                        solo cuando
                                        llegan datos nuevos.</p>
                                    <p><strong class="text-ink">Agente:</strong> con el modo automático activo ejecuta
                                        estas
                                        acciones por su cuenta, con una pausa de 10 minutos entre acciones del mismo
                                        actuador.</p>
                                </div>
                            </details>
                        </div>
                    );
                }}
            </Show>
        </Show>
    );
}

const TREND = {
    RISING: {icon: TrendingUp, label: "Sube"},
    FALLING: {icon: TrendingDown, label: "Baja"},
    STABLE: {icon: Minus, label: "Estable"},
} as const;

/** Pronóstico de las próximas horas y de qué variables depende el índice de salud. */
function Outlook(props: { insight: Insight }) {
    const forecasts = () => props.insight.forecasts ?? [];
    const factors = () => Object.entries(props.insight.health.byParameter ?? {})
        .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0)) as [keyof typeof METRICS, number][];

    return (
        <Show when={forecasts().length > 0 || factors().length > 0}>
            <div class="grid gap-5 lg:grid-cols-2">
                <Show when={forecasts().length > 0}>
                    <section class="card p-5">
                        <h3 class="font-semibold">Pronóstico de las próximas horas</h3>
                        <p class="text-sm text-muted">Tendencia de cada variable según las últimas lecturas.</p>
                        <ul class="mt-3 space-y-2">
                            <For each={forecasts()}>
                                {(forecast) => {
                                    const trend = TREND[forecast.trend];
                                    const TrendIcon = trend.icon;
                                    const urgent = forecast.hoursToLimit != null && forecast.hoursToLimit <= 3;
                                    return (
                                        <li class={`flex gap-3 rounded-xl p-3 ${urgent ? "bg-sun-100" : "bg-surface"}`}>
                                            <TrendIcon size={18}
                                                       class={`mt-0.5 shrink-0 ${urgent ? "text-clay-600" : "text-leaf-700"}`}
                                                       aria-label={trend.label}/>
                                            <div class="min-w-0">
                                                <p class="text-sm font-semibold">
                                                    {METRICS[forecast.parameter]?.label ?? forecast.parameter}
                                                    <span class="ml-2 font-normal text-muted">
                                                        en 3 h ≈ {formatMetric(forecast.parameter, forecast.expectedIn3h)}
                                                    </span>
                                                </p>
                                                <p class="text-sm text-muted">{forecast.message}</p>
                                                <Show when={forecast.hoursToLimit != null}>
                                                    <p class="mt-0.5 text-xs font-semibold text-clay-600">
                                                        Saldrá del rango ideal en {formatHoursAhead(forecast.hoursToLimit!)}
                                                    </p>
                                                </Show>
                                            </div>
                                        </li>
                                    );
                                }}
                            </For>
                        </ul>
                    </section>
                </Show>
                <Show when={factors().length > 0}>
                    <section class="card p-5">
                        <h3 class="font-semibold">De qué depende el índice</h3>
                        <p class="text-sm text-muted">Salud de cada variable; las más bajas son las que restan.</p>
                        <ul class="mt-3 space-y-2.5">
                            <For each={factors()}>
                                {([parameter, score]) => (
                                    <li>
                                        <div class="flex justify-between text-sm">
                                            <span>{METRICS[parameter]?.label ?? parameter}</span>
                                            <span class="font-semibold">{Math.round(score)}</span>
                                        </div>
                                        <div class="mt-1 h-2 overflow-hidden rounded-full bg-surface">
                                            <div class="h-full rounded-full" style={{
                                                "width": `${score}%`,
                                                "background-color": score >= 85 ? "#009A64" : score >= 50 ? "#C98D12" : "#D64545",
                                            }}/>
                                        </div>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </section>
                </Show>
            </div>
        </Show>
    );
}
