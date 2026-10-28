import {Plus, Sprout} from "lucide-solid";
import {createSignal, For, Show} from "solid-js";
import {Button} from "../../components/ui/Button";
import {HeaderStat, PageHeader} from "../../components/layout/PageHeader";
import {Alert, EmptyState} from "../../components/ui/Feedback";
import {PageLoader} from "../../components/ui/Spinner";
import {usePageMeta} from "../../hooks/usePageMeta";
import {useResource} from "../../hooks/useResource";
import {cropApi} from "../../lib/api/services";
import {greeting} from "../../lib/format";
import {useAuth} from "../auth/AuthContext";
import {CreateCropDialog} from "./components/CreateCropDialog";
import {CropCard} from "./components/CropCard";

export function CropsPage() {
    usePageMeta("Mis cultivos");
    const auth = useAuth();
    const crops = useResource(() => cropApi.list(), [], 30_000);
    const [creating, setCreating] = createSignal(false);

    const list = () => crops.data ?? [];
    const online = () => list().filter((crop) => crop.device.online).length;
    const attention = () => list().filter((crop) => crop.health && ["POOR", "CRITICAL"].includes(crop.health.level)).length;

    return (
        <div class="space-y-6">
            <PageHeader eyebrow={`${greeting()}, ${auth.user?.name ?? ""}`} title="Mis cultivos" icon={<Sprout size={24}/>}
                        description="Tus cultivos reales y virtuales con sus lecturas, su asistente y su control. Entra a uno para verlo en vivo."
                        actions={<Button variant="light" icon={<Plus size={18}/>} onClick={() => setCreating(true)}>Nuevo
                            cultivo</Button>}>
                <Show when={list().length > 0}>
                    <div class="grid grid-cols-3 gap-3">
                        <HeaderStat label="Cultivos" value={list().length}/>
                        <HeaderStat label="En línea" value={online()}/>
                        <HeaderStat label="Necesitan atención" value={attention()}/>
                    </div>
                </Show>
            </PageHeader>

            <Show when={crops.error}>
                {(err) => <Alert tone="danger">{err()}</Alert>}
            </Show>
            <Show when={!(crops.loading && !crops.data)} fallback={<PageLoader/>}>
                <Show when={!(list().length === 0 && !crops.error)} fallback={
                    <EmptyState icon={<Sprout size={26}/>} title="Crea tu primer cultivo"
                                action={<Button icon={<Plus size={18}/>} onClick={() => setCreating(true)}>Nuevo
                                    cultivo</Button>}>
                        Elige si es real (un ESP32, físico o en Wokwi) o virtual (lo simula SmartPot), su especie y su
                        forma: maceta,
                        tubos NFT, torre o balsa.
                    </EmptyState>
                }>
                    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <For each={list()}>
                            {(crop) => <CropCard crop={crop}/>}
                        </For>
                    </div>
                </Show>
            </Show>

            <CreateCropDialog open={creating()} onClose={() => setCreating(false)}
                              onCreated={() => void crops.reload()}/>
        </div>
    );
}
