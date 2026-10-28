import {A} from "@solidjs/router";
import {GraduationCap, Radar, Waves} from "lucide-solid";
import {For, Show} from "solid-js";
import {Badge} from "../../../components/ui/Feedback";
import {formatMetric, timeAgo} from "../../../lib/format";
import type {Learning} from "../../../lib/api/types";

/** Lo que el asistente aprendió de las lecturas reales de la especie, aplicado a la lectura actual. */
export function LearningCard(props: { learning: Learning }) {
    const learned = () => props.learning.source === "LEARNED";
    const predictions = () => props.learning.predictions ?? [];

    return (
        <section class="card p-5" aria-labelledby="learning-title">
            <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h3 id="learning-title" class="flex items-center gap-2 font-semibold">
                        <GraduationCap size={18} class="text-leaf-700"/> Aprendido de cultivos reales
                    </h3>
                    <p class="text-sm text-muted">{props.learning.message}</p>
                </div>
                <Badge tone={learned() ? "success" : "neutral"}>
                    {learned() ? `Entrenado ${props.learning.trainedAt ? timeAgo(props.learning.trainedAt) : ""}`.trim() : "Aprendiendo"}
                </Badge>
            </div>

            <Show when={learned()}>
                <div class="mt-4 grid gap-3 md:grid-cols-3">
                    <Show when={props.learning.state}>
                        {(state) => (
                            <div class="rounded-xl bg-surface p-3">
                                <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                                    <Radar size={14}/> Estado de operación
                                </p>
                                <p class="mt-1 font-semibold">{state().label}</p>
                                <p class="text-xs text-muted">
                                    {state().description} Aparece en el {Math.round(state().share * 100)} % de
                                    las lecturas.
                                </p>
                            </div>
                        )}
                    </Show>
                    <Show when={props.learning.moisture}>
                        {(moisture) => (
                            <div class="rounded-xl bg-surface p-3">
                                <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                                    <Waves size={14}/> Sustrato en 1 hora
                                </p>
                                <p class="mt-1 font-semibold">{formatMetric("soilMoisture", moisture().expectedIn1h)}</p>
                                <p class="text-xs text-muted">
                                    {moisture().model}
                                    {moisture().mae != null && ` · error medio ${moisture().mae!.toFixed(1)} %`}
                                </p>
                            </div>
                        )}
                    </Show>
                    <Show when={props.learning.anomaly}>
                        {(anomaly) => (
                            <div class={`rounded-xl p-3 ${anomaly().unusual ? "bg-sun-100" : "bg-surface"}`}>
                                <p class="text-xs font-semibold uppercase tracking-wide text-muted">Lectura para la
                                    especie</p>
                                <p class="mt-1 font-semibold">{anomaly().unusual ? "Poco habitual" : "Habitual"}</p>
                                <p class="text-xs text-muted">Isolation Forest entrenado con lecturas reales</p>
                            </div>
                        )}
                    </Show>
                </div>
            </Show>

            <Show when={predictions().length > 0}>
                <ul class="mt-4 space-y-3">
                    <For each={predictions()}>
                        {(prediction) => (
                            <li>
                                <div class="flex justify-between gap-3 text-sm">
                                    <span>{prediction.label}</span>
                                    <span class="font-semibold">{Math.round(prediction.probability * 100)} %</span>
                                </div>
                                <div class="mt-1 h-2 rounded-full bg-surface">
                                    <div class="h-2 rounded-full bg-water-500"
                                         style={{"width": `${Math.round(prediction.probability * 100)}%`}}/>
                                </div>
                                <p class="mt-0.5 text-xs text-muted">
                                    {prediction.model}
                                    {prediction.score != null && ` · ${prediction.metric} ${prediction.score.toFixed(2)} en las lecturas más recientes`}
                                </p>
                            </li>
                        )}
                    </For>
                </ul>
            </Show>

            <p class="mt-4 text-xs text-muted">
                <A href="/app/learning" class="font-semibold text-water-700 hover:underline">
                    Ver cómo aprende el asistente
                </A>
            </p>
        </section>
    );
}
