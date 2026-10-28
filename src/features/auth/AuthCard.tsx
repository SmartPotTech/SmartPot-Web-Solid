import {type JSX, Show} from "solid-js";

export function AuthCard(props: {
    title: string;
    subtitle?: string;
    children: JSX.Element;
    footer?: JSX.Element;
}) {
    return (
        <div class="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-surface px-4 py-10">
            <div class="w-full max-w-md">
                <div class="card p-6 md:p-8">
                    <h1 class="text-2xl font-bold">{props.title}</h1>
                    <Show when={props.subtitle}><p class="mt-1 text-sm text-muted">{props.subtitle}</p></Show>
                    <div class="mt-6">{props.children}</div>
                </div>
                <Show when={props.footer}><div class="mt-5 text-center text-sm text-muted">{props.footer}</div></Show>
            </div>
        </div>
    );
}
