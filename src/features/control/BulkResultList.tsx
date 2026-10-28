import {CheckCircle2, CircleSlash, XCircle} from "lucide-solid";
import {For} from "solid-js";
import type {BulkCommandResult} from "../../lib/api/types";

/** Resultado de una orden en bloque, cultivo por cultivo. */
export function BulkResultList(props: { result: BulkCommandResult }) {
    return (
        <div class="rounded-xl bg-surface p-3" role="status">
            <p class="text-sm font-semibold">
                {props.result.sent} {props.result.sent === 1 ? "enviado" : "enviados"}
                {props.result.skipped > 0 && ` · ${props.result.skipped} ${props.result.skipped === 1 ? "omitido" : "omitidos"}`}
                {props.result.failed > 0 && ` · ${props.result.failed} con error`}
            </p>
            <ul class="mt-2 space-y-1.5">
                <For each={props.result.results}>
                    {(item) => (
                        <li class="flex items-start gap-2 text-sm">
                            <span class="mt-0.5">
                                {item.status === "SENT" ? <CheckCircle2 size={16} class="text-leaf-600"/>
                                    : item.status === "SKIPPED" ? <CircleSlash size={16} class="text-muted"/>
                                        : <XCircle size={16} class="text-danger-500"/>}
                            </span>
                            <span>
                                <span class="font-medium">{item.cropName}</span>
                                <span class="text-muted">
                                    {" · "}
                                    {item.status === "SENT" ? "Enviado" : item.status === "SKIPPED" ? "Omitido" : "Falló"}
                                    {item.message ? `: ${item.message}` : ""}
                                </span>
                            </span>
                        </li>
                    )}
                </For>
            </ul>
        </div>
    );
}
