import {A} from "@solidjs/router";
import {LayoutDashboard, Plus, Sprout} from "lucide-solid";
import {Show} from "solid-js";
import {HeaderStat, PageHeader} from "../../components/layout/PageHeader";
import {Alert, EmptyState} from "../../components/ui/Feedback";
import {PageLoader} from "../../components/ui/Spinner";
import {usePageMeta} from "../../hooks/usePageMeta";
import {useResource} from "../../hooks/useResource";
import {overviewApi} from "../../lib/api/services";
import {greeting} from "../../lib/format";
import {useAuth} from "../auth/AuthContext";
import {ComparisonTable} from "./components/ComparisonTable";
import {FleetPanel} from "./components/FleetPanel";
import {HealthRanking} from "./components/HealthRanking";
import {MetricComparison} from "./components/MetricComparison";

/** Panel general: todos los cultivos a la vez, a diferencia del detalle de cada uno. */
export default function OverviewPage() {
    usePageMeta("Panel general");
    const auth = useAuth();
    const overview = useResource(() => overviewApi.get(), [], 30_000);
    const totals = () => overview.data?.totals;
    const crops = () => overview.data?.crops ?? [];

    return (
        <div class="space-y-6">
            <PageHeader eyebrow={`${greeting()}, ${auth.user?.name ?? ""}`} title="Panel general"
                        icon={<LayoutDashboard size={24}/>}
                        description="Tus cultivos juntos: cómo están, cómo se comparan y qué recomienda el asistente para todos."
                        actions={<A href="/app/crops" class="inline-flex h-11 items-center gap-2 rounded-xl border border-white/25
          bg-white/10 px-4 text-sm font-semibold text-white hover:bg-white/20"><Sprout size={18}/> Ver cultivos</A>}>
                <Show when={totals() && totals()!.crops > 0}>
                    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <HeaderStat label="Salud promedio"
                                    value={totals()!.averageHealth == null ? "—" : Math.round(totals()!.averageHealth!)}
                                    hint="de 100"/>
                        <HeaderStat label="Cultivos en línea" value={`${totals()!.online}/${totals()!.crops}`}
                                    hint={`${totals()!.automated} en modo automático`}/>
                        <HeaderStat label="Necesitan atención" value={totals()!.needsAttention}
                                    hint={`${totals()!.unreadAlerts} alertas sin leer`}/>
                        <HeaderStat label="Comandos en 24 h" value={totals()!.commandsLast24h}/>
                    </div>
                </Show>
            </PageHeader>

            <Show when={overview.error}>
                {(err) => <Alert tone="danger">{err()}</Alert>}
            </Show>
            <Show when={!(overview.loading && !overview.data)} fallback={<PageLoader/>}>
                <Show when={!(crops().length === 0 && !overview.error)} fallback={
                    <EmptyState icon={<Sprout size={26}/>} title="Todavía no tienes cultivos"
                                action={<A href="/app/crops" class="inline-flex h-11 items-center gap-2 rounded-xl bg-leaf-700 px-4 text-sm
            font-semibold text-white hover:bg-leaf-800"><Plus size={18}/> Crear un cultivo</A>}>
                        Cuando tengas cultivos, aquí los verás juntos, comparados y analizados por el asistente.
                    </EmptyState>
                }>
                    <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                        <HealthRanking crops={crops()}/>
                        <FleetPanel crops={crops()}/>
                    </div>
                    <MetricComparison crops={crops()}/>
                    <ComparisonTable crops={crops()}/>
                </Show>
            </Show>
        </div>
    );
}
