import {createMemo, createSignal, For, Show} from "solid-js";
import {METRICS} from "../../../lib/catalog";
import {formatDateTime, formatMetric, formatTime} from "../../../lib/format";
import type {MetricKey, ProfileRange, Reading} from "../../../lib/api/types";

interface ReadingsChartProps {
    readings: Reading[];
    metric: MetricKey;
    range?: ProfileRange;
    height?: number;
}

/** Serie de una variable con la franja del rango ideal de la especie (SVG nativo sin dependencias pesadas). */
export function ReadingsChart(props: ReadingsChartProps) {
    const info = () => METRICS[props.metric];
    const [hoverIdx, setHoverIdx] = createSignal<number | null>(null);

    const data = createMemo(() =>
        props.readings
            .filter((reading) => reading.measures[props.metric] !== undefined)
            .map((reading) => ({
                time: new Date(reading.measuredAt).getTime(),
                iso: reading.measuredAt,
                value: Number(reading.measures[props.metric]),
            }))
            .sort((a, b) => a.time - b.time),
    );

    const geometry = createMemo(() => {
        const points = data();
        if (points.length === 0) return null;

        const width = 640;
        const height = 240;
        const padLeft = 48;
        const padRight = 16;
        const padTop = 12;
        const padBottom = 28;
        const plotW = width - padLeft - padRight;
        const plotH = height - padTop - padBottom;

        let minVal = Math.min(...points.map((p) => p.value));
        let maxVal = Math.max(...points.map((p) => p.value));
        if (props.range) {
            minVal = Math.min(minVal, props.range.min);
            maxVal = Math.max(maxVal, props.range.max);
        }
        if (minVal === maxVal) {
            minVal -= 1;
            maxVal += 1;
        } else {
            const pad = (maxVal - minVal) * 0.08;
            minVal -= pad;
            maxVal += pad;
        }

        const minTime = points[0]!.time;
        const maxTime = points[points.length - 1]!.time;
        const timeSpan = Math.max(1, maxTime - minTime);

        const toX = (t: number) =>
            points.length === 1 ? padLeft + plotW / 2 : padLeft + ((t - minTime) / timeSpan) * plotW;
        const toY = (v: number) => padTop + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

        const coords = points.map((p) => ({...p, x: toX(p.time), y: toY(p.value)}));
        const path = coords.map((c, idx) => `${idx === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

        const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
            const val = minVal + t * (maxVal - minVal);
            return {value: val, y: toY(val)};
        });

        const xTickCount = Math.min(5, points.length);
        const xTicks = Array.from({length: xTickCount}, (_, idx) => {
            const point = points[Math.floor((idx * (points.length - 1)) / Math.max(1, xTickCount - 1))]!;
            return {time: point.time, x: toX(point.time)};
        });

        const rangeBand = props.range
            ? {
                y: Math.min(toY(props.range.min), toY(props.range.max)),
                height: Math.abs(toY(props.range.min) - toY(props.range.max)),
            }
            : null;

        return {width, height, padLeft, padRight, padTop, padBottom, plotW, plotH, coords, path, yTicks, xTicks, rangeBand};
    });

    return (
        <Show when={data().length > 0} fallback={
            <p class="flex h-40 items-center justify-center text-sm text-muted">
                Sin lecturas de {info().label.toLowerCase()} en este periodo.
            </p>
        }>
            <div style={{"height": `${props.height ?? 280}px`}} role="img"
                 aria-label={`Gráfica de ${info().label.toLowerCase()} con ${data().length} lecturas`}
                 class="relative w-full select-none"
                 onMouseLeave={() => setHoverIdx(null)}>
                <Show when={geometry()}>
                    {(g) => {
                        const hovered = () => {
                            const idx = hoverIdx();
                            return idx !== null ? g().coords[idx] : null;
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
                                    <Show when={g().rangeBand}>
                                        {(band) => (
                                            <rect x={g().padLeft} y={band().y} width={g().plotW} height={band().height}
                                                  fill="#00B074" fill-opacity="0.08"/>
                                        )}
                                    </Show>
                                    <path d={g().path} fill="none" stroke={info().color} stroke-width="2.5"
                                          stroke-linecap="round" stroke-linejoin="round"/>
                                    <For each={g().xTicks}>
                                        {(tick) => (
                                            <text x={tick.x} y={g().height - 6} text-anchor="middle"
                                                  fill="#5B6B63" font-size="11">
                                                {formatTime(tick.time)}
                                            </text>
                                        )}
                                    </For>
                                    <Show when={hovered()}>
                                        {(pt) => (
                                            <circle cx={pt().x} cy={pt().y} r="4.5" fill={info().color}
                                                    stroke="#FFFFFF" stroke-width="2"/>
                                        )}
                                    </Show>
                                    <For each={g().coords}>
                                        {(pt, idx) => (
                                            <circle cx={pt.x} cy={pt.y} r="10" fill="transparent"
                                                    onMouseEnter={() => setHoverIdx(idx())}/>
                                        )}
                                    </For>
                                </svg>
                                <Show when={hovered()}>
                                    {(pt) => (
                                        <div
                                            class="pointer-events-none absolute right-3 top-2 rounded-xl border border-line bg-white/95 px-3 py-1.5 text-xs shadow-sm">
                                            <p class="font-medium text-muted">{formatDateTime(pt().iso)}</p>
                                            <p class="font-semibold text-ink">
                                                {info().label}: {formatMetric(props.metric, pt().value)}
                                            </p>
                                        </div>
                                    )}
                                </Show>
                            </>
                        );
                    }}
                </Show>
            </div>
        </Show>
    );
}
