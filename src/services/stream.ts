/**
 * Cliente reactivo de Server-Sent Events (SSE) para recepción de telemetría
 * en tiempo real por cultivo desde SmartPot-API-Go.
 */

import { API_URL } from "../config/env";
import { getApiToken } from "../lib/api/client";
import type { Reading } from "../lib/api/types";

export interface StreamSubscription {
    unsubscribe: () => void;
}

/**
 * Se suscribe al flujo SSE de telemetría de un cultivo.
 * Utiliza fetch con ReadableStream para soportar autenticación Bearer nativa sin hacks.
 */
export function subscribeTelemetryStream(
    cropId: string,
    onReading: (reading: Reading) => void,
    onError?: (error: unknown) => void
): StreamSubscription {
    const controller = new AbortController();
    const token = getApiToken();
    const url = `${API_URL}/api/v1/crops/${cropId}/stream`;

    let active = true;

    async function connect() {
        try {
            const response = await fetch(url, {
                headers: {
                    Accept: "text/event-stream",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`SSE stream connection failed with status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) return;

            const decoder = new TextDecoder();
            let buffer = "";

            while (active) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const blocks = buffer.split("\n\n");
                buffer = blocks.pop() ?? "";

                for (const block of blocks) {
                    for (const line of block.split("\n")) {
                        if (line.startsWith("data: ")) {
                            try {
                                const reading = JSON.parse(line.slice(6)) as Reading;
                                onReading(reading);
                            } catch {
                                // Ignorar errores de parseo de chunks parciales
                            }
                        }
                    }
                }
            }
        } catch (err) {
            if (!controller.signal.aborted) {
                onError?.(err);
            }
        }
    }

    void connect();

    return {
        unsubscribe: () => {
            active = false;
            controller.abort();
        },
    };
}
