import {ArrowDown, ArrowUp, Check} from "lucide-solid";
import {Show} from "solid-js";
import {METRICS} from "../../../lib/catalog";
import {formatMetric, rangeStatus} from "../../../lib/format";
import type {MetricKey, ProfileRange} from "../../../lib/api/types";

export function MetricTile(props: { metric: MetricKey; value?: number; range?: ProfileRange }) {
    const info = () => METRICS[props.metric];
    const statusKey = () => rangeStatus(props.value, props.range);

    return (
        <div class="card p-4">
            <div class="flex items-center justify-between gap-2">
                <p class="flex items-center gap-2 text-sm text-muted">
                    <span class="h-2.5 w-2.5 rounded-full" style={{"background-color": info().color}}/>
                    {info().label}
                </p>
                <Show when={statusKey() !== "unknown"}>
                    <span
                        class={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            statusKey() === "low" ? "text-water-700 bg-water-100"
                                : statusKey() === "high" ? "text-clay-600 bg-clay-100"
                                    : "text-leaf-800 bg-leaf-100"
                        }`}>
                        {statusKey() === "low" ? <ArrowDown size={12}/>
                            : statusKey() === "high" ? <ArrowUp size={12}/>
                                : <Check size={12}/>}
                        {statusKey() === "low" ? "Bajo" : statusKey() === "high" ? "Alto" : "Ideal"}
                    </span>
                </Show>
            </div>
            <p class="mt-2 font-display text-2xl font-bold">{formatMetric(props.metric, props.value)}</p>
            <Show when={props.range}>
                {(range) => (
                    <p class="mt-1 text-xs text-muted">Ideal: {range().min}–{range().max} {range().unit}</p>
                )}
            </Show>
        </div>
    );
}
