import {Play} from "lucide-solid";
import {For, Show} from "solid-js";
import {Button} from "../../../components/ui/Button";
import {Alert} from "../../../components/ui/Feedback";
import {describeAction} from "../../../lib/format";
import type {Crop, FleetAction} from "../../../lib/api/types";
import {BulkResultList} from "../../control/BulkResultList";
import {useBulkCommand} from "../../control/useBulkCommand";

interface FleetActionsListProps {
    actions: FleetAction[];
    crops: Crop[];
    onApplied?: () => void;
}

/** Acciones que el agente propone para varios cultivos, aplicables en un solo paso. */
export function FleetActionsList(props: FleetActionsListProps) {
    const bulk = useBulkCommand(() => props.onApplied?.());
    const names = (ids: string[]) => ids.map((id) => props.crops.find((crop) => crop.id === id)?.name ?? "Cultivo").join(", ");

    return (
        <Show when={props.actions.length > 0} fallback={
            <p class="text-sm text-muted">El agente no propone acciones en este momento.</p>
        }>
            <div class="space-y-3">
                <Show when={bulk.error}>
                    {(err) => <Alert tone="danger">{err()}</Alert>}
                </Show>
                <Show when={bulk.result}>
                    {(res) => <BulkResultList result={res()}/>}
                </Show>
                <ul class="divide-y divide-line">
                    <For each={props.actions}>
                        {(action) => {
                            const key = `${action.actuator}-${action.action}`;
                            return (
                                <li class="flex flex-wrap items-center justify-between gap-3 py-3">
                                    <div class="min-w-0">
                                        <p class="font-medium">{describeAction(action.actuator, action.action, action.durationSeconds)}</p>
                                        <p class="text-sm text-muted">{action.reason}</p>
                                        <p class="mt-0.5 text-xs text-leaf-700">{names(action.cropIds)}</p>
                                    </div>
                                    <Button size="sm" icon={<Play size={14}/>} loading={bulk.sending === key}
                                            onClick={() => void bulk.send(key, {
                                                actuatorType: action.actuator,
                                                action: action.action,
                                                durationSeconds: action.durationSeconds,
                                                cropIds: action.cropIds,
                                            })}>
                                        {action.cropIds.length === 1 ? "Aplicar" : `Aplicar a ${action.cropIds.length}`}
                                    </Button>
                                </li>
                            );
                        }}
                    </For>
                </ul>
            </div>
        </Show>
    );
}
