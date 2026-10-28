import {A} from "@solidjs/router";
import {AlertTriangle, Bot, History, ListChecks, Sparkles, UserRound} from "lucide-solid";
import {createSignal, For, Show} from "solid-js";
import {HeaderStat, PageHeader} from "../../components/layout/PageHeader";
import {Alert, Badge, EmptyState} from "../../components/ui/Feedback";
import {PageLoader} from "../../components/ui/Spinner";
import {usePageMeta} from "../../hooks/usePageMeta";
import {useResource} from "../../hooks/useResource";
import {commandApi, cropApi, overviewApi} from "../../lib/api/services";
import {COMMAND_STATUS} from "../../lib/catalog";
import {describeAction, formatDateTime, timeAgo} from "../../lib/format";
import type {Command, CommandStatus} from "../../lib/api/types";
import {FleetActionsList} from "../overview/components/FleetActionsList";

type Tab = "suggested" | "history";
type SourceFilter = "ALL" | Command["source"];

/** Acciones: lo que sugiere el asistente para todos los cultivos y todo lo que se ha ejecutado. */
export function ActionsPage() {
    usePageMeta("Acciones");
    const [tab, setTab] = createSignal<Tab>("suggested");
    const [status, setStatus] = createSignal<CommandStatus | "ALL">("ALL");
    const [source, setSource] = createSignal<SourceFilter>("ALL");
    const crops = useResource(() => cropApi.list(), [], 60_000);
    const commands = useResource(() => commandApi.listAll(100), [], 20_000);
    const fleet = useResource(() => overviewApi.fleet(), [], 5 * 60_000);

    const cropName = (id: string) => crops.data?.find((crop) => crop.id === id)?.name ?? "Cultivo eliminado";
    const history = () => (commands.data ?? []).filter((command) => (status() === "ALL" || command.status === status())
        && (source() === "ALL" || command.source === source()));
    const executed = () => (commands.data ?? []).filter((command) => command.status === "EXECUTED").length;
    const byAgent = () => (commands.data ?? []).filter((command) => command.source === "AGENT").length;

    return (
        <div class="space-y-6">
            <PageHeader eyebrow="Centro de acciones" title="Acciones" icon={<ListChecks size={24}/>}
                        description="Aplica lo que recomienda el asistente a varios cultivos y revisa todo lo que se ha ejecutado.">
                <div class="grid grid-cols-3 gap-3">
                    <HeaderStat label="Sugeridas ahora" value={fleet.data?.actions.length ?? "—"}/>
                    <HeaderStat label="Ejecutadas (últimas 100)" value={commands.data ? executed() : "—"}/>
                    <HeaderStat label="Del agente de IA" value={commands.data ? byAgent() : "—"}/>
                </div>
            </PageHeader>

            <div class="flex gap-2 rounded-xl bg-white p-1 shadow-[var(--shadow-card)] sm:w-fit" role="tablist">
                <For each={[["suggested", "Sugeridas por la IA", Sparkles], ["history", "Historial", History]] as const}>
                    {([key, label, Icon]) => (
                        <button type="button" role="tab" aria-selected={tab() === key} onClick={() => setTab(key)}
                                class={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold sm:flex-none
                  ${tab() === key ? "bg-leaf-700 text-white" : "text-muted hover:text-ink"}`}>
                            <Icon size={16}/> {label}
                        </button>
                    )}
                </For>
            </div>

            <Show when={tab() === "suggested"} fallback={
                <section class="card p-5" role="tabpanel">
                    <div class="flex flex-wrap gap-3">
                        <label class="text-sm">
                            <span class="mr-2 font-semibold">Estado</span>
                            <select value={status()}
                                    onChange={(event) => setStatus(event.currentTarget.value as CommandStatus | "ALL")}
                                    class="rounded-lg border border-line bg-white px-2 py-1">
                                <option value="ALL">Todos</option>
                                <For each={Object.entries(COMMAND_STATUS)}>
                                    {([value, info]) => <option value={value}>{info.label}</option>}
                                </For>
                            </select>
                        </label>
                        <label class="text-sm">
                            <span class="mr-2 font-semibold">Origen</span>
                            <select value={source()}
                                    onChange={(event) => setSource(event.currentTarget.value as SourceFilter)}
                                    class="rounded-lg border border-line bg-white px-2 py-1">
                                <option value="ALL">Todos</option>
                                <option value="USER">Personas</option>
                                <option value="AGENT">Agente de IA</option>
                            </select>
                        </label>
                    </div>
                    <Show when={commands.error}>
                        {(err) => <div class="mt-3"><Alert tone="danger">{err()}</Alert></div>}
                    </Show>
                    <Show when={!(commands.loading && !commands.data)} fallback={<PageLoader/>}>
                        <Show when={history().length > 0} fallback={
                            <div class="mt-4"><EmptyState icon={<History size={24}/>} title="Sin acciones">
                                Aquí aparecerán las órdenes enviadas a tus cultivos, por ti o por el agente.
                            </EmptyState></div>
                        }>
                            <ul class="mt-4 divide-y divide-line">
                                <For each={history()}>
                                    {(command) => (
                                        <li class="flex flex-wrap items-start justify-between gap-3 py-3">
                                            <div class="min-w-0">
                                                <p class="font-medium">{describeAction(command.actuatorType, command.action, command.durationSeconds)}</p>
                                                <p class="text-sm text-muted">
                                                    <A href={`/app/crops/${command.cropId}`}
                                                       class="font-medium text-leaf-800 hover:underline">
                                                        {cropName(command.cropId)}
                                                    </A>
                                                    {command.reason ? ` · ${command.reason}` : ""}
                                                </p>
                                                <Show when={command.message}>
                                                    <p class="text-xs text-muted">{command.message}</p>
                                                </Show>
                                            </div>
                                            <div class="flex flex-col items-end gap-1">
                                                <div class="flex gap-1.5">
                                                    <Badge tone={command.source === "AGENT" ? "info" : "neutral"}>
                                                        {command.source === "AGENT" ? <><Bot size={12}/> Agente</> : <>
                                                            <UserRound size={12}/> Persona</>}
                                                    </Badge>
                                                    <Badge
                                                        tone={COMMAND_STATUS[command.status].tone}>{COMMAND_STATUS[command.status].label}</Badge>
                                                </div>
                                                <time dateTime={command.createdAt} title={formatDateTime(command.createdAt)}
                                                      class="text-xs text-muted">
                                                    {timeAgo(command.createdAt)}
                                                </time>
                                            </div>
                                        </li>
                                    )}
                                </For>
                            </ul>
                        </Show>
                    </Show>
                </section>
            }>
                <section class="card p-5" role="tabpanel">
                    <Show when={fleet.error}>
                        {(err) => <Alert tone="info" title="El asistente no está disponible">{err()}</Alert>}
                    </Show>
                    <Show when={!(fleet.loading && !fleet.data)} fallback={<PageLoader/>}>
                        <Show when={fleet.data}>
                            {(data) => (
                                <>
                                    <p class="mb-2 text-sm text-muted">{data().summary}</p>
                                    <Show when={data().sharedIssues.length > 0}>
                                        <ul class="mb-4 space-y-2">
                                            <For each={data().sharedIssues}>
                                                {(issue) => (
                                                    <li class="flex gap-2 rounded-xl bg-sun-100 p-3 text-sm">
                                                        <AlertTriangle size={16} class="mt-0.5 shrink-0 text-clay-600"/>
                                                        <span>{issue.message}
                                                            <span
                                                                class="block text-xs text-muted">{issue.cropIds.map(cropName).join(", ")}</span>
                                                        </span>
                                                    </li>
                                                )}
                                            </For>
                                        </ul>
                                    </Show>
                                    <FleetActionsList actions={data().actions} crops={crops.data ?? []}
                                                      onApplied={() => {
                                                          void commands.reload();
                                                          void fleet.reload();
                                                      }}/>
                                </>
                            )}
                        </Show>
                    </Show>
                </section>
            </Show>
        </div>
    );
}
