import {type JSX, Show} from "solid-js";

interface PageHeaderProps {
    eyebrow?: string;
    title: string;
    description?: JSX.Element;
    icon?: JSX.Element;
    actions?: JSX.Element;
    children?: JSX.Element;
}

/** Encabezado de sección con el degradado verde de la marca. */
export function PageHeader(props: PageHeaderProps) {
    return (
        <header class="relative overflow-hidden rounded-[var(--radius-card)] bg-linear-to-br from-leaf-900 via-leaf-800
      to-leaf-700 px-5 py-6 text-white shadow-[var(--shadow-card)] md:px-7 md:py-7">
            <div aria-hidden="true"
                 class="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-leaf-500/25 blur-2xl"/>
            <div aria-hidden="true"
                 class="pointer-events-none absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-water-500/20 blur-2xl"/>
            <div class="relative flex flex-wrap items-end justify-between gap-4">
                <div class="flex min-w-0 items-start gap-3">
                    <Show when={props.icon}>
                        <span class="mt-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10
            text-leaf-300 sm:flex">{props.icon}</span>
                    </Show>
                    <div class="min-w-0">
                        <Show when={props.eyebrow}><p class="text-sm font-medium text-leaf-300">{props.eyebrow}</p></Show>
                        <h1 class="text-2xl font-bold md:text-3xl">{props.title}</h1>
                        <Show when={props.description}>
                            <p class="mt-1 max-w-2xl text-sm text-leaf-100/90">{props.description}</p>
                        </Show>
                    </div>
                </div>
                <Show when={props.actions}><div class="flex flex-wrap gap-2">{props.actions}</div></Show>
            </div>
            <Show when={props.children}><div class="relative mt-5">{props.children}</div></Show>
        </header>
    );
}

/** Indicador para el interior de un PageHeader. */
export function HeaderStat(props: { label: string; value: JSX.Element; hint?: string }) {
    return (
        <div class="rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
            <p class="font-display text-2xl font-bold leading-tight">{props.value}</p>
            <p class="text-xs text-leaf-100/90">{props.label}</p>
            <Show when={props.hint}><p class="mt-0.5 text-[11px] text-leaf-300">{props.hint}</p></Show>
        </div>
    );
}
