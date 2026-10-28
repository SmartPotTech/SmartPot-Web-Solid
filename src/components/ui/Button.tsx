import {type JSX, Show, splitProps} from "solid-js";
import {Spinner} from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "light";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
    primary: "bg-leaf-700 text-white hover:bg-leaf-800 disabled:bg-leaf-700/50",
    secondary: "border border-line bg-white text-ink hover:border-leaf-500 hover:text-leaf-800",
    ghost: "text-leaf-800 hover:bg-leaf-50",
    danger: "bg-danger-500 text-white hover:bg-danger-600 disabled:bg-danger-500/50",
    /** Sobre fondos verdes oscuros (encabezados de página). */
    light: "border border-white/25 bg-white/10 text-white hover:bg-white/20 disabled:opacity-50",
};

const SIZES: Record<Size, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-6 text-base",
};

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    icon?: JSX.Element;
    className?: string;
}

export function Button(props: ButtonProps) {
    const [local, rest] = splitProps(props, [
        "variant",
        "size",
        "loading",
        "icon",
        "class",
        "className",
        "children",
        "disabled",
        "type",
    ]);

    return (
        <button
            type={local.type ?? "button"}
            disabled={Boolean(local.disabled || local.loading)}
            class={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors
        disabled:cursor-not-allowed ${VARIANTS[local.variant ?? "primary"]} ${SIZES[local.size ?? "md"]} ${local.class ?? local.className ?? ""}`}
            {...rest}
        >
            <Show when={local.loading} fallback={local.icon}>
                <Spinner size={16}/>
            </Show>
            {local.children}
        </button>
    );
}
