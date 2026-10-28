import {AlertTriangle, RefreshCw, Sparkles, Users} from "lucide-solid";
import {For, Show} from "solid-js";
import {Button} from "../../../components/ui/Button";
import {Alert} from "../../../components/ui/Feedback";
import {useResource} from "../../../hooks/useResource";
import {overviewApi} from "../../../lib/api/services";
import type {Crop} from "../../../lib/api/types";
import {FleetActionsList} from "./FleetActionsList";

/** Lo que el asistente ve al mirar todos los cultivos juntos. */
export function FleetPanel(props: { crops: Crop[] }) {
    const fleet = useResource(() => overviewApi.fleet(), [], 5 * 60_000);
    const names = (ids: string[]) => ids.map((id) => props.crops.find((crop) => crop.id === id)?.name ?? "Cultivo");

    return (
        <section class="card overflow-hidden">
            <div class="flex items-start justify-between gap-3 bg-linear-to-r from-leaf-50 to-white p-5">
                <div>
                    <h2 class="flex items-center gap-2 text-lg font-semibold">
                        <Sparkles size={18} class="text-leaf-700"/> Asistente de IA · todos tus cultivos
                    </h2>
                    <p class="mt-1 text-sm leading-snug text-ink">
                        {fleet.data?.summary ?? (fleet.loading ? "Analizando tus cultivos…" : "")}
                    </p>
                </div>
                <Button variant="ghost" size="sm" icon={<RefreshCw size={14}/>} loading={fleet.loading}
                        onClick={() => void fleet.reload()} aria-label="Volver a analizar"/>
            </div>

            <div class="space-y-5 p-5 pt-2">
                <Show when={fleet.error}>
                    {(err) => <Alert tone="info" title="El asistente no está disponible">{err()}</Alert>}
                </Show>

                <Show when={fleet.data}>
                    {(data) => (
                        <>
                            <Show when={data().sharedIssues.length > 0}>
                                <div>
                                    <h3 class="flex items-center gap-2 text-sm font-semibold text-clay-600">
                                        <AlertTriangle size={16}/> Problemas del entorno
                                    </h3>
                                    <ul class="mt-2 space-y-2">
                                        <For each={data().sharedIssues}>
                                            {(issue) => (
                                                <li class="rounded-xl bg-sun-100 p-3 text-sm text-ink">
                                                    {issue.message}
                                                    <span
                                                        class="mt-1 block text-xs text-muted">{names(issue.cropIds).join(", ")}</span>
                                                </li>
                                            )}
                                        </For>
                                    </ul>
                                </div>
                            </Show>

                            <Show when={data().groups.length > 0}>
                                <div>
                                    <h3 class="flex items-center gap-2 text-sm font-semibold text-leaf-800">
                                        <Users size={16}/> Grupos con condiciones parecidas
                                    </h3>
                                    <ul class="mt-2 grid gap-2 sm:grid-cols-2">
                                        <For each={data().groups}>
                                            {(group) => (
                                                <li class="rounded-xl border border-line p-3">
                                                    <p class="text-sm font-semibold">{group.label}</p>
                                                    <p class="text-xs text-muted">{group.description}</p>
                                                    <div class="mt-2 flex flex-wrap gap-1">
                                                        <For each={names(group.cropIds)}>
                                                            {(name) => (
                                                                <span
                                                                    class="rounded-full bg-leaf-50 px-2 py-0.5 text-xs text-leaf-800">
                                                                    {name}
                                                                </span>
                                                            )}
                                                        </For>
                                                    </div>
                                                </li>
                                            )}
                                        </For>
                                    </ul>
                                </div>
                            </Show>

                            <div>
                                <h3 class="text-sm font-semibold text-leaf-800">Acciones sugeridas en bloque</h3>
                                <div class="mt-1">
                                    <FleetActionsList actions={data().actions} crops={props.crops}
                                                      onApplied={() => void fleet.reload()}/>
                                </div>
                            </div>
                        </>
                    )}
                </Show>
            </div>
        </section>
    );
}
