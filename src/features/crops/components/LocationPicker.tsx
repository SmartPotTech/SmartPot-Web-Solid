import {LocateFixed, MapPin, Search} from "lucide-solid";
import {createSignal, For, Show} from "solid-js";
import {Button} from "../../../components/ui/Button";
import {Alert} from "../../../components/ui/Feedback";
import {ApiError} from "../../../lib/api/client";
import {virtualDeviceApi} from "../../../lib/api/services";
import type {Place} from "../../../lib/api/types";

export interface PickedLocation {
    name: string;
    latitude: number;
    longitude: number;
}

/** Elige el lugar cuyo clima seguirá el cultivo virtual: búsqueda por nombre o la ubicación del dispositivo. */
export function LocationPicker(props: {
    value: PickedLocation | null;
    onChange: (place: PickedLocation) => void;
}) {
    const [query, setQuery] = createSignal("");
    const [results, setResults] = createSignal<Place[] | null>(null);
    const [error, setError] = createSignal<string | null>(null);
    const [busy, setBusy] = createSignal<"search" | "locate" | null>(null);

    async function search(event: SubmitEvent) {
        event.preventDefault();
        if (query().trim().length < 2) return;
        setBusy("search");
        setError(null);
        try {
            setResults(await virtualDeviceApi.places(query().trim()));
        } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : "No se pudo buscar el lugar");
        } finally {
            setBusy(null);
        }
    }

    function locate() {
        if (!("geolocation" in navigator)) {
            setError("Este navegador no comparte la ubicación; busca el lugar por su nombre.");
            return;
        }
        setBusy("locate");
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setBusy(null);
                props.onChange({
                    name: "Mi ubicación",
                    latitude: Math.round(position.coords.latitude * 1e4) / 1e4,
                    longitude: Math.round(position.coords.longitude * 1e4) / 1e4,
                });
            },
            () => {
                setBusy(null);
                setError("No se pudo obtener tu ubicación; busca el lugar por su nombre.");
            },
            {timeout: 10_000, maximumAge: 600_000},
        );
    }

    return (
        <div class="space-y-2">
            <Show when={props.value}>
                {(val) => (
                    <p class="flex items-center gap-1.5 text-sm"><MapPin size={16} class="text-clay-500"/>
                        <strong>{val().name}</strong>
                        <span class="text-muted">({val().latitude.toFixed(2)}, {val().longitude.toFixed(2)})</span>
                    </p>
                )}
            </Show>
            <form onSubmit={search} class="flex flex-wrap gap-2" role="search">
                <label class="sr-only" for="place-search">Buscar ciudad o municipio</label>
                <input id="place-search" value={query()} onInput={(event) => setQuery(event.currentTarget.value)}
                       placeholder="Ciudad o municipio" maxLength={80}
                       class="h-9 min-w-0 flex-1 rounded-lg border border-line bg-white px-3 text-sm"/>
                <Button type="submit" size="sm" variant="secondary" icon={<Search size={14}/>}
                        loading={busy() === "search"}>
                    Buscar
                </Button>
                <Button type="button" size="sm" variant="ghost" icon={<LocateFixed size={14}/>}
                        loading={busy() === "locate"}
                        onClick={locate}>
                    Usar mi ubicación
                </Button>
            </form>
            <Show when={error()}>
                {(err) => <Alert tone="danger">{err()}</Alert>}
            </Show>
            <Show when={results()}>
                {(list) => (
                    <Show when={list().length > 0} fallback={<p class="text-sm text-muted">No encontramos ese lugar.</p>}>
                        <ul class="divide-y divide-line rounded-xl border border-line bg-white">
                            <For each={list()}>
                                {(place) => {
                                    const regionText = [place.region, place.country].filter(Boolean).join(", ");
                                    return (
                                        <li>
                                            <button type="button" class="w-full px-3 py-2 text-left text-sm hover:bg-surface"
                                                    onClick={() => {
                                                        props.onChange({
                                                            name: place.name,
                                                            latitude: place.latitude,
                                                            longitude: place.longitude,
                                                        });
                                                        setResults(null);
                                                        setQuery("");
                                                    }}>
                                                <strong>{place.name}</strong>
                                                <span class="text-muted">{regionText && ` · ${regionText}`}</span>
                                            </button>
                                        </li>
                                    );
                                }}
                            </For>
                        </ul>
                    </Show>
                )}
            </Show>
        </div>
    );
}
