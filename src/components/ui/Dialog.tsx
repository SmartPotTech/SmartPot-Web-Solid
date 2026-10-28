import {X} from "lucide-solid";
import {createEffect, type JSX, Show} from "solid-js";

interface DialogProps {
    open: boolean;
    title: string;
    onClose: () => void;
    children: JSX.Element;
    footer?: JSX.Element;
    /** Más ancho para guías y vistas previas. */
    wide?: boolean;
}

/** Diálogo nativo (<dialog>): gestiona el foco, Escape y el fondo sin librerías. */
export function Dialog(props: DialogProps) {
    let ref: HTMLDialogElement | undefined;

    createEffect(() => {
        if (!ref) return;
        if (props.open && !ref.open) ref.showModal?.();
        if (!props.open && ref.open) ref.close?.();
    });

    return (
        <dialog
            ref={(el) => {
                ref = el;
            }}
            onClose={() => props.onClose()}
            onCancel={(event) => {
                event.preventDefault();
                props.onClose();
            }}
            aria-labelledby="dialog-title"
            class={`m-auto ${props.wide ? "w-[min(94vw,46rem)]" : "w-[min(92vw,34rem)]"} rounded-[var(--radius-card)] border border-line bg-white p-0 text-ink
        shadow-2xl backdrop:bg-leaf-950/50 backdrop:backdrop-blur-sm`}
        >
            <Show when={props.open}>
                <div class="flex max-h-[85vh] flex-col">
                    <header class="flex items-center justify-between border-b border-line px-5 py-4">
                        <h2 id="dialog-title" class="text-lg font-semibold">{props.title}</h2>
                        <button type="button" onClick={() => props.onClose()} aria-label="Cerrar"
                                class="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-ink">
                            <X size={18}/>
                        </button>
                    </header>
                    <div class="overflow-y-auto px-5 py-4">{props.children}</div>
                    <Show when={props.footer}>
                        <footer class="flex justify-end gap-2 border-t border-line px-5 py-3">{props.footer}</footer>
                    </Show>
                </div>
            </Show>
        </dialog>
    );
}
