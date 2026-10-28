import {A} from "@solidjs/router";
import {Bot, ChevronRight, Sprout} from "lucide-solid";
import {For, Show} from "solid-js";
import {Badge} from "../../../components/ui/Feedback";
import {CROP_FORMS, CROP_TYPES, HEALTH} from "../../../lib/catalog";
import {formatMetric, timeAgo} from "../../../lib/format";
import type {Crop} from "../../../lib/api/types";

export function CropCard(props: { crop: Crop }) {
    const measures = () => props.crop.latestReading?.measures ?? {};
    const health = () => props.crop.health;
    const color = () => health() ? HEALTH[health()!.level]?.color ?? "#5B6B63" : "#D5E3DC";
    return (
        <A href={`/app/crops/${props.crop.id}`}
           class="card group flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div class="flex items-start justify-between gap-3 bg-linear-to-r from-leaf-50 to-white px-5 pb-3 pt-5">
                <div class="flex min-w-0 items-center gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf-700 text-white">
                        <Sprout size={20}/>
                    </span>
                    <div class="min-w-0">
                        <h3 class="truncate text-lg font-semibold">{props.crop.name}</h3>
                        <p class="text-sm text-leaf-700">{CROP_TYPES[props.crop.type].label} · {CROP_FORMS[props.crop.form]?.label ?? "Maceta"}</p>
                    </div>
                </div>
                <span
                    class={`mt-1 flex items-center gap-1.5 text-xs font-semibold ${props.crop.device.online ? "text-leaf-700" : "text-muted"}`}>
                    <span class={`h-2 w-2 rounded-full ${props.crop.device.online ? "animate-pulse bg-leaf-500" : "bg-line"}`}/>
                    {props.crop.device.online ? "En línea" : "Desconectado"}
                </span>
            </div>
            <div class="flex flex-1 flex-col px-5 pb-5">
                <div class="mt-2 grid grid-cols-3 gap-2 text-center">
                    <For each={["temperature", "soilMoisture", "ph"] as const}>
                        {(metric) => (
                            <div class="rounded-xl bg-surface px-2 py-2">
                                <p class="text-sm font-semibold">{formatMetric(metric, measures()[metric])}</p>
                                <p class="text-[11px] text-muted">{metric === "temperature" ? "Temp." : metric === "ph" ? "pH" : "Sustrato"}</p>
                            </div>
                        )}
                    </For>
                </div>
                <div class="mt-4">
                    <div class="h-1.5 overflow-hidden rounded-full bg-surface" role="presentation">
                        <div class="h-full rounded-full transition-all" style={{
                            "width": `${health() ? Math.round(health()!.index) : 0}%`,
                            "background-color": color(),
                        }}/>
                    </div>
                </div>
                <div class="mt-3 flex items-center justify-between gap-2">
                    <div class="flex flex-wrap gap-1.5">
                        <Badge
                            tone={props.crop.kind === "VIRTUAL" ? "info" : "success"}>{props.crop.kind === "VIRTUAL" ? "Virtual" : "Real"}</Badge>
                        <Show when={health()} fallback={<Badge>Sin evaluar</Badge>}>
                            {(h) => (
                                <Badge tone={HEALTH[h().level]?.tone ?? "neutral"}>
                                    Salud {Math.round(h().index)} · {h().label}
                                </Badge>
                            )}
                        </Show>
                        <Show when={props.crop.automationEnabled}>
                            <Badge tone="info"><Bot size={12}/> Automático</Badge>
                        </Show>
                    </div>
                    <ChevronRight size={18} class="text-leaf-700 transition-transform group-hover:translate-x-0.5"/>
                </div>
                <p class="mt-3 text-xs text-muted">Última lectura {timeAgo(props.crop.latestReading?.measuredAt)}</p>
            </div>
        </A>
    );
}
