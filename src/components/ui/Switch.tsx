interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
}

export function Switch(props: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={props.checked}
            aria-label={props.label}
            disabled={props.disabled}
            onClick={() => props.onChange(!props.checked)}
            class={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50
        ${props.checked ? "bg-leaf-600" : "bg-line"}`}
        >
            <span class={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform
        ${props.checked ? "translate-x-6" : "translate-x-1"}`}/>
        </button>
    );
}
