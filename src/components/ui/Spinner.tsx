export function Spinner(props: { size?: number; label?: string }) {
    const size = () => props.size ?? 20;
    return (
        <span role="status" class="inline-flex items-center gap-2">
            <svg width={size()} height={size()} viewBox="0 0 24 24" class="animate-spin" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="3"/>
                <path d="M22 12a10 10 0 0 0-10-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
            </svg>
            <span class={props.label ? "text-sm text-muted" : "sr-only"}>{props.label ?? "Cargando"}</span>
        </span>
    );
}

export function PageLoader(props: { label?: string }) {
    return (
        <div class="flex min-h-[40vh] items-center justify-center text-leaf-700">
            <Spinner size={28} label={props.label ?? "Cargando…"}/>
        </div>
    );
}
