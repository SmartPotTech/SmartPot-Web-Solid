import {lazy, Suspense} from "solid-js";
import {PageLoader} from "../components/ui/Spinner";

// El panel general trae las gráficas comparativas: se carga aparte, igual que el detalle del cultivo.
const OverviewPage = lazy(() => import("../features/overview/OverviewPage"));

export function LazyOverviewPage() {
    return (
        <Suspense fallback={<PageLoader/>}>
            <OverviewPage/>
        </Suspense>
    );
}
