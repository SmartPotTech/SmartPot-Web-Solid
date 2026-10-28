import {createSignal} from "solid-js";
import {ApiError} from "../../lib/api/client";
import {commandApi} from "../../lib/api/services";
import type {ActuatorType, BulkCommandResult, CommandAction} from "../../lib/api/types";

export interface BulkOrder {
    actuatorType: ActuatorType;
    action: CommandAction;
    durationSeconds?: number | null;
    cropIds?: string[];
}

/** Envía una orden a varios cultivos y guarda el resultado para mostrarlo. */
export function useBulkCommand(onDone?: () => void) {
    const [sending, setSending] = createSignal<string | null>(null);
    const [result, setResult] = createSignal<BulkCommandResult | null>(null);
    const [error, setError] = createSignal<string | null>(null);

    async function send(key: string, order: BulkOrder) {
        setSending(key);
        setError(null);
        try {
            setResult(await commandApi.bulk(order));
            onDone?.();
        } catch (caught) {
            setResult(null);
            setError(caught instanceof ApiError ? caught.message : "No se pudo enviar la orden");
        } finally {
            setSending(null);
        }
    }

    return {
        send,
        get sending() {
            return sending();
        },
        get result() {
            return result();
        },
        get error() {
            return error();
        },
        clear: () => setResult(null),
    };
}
