import {A} from "@solidjs/router";
import {AlertTriangle, Bell, Bot, CheckCheck, Info, Radio, Trash2, Zap} from "lucide-solid";
import {For, Show} from "solid-js";
import {Button} from "../../components/ui/Button";
import {Alert, EmptyState} from "../../components/ui/Feedback";
import {PageLoader} from "../../components/ui/Spinner";
import {usePageMeta} from "../../hooks/usePageMeta";
import {useResource} from "../../hooks/useResource";
import {notificationApi} from "../../lib/api/services";
import {formatDateTime} from "../../lib/format";
import type {AppNotification} from "../../lib/api/types";

const ICONS: Record<AppNotification["type"], typeof Bell> = {
    INFO: Info,
    ALERT: AlertTriangle,
    COMMAND: Zap,
    DEVICE: Radio,
    AI: Bot,
};

export function NotificationsPage() {
    usePageMeta("Alertas");
    const notifications = useResource(() => notificationApi.list(), [], 30_000);
    const list = () => notifications.data ?? [];

    async function act(task: Promise<unknown>) {
        await task.catch(() => undefined);
        void notifications.reload();
    }

    return (
        <div class="space-y-6">
            <div class="flex flex-wrap items-end justify-between gap-3">
                <h1 class="text-3xl font-bold">Alertas</h1>
                <Show when={list().some((item) => !item.read)}>
                    <Button variant="secondary" size="sm" icon={<CheckCheck size={16}/>}
                            onClick={() => void act(notificationApi.markAllRead())}>
                        Marcar todas como leídas
                    </Button>
                </Show>
            </div>
            <Show when={notifications.error}>
                {(err) => <Alert tone="danger">{err()}</Alert>}
            </Show>
            <Show when={!(notifications.loading && !notifications.data)} fallback={<PageLoader/>}>
                <Show when={list().length > 0} fallback={
                    <EmptyState icon={<Bell size={26}/>} title="Sin alertas">
                        Aquí verás los avisos de tus cultivos, de sus dispositivos y del asistente de IA.
                    </EmptyState>
                }>
                    <ul class="space-y-2">
                        <For each={list()}>
                            {(item) => {
                                const Icon = ICONS[item.type] ?? Info;
                                return (
                                    <li class={`card flex gap-3 p-4 ${item.read ? "opacity-75" : "border-leaf-300"}`}>
                                        <div class={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
                      ${item.type === "ALERT" ? "bg-sun-100 text-sun-600" : "bg-leaf-50 text-leaf-700"}`}>
                                            <Icon size={18}/>
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <p class="font-semibold">{item.title}</p>
                                            <p class="text-sm text-muted">{item.message}</p>
                                            <div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">
                                                <span>{formatDateTime(item.createdAt)}</span>
                                                <Show when={item.cropId}>
                                                    {(cId) => (
                                                        <A href={`/app/crops/${cId()}`}
                                                           class="font-semibold text-leaf-700">Ver cultivo</A>
                                                    )}
                                                </Show>
                                                <Show when={!item.read}>
                                                    <button type="button" class="font-semibold text-leaf-700"
                                                            onClick={() => void act(notificationApi.markRead(item.id))}>
                                                        Marcar como leída
                                                    </button>
                                                </Show>
                                            </div>
                                        </div>
                                        <button type="button" aria-label="Eliminar alerta"
                                                class="self-start rounded-lg p-1.5 text-muted hover:text-danger-600"
                                                onClick={() => void act(notificationApi.remove(item.id))}>
                                            <Trash2 size={16}/>
                                        </button>
                                    </li>
                                );
                            }}
                        </For>
                    </ul>
                </Show>
            </Show>
        </div>
    );
}
