import {lazy, Suspense} from "solid-js";
import {PageLoader} from "../components/ui/Spinner";

// El detalle trae las gráficas: se carga aparte para que la landing y el ingreso pesen menos.
const CropDetailPage = lazy(() => import("../features/crops/CropDetailPage"));

export function LazyCropDetailPage() {
    return (
        <Suspense fallback={<PageLoader/>}>
            <CropDetailPage/>
        </Suspense>
    );
}
