import {CheckCircle2, Database, GraduationCap, Hourglass, Radar, ShieldCheck} from "lucide-solid";
import {For, Show} from "solid-js";
import {HeaderStat, PageHeader} from "../../components/layout/PageHeader";
import {Alert, Badge, EmptyState} from "../../components/ui/Feedback";
import {PageLoader} from "../../components/ui/Spinner";
import {usePageMeta} from "../../hooks/usePageMeta";
import {useResource} from "../../hooks/useResource";
import {insightApi} from "../../lib/api/services";
import {timeAgo} from "../../lib/format";
import type {CropTypeLearning, ModelCard} from "../../lib/api/types";

const STEPS = [
    ["Datos", "Cada lectura real llega a la IA con el cultivo seudonimizado: aprende de la serie, no de la persona."],
    ["Calidad", "Se mide la completitud y la validez, y se apartan los valores atípicos (rango intercuartílico)."],
    ["Etiquetas", "Lo que pasó en la hora siguiente enseña: ¿se secó el sustrato?, ¿subió la temperatura?"],
    ["Comparación", "Siete modelos compiten con validación cruzada temporal frente a una línea base."],
    ["Ajuste", "El mejor se afina con búsqueda de hiperparámetros y compite con el modelo vigente."],
    ["No supervisado", "K-Means descubre estados típicos y un Isolation Forest reconoce lo poco habitual."],
] as const;

/** Qué ha aprendido el asistente de las lecturas reales, especie por especie. Solo datos agregados. */
export function LearningPage() {
    usePageMeta("Aprendizaje de la IA");
    const status = useResource(() => insightApi.learning(), [], 60_000);
    const data = () => status.data;
    const trained = () => data()?.cropTypes.reduce((total, item) =>
        total + item.models.filter((model) => model.status === "TRAINED").length, 0) ?? 0;

    return (
        <div class="space-y-6">
            <PageHeader eyebrow="Inteligencia artificial" title="Aprendizaje" icon={<GraduationCap size={24}/>}
                        description="El asistente mejora con cada lectura real: aprende a anticipar riego y calor, estima el sustrato y reconoce lo poco habitual.">
                <div class="grid grid-cols-3 gap-3">
                    <HeaderStat label="Lecturas reales"
                                value={data() ? data()!.storedReadings.toLocaleString("es-CO") : "—"}/>
                    <HeaderStat label="Especies" value={data() ? data()!.cropTypes.length : "—"}/>
                    <HeaderStat label="Modelos entrenados" value={data() ? trained() : "—"}/>
                </div>
            </PageHeader>

            <section class="card p-5" aria-labelledby="how-title">
                <h2 id="how-title" class="font-semibold">Cómo aprende</h2>
                <ol class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <For each={STEPS}>
                        {([title, text], index) => (
                            <li class="flex gap-3 rounded-xl bg-surface p-3">
                                <span
                                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-leaf-700 text-sm font-bold text-white">
                                    {index() + 1}
                                </span>
                                <span class="text-sm"><strong class="block">{title}</strong><span
                                    class="text-muted">{text}</span></span>
                            </li>
                        )}
                    </For>
                </ol>
                <Show when={data()}>
                    {(d) => (
                        <p class="mt-3 text-xs text-muted">
                            Una especie empieza a entrenar con {d().minSamples} lecturas y se reentrena
                            cada {d().retrainEvery} lecturas
                            nuevas. {d().persistent ? "Los modelos se guardan y sobreviven a los reinicios." : "Este servidor guarda lo aprendido solo en memoria."}
                        </p>
                    )}
                </Show>
            </section>

            <Show when={status.error}>
                {(err) => <Alert tone="info" title="El asistente no está disponible">{err()}</Alert>}
            </Show>
            <Show when={!(status.loading && !data())} fallback={<PageLoader/>}>
                <Show when={!(data() && data()!.cropTypes.length === 0)} fallback={
                    <EmptyState icon={<Database size={24}/>} title="Aún no hay lecturas reales">
                        Conecta un cultivo real y el asistente empezará a aprender de sus lecturas.
                    </EmptyState>
                }>
                    <For each={data()?.cropTypes ?? []}>
                        {(item) => <SpeciesLearning item={item}/>}
                    </For>
                </Show>
            </Show>
        </div>
    );
}

function SpeciesLearning(props: { item: CropTypeLearning }) {
    return (
        <section class="card p-5" aria-labelledby={`species-${props.item.cropType}`}>
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 id={`species-${props.item.cropType}`} class="text-lg font-semibold">{props.item.name}</h2>
                    <p class="text-sm text-muted">
                        {plural(props.item.readings, "lectura", "lecturas")} de {plural(props.item.crops, "cultivo", "cultivos")}
                        {props.item.trainedAt
                            ? ` · entrenado ${timeAgo(props.item.trainedAt)} · ${plural(props.item.newSinceTraining, "lectura nueva", "lecturas nuevas")} desde entonces`
                            : " · aún sin entrenar"}
                    </p>
                </div>
                {props.item.training ? <Badge tone="info"><Hourglass size={12}/> Entrenando</Badge>
                    : props.item.trainedAt ? <Badge tone="success"><CheckCircle2 size={12}/> Al día</Badge>
                        : <Badge tone="neutral">Juntando datos</Badge>}
            </div>

            <Show when={props.item.quality}>
                {(q) => (
                    <p class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span class="flex items-center gap-1.5 font-semibold"><ShieldCheck size={16}
                                                                                           class="text-leaf-700"/>
                            Calidad de datos {Math.round(q().score * 100)} %</span>
                        <span class="text-muted">completitud {Math.round(q().completeness * 100)} %</span>
                        <span class="text-muted">validez {Math.round(q().validity * 100)} %</span>
                        <span class="text-muted">{q().outliers} atípicos apartados</span>
                    </p>
                )}
            </Show>

            <div class="mt-4 grid gap-4 lg:grid-cols-3">
                <For each={props.item.models}>
                    {(model) => <ModelSummary model={model}/>}
                </For>
            </div>

            <Show when={props.item.states || props.item.anomaly}>
                <div class="mt-4 grid gap-4 lg:grid-cols-2">
                    <Show when={props.item.states}>
                        {(states) => (
                            <div class="rounded-xl border border-line p-4">
                                <h3 class="flex items-center gap-2 text-sm font-semibold"><Radar size={16}
                                                                                                 class="text-leaf-700"/>
                                    Estados de operación</h3>
                                <p class="text-xs text-muted">K-Means con {states().k} grupos elegidos por silueta
                                    ({states().silhouette.toFixed(2)}).</p>
                                <ul class="mt-3 space-y-2">
                                    <For each={states().clusters}>
                                        {(cluster) => (
                                            <li>
                                                <div class="flex justify-between gap-3 text-sm">
                                                    <span class="font-medium">{cluster.label}</span>
                                                    <span class="text-muted">{Math.round(cluster.share * 100)} %</span>
                                                </div>
                                                <div class="mt-1 h-2 rounded-full bg-surface">
                                                    <div class="h-2 rounded-full bg-leaf-600"
                                                         style={{"width": `${Math.round(cluster.share * 100)}%`}}/>
                                                </div>
                                                <p class="mt-0.5 text-xs text-muted">{cluster.description}</p>
                                            </li>
                                        )}
                                    </For>
                                </ul>
                            </div>
                        )}
                    </Show>
                    <Show when={props.item.anomaly}>
                        {(anomaly) => (
                            <div class="rounded-xl border border-line p-4 text-sm">
                                <h3 class="font-semibold">Lecturas poco habituales</h3>
                                <p class="mt-1 text-muted">
                                    Un Isolation Forest entrenado
                                    con {anomaly().samples.toLocaleString("es-CO")} lecturas reales marca como poco
                                    habitual el {Math.round(anomaly().contamination * 100)} % más raro. Si un cultivo
                                    cae ahí sin que nada cambie,
                                    conviene revisar los sensores.
                                </p>
                            </div>
                        )}
                    </Show>
                </div>
            </Show>
        </section>
    );
}

function plural(count: number, one: string, many: string): string {
    return `${count.toLocaleString("es-CO")} ${count === 1 ? one : many}`;
}

/** Tarjeta de una tarea: modelo elegido, su puntaje frente a la línea base y la comparación de candidatos. */
export function ModelSummary(props: { model: ModelCard }) {
    const lowerIsBetter = () => props.model.task === "moisture_1h";
    const format = (value: number | null | undefined) => value == null ? "—" : value.toFixed(2);
    const ranked = () => [...props.model.candidates].sort((a, b) =>
        lowerIsBetter() ? (a.score ?? Infinity) - (b.score ?? Infinity) : (b.score ?? -Infinity) - (a.score ?? -Infinity));

    return (
        <article class="rounded-xl border border-line p-4">
            <div class="flex items-start justify-between gap-2">
                <h3 class="text-sm font-semibold">{props.model.label}</h3>
                <Badge tone={props.model.status === "TRAINED" ? "success" : "neutral"}>
                    {props.model.status === "TRAINED" ? `v${props.model.version}` : "Pendiente"}
                </Badge>
            </div>
            <Show when={props.model.status === "TRAINED"}>
                <p class="mt-1 text-sm">
                    <strong>{props.model.model}</strong>
                    <span class="block text-xs text-muted">
                        {props.model.metric} {format(props.model.holdout)} en las lecturas más recientes (línea base {format(props.model.baseline)})
                    </span>
                </p>
            </Show>
            <Show when={props.model.reason}>
                <p class="mt-1 text-xs text-muted">{props.model.reason}</p>
            </Show>
            <Show when={ranked().length > 0}>
                <table class="mt-3 w-full text-xs">
                    <caption class="sr-only">Comparación de modelos para {props.model.label}</caption>
                    <thead>
                    <tr class="text-left text-muted">
                        <th scope="col" class="py-1 font-medium">Modelo</th>
                        <th scope="col"
                            class="py-1 text-right font-medium">{lowerIsBetter() ? "Error" : "F1"} (validación)
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    <For each={ranked()}>
                        {(candidate) => (
                            <tr class={candidate.model === props.model.model ? "font-semibold text-leaf-800" : ""}>
                                <td class="py-0.5">{candidate.model}</td>
                                <td class="py-0.5 text-right tabular-nums">
                                    {format(candidate.score)}{candidate.std != null &&
                                    <span class="text-muted"> ± {candidate.std.toFixed(2)}</span>}
                                </td>
                            </tr>
                        )}
                    </For>
                    </tbody>
                </table>
            </Show>
            <p class="mt-2 text-[11px] text-muted">{props.model.samples.toLocaleString("es-CO")} ejemplos
                {props.model.positives != null && ` · ${props.model.positives.toLocaleString("es-CO")} casos positivos`}</p>
        </article>
    );
}
