import {ChartLine} from "lucide-solid";
import {createMemo, createSignal, For, Show} from "solid-js";
import {Alert} from "../../../components/ui/Feedback";
import {useResource} from "../../../hooks/useResource";
import {overviewApi} from "../../../lib/api/services";
import {MAX_COMPARED, METRICS, PRIMARY_METRICS} from "../../../lib/catalog";
import {formatDateTime, formatMetric, formatTime} from "../../../lib/format";
import type {Crop, MetricKey} from "../../../lib/api/types";
import {useComparedCrops} from "../useComparedCrops";

const PERIODS = [{hours: 6, label: "6 h"}, {hours: 24, label: "24 h"}, {hours: 168, label: "7 días"}];

export function MetricComparison(props: { crops: Crop[] }) {
    const [metric, setMetric] = createSignal<MetricKey>("temperature");
    const [hours, setHours] = createSignal(24);
    const [hoverIdx, setHoverIdx] = createSignal<number | null>(null);
    const compared = useComparedCrops(() => props.crops);
    const series = useResource(() => overviewApi.series(metric(), hours()), () => [metric(), hours()], 60_000);

    const rows = createMemo(() => {
        const byTime = new Map<number, { time: number; values: Record<string, number> }>();
        for (const item of series.data?.series ?? []) {
            for (const point of item.points) {
                const time = new Date(point.time).getTime();
                const row = byTime.get(time) ?? {time, values: {}};
                row.values[item.cropId] = point.value;
                byTime.set(time, row);
            }
        }
        return [...byTime.values()].sort((a, b) => a.time - b.time);
    });

    const info = () => METRICS[metric()];
    const visible = createMemo(() =>
        compared.selected.filter((crop) => rows().some((row) => row.values[crop.id] !== undefined)),
    );

    const chart = createMemo(() => {
        const currentRows = rows();
        const currentVisible = visible();
        if (currentRows.length === 0 || currentVisible.length === 0) return null;

        const width = 760;
        const height = 260;
        const padLeft = 48;
        const padRight = 16;
        const padTop = 12;
        const padBottom = 28;
        const plotW = width - padLeft - padRight;
        const plotH = height - padTop - padBottom;

        const allValues: number[] = [];
        for (const row of currentRows) {
            for (const crop of currentVisible) {
                const val = row.values[crop.id];
                if (val !== undefined) allValues.push(val);
            }
        }
        if (allValues.length === 0) return null;

        let minVal = Math.min(...allValues);
        let maxVal = Math.max(...allValues);
        if (minVal === maxVal) {
            minVal -= 1;
            maxVal += 1;
        } else {
            const pad = (maxVal - minVal) * 0.08;
            minVal -= pad;
            maxVal += pad;
        }

        const minTime = currentRows[0]!.time;
        const maxTime = currentRows[currentRows.length - 1]!.time;
        const timeSpan = Math.max(1, maxTime - minTime);

        const toX = (t: number) =>
            currentRows.length === 1 ? padLeft + plotW / 2 : padLeft + ((t - minTime) / timeSpan) * plotW;
        const toY = (v: number) => padTop + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

        const lines = currentVisible.map((crop) => {
            const pts = currentRows
                .filter((row) => row.values[crop.id] !== undefined)
                .map((row) => ({x: toX(row.time), y: toY(row.values[crop.id]!)}));
            const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
            return {crop, color: compared.colorOf(crop.id) ?? "#067A52", path};
        });

        const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
            const val = minVal + t * (maxVal - minVal);
            return {value: val, y: toY(val)};
        });

        const xTickCount = Math.min(5, currentRows.length);
        const xTicks = Array.from({length: xTickCount}, (_, idx) => {
            const row = currentRows[Math.floor((idx * (currentRows.length - 1)) / Math.max(1, xTickCount - 1))]!;
            return {time: row.time, x: toX(row.time)};
        });

        const rowCoords = currentRows.map((row) => ({...row, x: toX(row.time)}));

        return {width, height, padLeft, padRight, padTop, padBottom, plotW, plotH, lines, yTicks, xTicks, rowCoords};
    });

    return (
        <section class="card p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 class="flex items-center gap-2 text-lg font-semibold">
                        <ChartLine size={18} class="text-leaf-700"/> Comparar cultivos
                    </h2>
                    <p class="text-sm text-muted">Promedio
                        de {info().label.toLowerCase()} cada {series.data?.bucketMinutes ?? "…"} min.</p>
                </div>
                <div class="flex rounded-xl bg-surface p-1" role="group" aria-label="Periodo">
                    <For each={PERIODS}>
                        {(period) => (
                            <button type="button" aria-pressed={hours() === period.hours}
                                    onClick={() => setHours(period.hours)}
                                    class={`rounded-lg px-3 py-1.5 text-sm font-semibold ${hours() === period.hours
                                        ? "bg-leaf-700 text-white" : "text-muted hover:text-ink"}`}>
                                {period.label}
                            </button>
                        )}
                    </For>
                </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2" role="group" aria-label="Variable">
                <For each={PRIMARY_METRICS}>
                    {(key) => (
                        <button type="button" aria-pressed={metric() === key} onClick={() => setMetric(key)}
                                class={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${metric() === key
                                    ? "border-leaf-700 bg-leaf-50 text-leaf-800" : "border-line text-muted hover:border-leaf-500"}`}>
                            {METRICS[key].label}
                        </button>
                    )}
                </For>
            </div>

            <Show when={series.error}>
                {(err) => <div class="mt-4"><Alert tone="danger">{err()}</Alert></div>}
            </Show>
            <div class="relative mt-4 h-72 select-none" role="img"
                 aria-label={`Comparación de ${info().label.toLowerCase()} entre ${visible().length} cultivos`}
                 onMouseLeave={() => setHoverIdx(null)}>
                <Show when={chart()} fallback={
                    <p class="flex h-full items-center justify-center text-sm text-muted">
                        {series.loading ? "Cargando lecturas…" : "No hay lecturas en este periodo para los cultivos elegidos."}
                    </p>
                }>
                    {(g) => {
                        const hoveredRow = () => {
                            const idx = hoverIdx();
                            return idx !== null ? g().rowCoords[idx] : null;
                        };
                        return (
                            <>
                                <svg viewBox={`0 0 ${g().width} ${g().height}`} class="h-full w-full overflow-visible">
                                    <For each={g().yTicks}>
                                        {(tick) => (
                                            <g>
                                                <line x1={g().padLeft} x2={g().width - g().padRight}
                                                      y1={tick.y} y2={tick.y} stroke="#E4EEE9"/>
                                                <text x={g().padLeft - 8} y={tick.y + 4} text-anchor="end"
                                                      fill="#5B6B63" font-size="11">
                                                    {Math.round(tick.value * 10) / 10}
                                                </text>
                                            </g>
                                        )}
                                    </For>
                                    <For each={g().lines}>
                                        {(line) => (
                                            <path d={line.path} fill="none" stroke={line.color} stroke-width="2"
                                                  stroke-linecap="round" stroke-linejoin="round"/>
                                        )}
                                    </For>
                                    <For each={g().xTicks}>
                                        {(tick) => (
                                            <text x={tick.x} y={g().height - 6} text-anchor="middle"
                                                  fill="#5B6B63" font-size="11">
                                                {hours() > 24
                                                    ? new Date(tick.time).toLocaleDateString("es-CO", {weekday: "short"})
                                                    : formatTime(tick.time)}
                                            </text>
                                        )}
                                    </For>
                                    <For each={g().rowCoords}>
                                        {(row, idx) => (
                                            <rect x={row.x - 8} y={g().padTop} width={16} height={g().plotH}
                                                  fill="transparent" onMouseEnter={() => setHoverIdx(idx())}/>
                                        )}
                                    </For>
                                </svg>
                                <Show when={hoveredRow()}>
                                    {(row) => (
                                        <div
                                            class="pointer-events-none absolute right-3 top-2 rounded-xl border border-line bg-white/95 px-3 py-1.5 text-xs shadow-sm">
                                            <p class="font-medium text-muted">
                                                {formatDateTime(new Date(row().time).toISOString())}
                                            </p>
                                            <For each={visible()}>
                                                {(crop) => (
                                                    <Show when={row().values[crop.id] !== undefined}>
                                                        <p class="font-semibold text-ink">
                                                            {crop.name}: {formatMetric(metric(), row().values[crop.id])}
                                                        </p>
                                                    </Show>
                                                )}
                                            </For>
                                        </div>
                                    )}
                                </Show>
                            </>
                        );
                    }}
                </Show>
            </div>

            <div class="mt-4 flex flex-wrap gap-2" role="group" aria-label="Cultivos comparados">
                <For each={props.crops}>
                    {(crop) => {
                        const color = () => compared.colorOf(crop.id);
                        const disabled = () => !color() && compared.isFull;
                        return (
                            <button type="button" aria-pressed={Boolean(color())} disabled={disabled()}
                                    onClick={() => compared.toggle(crop.id)}
                                    title={disabled() ? `Máximo ${MAX_COMPARED} cultivos a la vez` : undefined}
                                    class={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-40
                    ${color() ? "border-line bg-white text-ink" : "border-dashed border-line text-muted"}`}>
                                <span class="h-2.5 w-2.5 rounded-full"
                                      style={{"background-color": color() ?? "#D5E3DC"}}/>
                                {crop.name}
                            </button>
                        );
                    }}
                </For>
            </div>
        </section>
    );
}
