import {createUniqueId, type JSX, Show, splitProps} from "solid-js";

const CONTROL = `h-11 w-full rounded-xl border bg-white px-3 text-sm text-ink placeholder:text-muted/70
  transition-colors focus:border-leaf-500 focus:outline-none focus:ring-2 focus:ring-leaf-500/25`;

interface FieldProps {
    label: string;
    error?: string;
    hint?: JSX.Element;
    className?: string;
}

export function TextField(props: FieldProps & JSX.InputHTMLAttributes<HTMLInputElement>) {
    const id = createUniqueId();
    const [local, rest] = splitProps(props, ["label", "error", "hint", "class", "className", "onInput", "onChange"]);

    return (
        <div class={local.class ?? local.className ?? ""}>
            <label for={id} class="mb-1.5 block text-sm font-medium text-ink">{local.label}</label>
            <input
                id={id}
                aria-invalid={Boolean(local.error)}
                aria-describedby={local.error ? `${id}-error` : undefined}
                class={`${CONTROL} ${local.error ? "border-danger-500" : "border-line"}`}
                onInput={(event) => {
                    if (typeof local.onInput === "function") local.onInput(event);
                    if (typeof local.onChange === "function") (local.onChange as (e: Event & { currentTarget: HTMLInputElement; target: HTMLInputElement }) => void)(event);
                }}
                {...rest}
            />
            <Show when={local.error} fallback={
                <Show when={local.hint}>
                    <p class="mt-1 text-xs text-muted">{local.hint}</p>
                </Show>
            }>
                <p id={`${id}-error`} class="mt-1 text-sm text-danger-600">{local.error}</p>
            </Show>
        </div>
    );
}

export function SelectField(props: FieldProps & JSX.SelectHTMLAttributes<HTMLSelectElement>) {
    const id = createUniqueId();
    const [local, rest] = splitProps(props, ["label", "error", "hint", "class", "className", "children"]);

    return (
        <div class={local.class ?? local.className ?? ""}>
            <label for={id} class="mb-1.5 block text-sm font-medium text-ink">{local.label}</label>
            <select
                id={id}
                aria-invalid={Boolean(local.error)}
                class={`${CONTROL} ${local.error ? "border-danger-500" : "border-line"}`}
                {...rest}
            >
                {local.children}
            </select>
            <Show when={local.error} fallback={
                <Show when={local.hint}>
                    <p class="mt-1 text-xs text-muted">{local.hint}</p>
                </Show>
            }>
                <p class="mt-1 text-sm text-danger-600">{local.error}</p>
            </Show>
        </div>
    );
}
