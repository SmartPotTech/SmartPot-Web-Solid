import {AlertTriangle, CheckCircle2, Info, XCircle} from "lucide-solid";
import {type JSX, Show} from "solid-js";
import type {Tone} from "../../lib/catalog";

const BADGE: Record<Tone, string> = {
    neutral: "bg-surface text-muted",
    info: "bg-water-100 text-water-700",
    success: "bg-leaf-100 text-leaf-800",
    warning: "bg-sun-100 text-sun-600",
    danger: "bg-danger-100 text-danger-600",
};

export function Badge(props: { tone?: Tone; children: JSX.Element }) {
    return (
        <span
            class={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE[props.tone ?? "neutral"]}`}>
            {props.children}
        </span>
    );
}

const ALERT_BOX: Record<Exclude<Tone, "neutral">, string> = {
    info: "border-water-500/30 bg-water-100 text-water-700",
    success: "border-leaf-500/30 bg-leaf-50 text-leaf-800",
    warning: "border-sun-500/40 bg-sun-100 text-sun-600",
    danger: "border-danger-500/30 bg-danger-100 text-danger-600",
};

function AlertIcon(props: { tone: Exclude<Tone, "neutral"> }) {
    return (
        <>
            {props.tone === "info" && <Info size={18}/>}
            {props.tone === "success" && <CheckCircle2 size={18}/>}
            {props.tone === "warning" && <AlertTriangle size={18}/>}
            {props.tone === "danger" && <XCircle size={18}/>}
        </>
    );
}

export function Alert(props: {
    tone?: Exclude<Tone, "neutral">;
    title?: string;
    children?: JSX.Element;
}) {
    const tone = () => props.tone ?? "info";
    return (
        <div role={tone() === "danger" ? "alert" : "status"}
             class={`flex gap-3 rounded-xl border p-3 text-sm ${ALERT_BOX[tone()]}`}>
            <span class="mt-0.5 shrink-0"><AlertIcon tone={tone()}/></span>
            <div>
                <Show when={props.title}><p class="font-semibold">{props.title}</p></Show>
                <Show when={props.children}><div class={props.title ? "mt-0.5" : ""}>{props.children}</div></Show>
            </div>
        </div>
    );
}

export function EmptyState(props: {
    icon: JSX.Element;
    title: string;
    children?: JSX.Element;
    action?: JSX.Element;
}) {
    return (
        <div class="card flex flex-col items-center px-6 py-12 text-center">
            <div class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-50 text-leaf-700">
                {props.icon}
            </div>
            <h3 class="text-lg font-semibold">{props.title}</h3>
            <Show when={props.children}><p class="mt-1 max-w-md text-sm text-muted">{props.children}</p></Show>
            <Show when={props.action}><div class="mt-5">{props.action}</div></Show>
        </div>
    );
}
