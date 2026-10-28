import {useNavigate} from "@solidjs/router";
import {ArrowLeft, ArrowRight, Cpu, Sparkles} from "lucide-solid";
import {createSignal, For, Match, Show, Switch} from "solid-js";
import {Button} from "../../../components/ui/Button";
import {Dialog} from "../../../components/ui/Dialog";
import {SelectField, TextField} from "../../../components/ui/Field";
import {Alert} from "../../../components/ui/Feedback";
import {ApiError} from "../../../lib/api/client";
import {cropApi} from "../../../lib/api/services";
import {CROP_FORMS, CROP_KINDS, CROP_TYPES} from "../../../lib/catalog";
import type {
    ActuatorType,
    Crop,
    CropCreated,
    CropForm,
    CropKind,
    CropType,
    Placement,
    VirtualMode,
} from "../../../lib/api/types";
import {ConnectionGuide} from "./ConnectionGuide";
import {PlacementPicker} from "./PlacementPicker";
import {CropScene} from "./scene/CropScene";
import {ModePicker} from "./SimulationPanel";

type Step = "kind" | "details" | "connect";

/** Actuadores con los que nace cada tipo: el firmware trae tres; la simulación, los seis. */
const STARTING_ACTUATORS: Record<CropKind, ActuatorType[]> = {
    REAL: ["WATER_PUMP", "UV_LIGHT", "FAN"],
    VIRTUAL: ["WATER_PUMP", "UV_LIGHT", "FAN", "HUMIDIFIER", "NUTRIENT_DOSER", "PH_DOSER"],
};
const KIND_ICONS: Record<CropKind, typeof Cpu> = {REAL: Cpu, VIRTUAL: Sparkles};
const NOTHING_RUNNING = new Set<ActuatorType>();

interface CreateCropDialogProps {
    open: boolean;
    onClose: () => void;
    onCreated: (crop: Crop) => void;
}

/**
 * Crear un cultivo en tres pasos: real o virtual (no se puede cambiar después), sus datos y su lugar con la vista
 * previa y, si es real, la guía para conectar el ESP32 o la simulación de Wokwi con su clave.
 */
export function CreateCropDialog(props: CreateCropDialogProps) {
    const navigate = useNavigate();
    const [step, setStep] = createSignal<Step>("kind");
    const [kind, setKind] = createSignal<CropKind | null>(null);
    const [name, setName] = createSignal("");
    const [type, setType] = createSignal<CropType>("LETTUCE");
    const [form, setForm] = createSignal<CropForm>("POT");
    const [mode, setMode] = createSignal<VirtualMode>("AUTO");
    const [placement, setPlacement] = createSignal<Placement>({});
    const [created, setCreated] = createSignal<CropCreated | null>(null);
    const [error, setError] = createSignal<string | null>(null);
    const [saving, setSaving] = createSignal(false);

    function close() {
        setStep("kind");
        setKind(null);
        setName("");
        setType("LETTUCE");
        setForm("POT");
        setMode("AUTO");
        setPlacement({});
        setCreated(null);
        setError(null);
        props.onClose();
    }

    function openCrop(crop: Crop) {
        close();
        navigate(`/app/crops/${crop.id}`);
    }

    async function create(event: SubmitEvent) {
        event.preventDefault();
        const k = kind();
        if (!k) return;
        if (name().trim().length < 2) {
            setError("Ponle un nombre de al menos 2 caracteres");
            return;
        }
        const pl = placement();
        const location = pl.location ?? null;
        if (k === "VIRTUAL" && mode() === "WEATHER" && !location) {
            setError("Elige la ubicación del cultivo: su clima es el que se simula.");
            return;
        }
        const placed = pl.setting || pl.location ? {placement: pl} : {};
        setSaving(true);
        setError(null);
        try {
            const result = await cropApi.create({
                name: name().trim(),
                type: type(),
                kind: k,
                form: form(),
                ...placed,
                ...(k === "VIRTUAL" ? {virtual: {mode: mode(), ...(mode() === "WEATHER" && location ? {location} : {})}} : {}),
            });
            props.onCreated(result.crop);
            if (result.device) {
                setCreated(result);
                setStep("connect");
            } else {
                openCrop(result.crop);
            }
        } catch (caught) {
            setError(caught instanceof ApiError ? caught.message : "No se pudo crear el cultivo");
        } finally {
            setSaving(false);
        }
    }

    const title = () => step() === "connect" ? "Conecta tu dispositivo"
        : step() === "details" && kind() ? `Nuevo cultivo ${CROP_KINDS[kind()!].label.toLowerCase()}` : "Nuevo cultivo";

    return (
        <Dialog open={props.open} title={title()} onClose={close} wide={step() !== "kind"}
                footer={
                    <Switch>
                        <Match when={step() === "kind"}>
                            <Button variant="secondary" onClick={close}>Cancelar</Button>
                            <Button icon={<ArrowRight size={16}/>} disabled={!kind()}
                                    onClick={() => setStep("details")}>Siguiente</Button>
                        </Match>
                        <Match when={step() === "details"}>
                            <Button variant="secondary" icon={<ArrowLeft size={16}/>}
                                    onClick={() => setStep("kind")}>Atrás</Button>
                            <Button type="submit" form="create-crop" loading={saving()}>Crear cultivo</Button>
                        </Match>
                        <Match when={step() === "connect"}>
                            <Button onClick={() => {
                                const c = created();
                                if (c) openCrop(c.crop);
                            }}>Ya lo guardé, ir al cultivo</Button>
                        </Match>
                    </Switch>
                }>
            <Show when={step() === "kind"}>
                <div class="space-y-4">
                    <p class="text-sm text-muted">¿Cómo llegarán las lecturas de este cultivo?</p>
                    <div class="grid gap-3" role="radiogroup" aria-label="Tipo de cultivo">
                        <For each={Object.keys(CROP_KINDS) as CropKind[]}>
                            {(option) => {
                                const Icon = KIND_ICONS[option];
                                return (
                                    <button type="button" role="radio" aria-checked={kind() === option}
                                            onClick={() => setKind(option)}
                                            class={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${kind() === option
                                                ? "border-leaf-600 bg-leaf-50 ring-2 ring-leaf-600/30" : "border-line bg-white hover:bg-surface"}`}>
                                        <span
                                            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf-700 text-white">
                                            <Icon size={20}/>
                                        </span>
                                        <span>
                                            <span class="block font-semibold">{CROP_KINDS[option].label}</span>
                                            <span class="mt-0.5 block text-sm text-muted">{CROP_KINDS[option].hint}</span>
                                            <span class="mt-1 block text-xs text-muted">
                                                {option === "REAL"
                                                    ? "Te damos la clave del dispositivo y la guía para conectarlo."
                                                    : "Sin hardware ni cuentas externas. Hasta 5 por cuenta."}
                                            </span>
                                        </span>
                                    </button>
                                );
                            }}
                        </For>
                    </div>
                    <Alert tone="warning">
                        El tipo no se puede cambiar después: un cultivo real no pasa a virtual ni al revés. Si cambias
                        de idea,
                        crea otro.
                    </Alert>
                </div>
            </Show>

            <Show when={step() === "details" && kind()}>
                {(currentKind) => (
                    <div class="grid gap-5 sm:grid-cols-2">
                        <form id="create-crop" onSubmit={create} class="space-y-4" noValidate>
                            <Show when={error()}>
                                {(err) => <Alert tone="danger">{err()}</Alert>}
                            </Show>
                            <TextField label="Nombre" placeholder="Lechugas del balcón" value={name()} maxLength={60}
                                       onChange={(event) => setName(event.currentTarget.value)}/>
                            <SelectField label="Especie" value={type()}
                                         onChange={(event) => setType(event.currentTarget.value as CropType)}
                                         hint={CROP_TYPES[type()].hint}>
                                <For each={Object.entries(CROP_TYPES)}>
                                    {([value, info]) => <option value={value}>{info.label}</option>}
                                </For>
                            </SelectField>
                            <fieldset>
                                <legend class="mb-1.5 text-sm font-semibold">Forma del cultivo</legend>
                                <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Forma del cultivo">
                                    <For each={Object.keys(CROP_FORMS) as CropForm[]}>
                                        {(option) => (
                                            <button type="button" role="radio" aria-checked={form() === option}
                                                    onClick={() => setForm(option)}
                                                    title={CROP_FORMS[option].hint}
                                                    class={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${form() === option
                                                        ? "border-leaf-600 bg-leaf-50 text-leaf-800 ring-2 ring-leaf-600/30" : "border-line bg-white hover:bg-surface"}`}>
                                                {CROP_FORMS[option].label}
                                            </button>
                                        )}
                                    </For>
                                </div>
                                <p class="mt-1.5 text-xs text-muted">{CROP_FORMS[form()].hint}</p>
                            </fieldset>
                        </form>
                        <div class="space-y-3">
                            <CropScene form={form()} type={type()} installed={STARTING_ACTUATORS[currentKind()]}
                                       running={NOTHING_RUNNING} isDay
                                       setting={placement().setting} exposure={placement().exposure}
                                       vigor="healthy"
                                       label={`Vista previa: ${CROP_TYPES[type()].label} ${CROP_FORMS[form()].phrase}`}/>
                            <p class="text-xs text-muted">
                                {currentKind() === "REAL"
                                    ? "Nace con la bomba de agua, la luz ultravioleta y el ventilador del firmware; puedes sumar más en Control."
                                    : "Nace con los seis actuadores: bomba, luz ultravioleta, ventilador, humidificador y dosificadores de nutrientes y pH."}
                            </p>
                        </div>
                        <div class="space-y-2 sm:col-span-2">
                            <p class="text-sm font-semibold">¿Dónde está? <span class="font-normal text-muted">(puedes cambiarlo luego en Ajustes)</span>
                            </p>
                            <PlacementPicker type={type()} value={placement()} onChange={setPlacement}/>
                        </div>
                        <Show when={currentKind() === "VIRTUAL"}>
                            <div class="space-y-3 sm:col-span-2">
                                <p class="text-sm font-semibold">¿Cómo empieza la simulación?</p>
                                <ModePicker value={mode()} onChange={setMode}/>
                                <Show when={mode() === "WEATHER"}>
                                    <p class="text-xs text-muted">
                                        {placement().location
                                            ? `Sigue el clima de ${placement().location!.name}, filtrado por el lugar que elegiste.`
                                            : "Elige arriba la ubicación del cultivo: su clima es el que se simula."}
                                    </p>
                                </Show>
                                <Show when={mode() === "MANUAL"}>
                                    <p class="text-xs text-muted">Empieza con los valores típicos de la especie;
                                        muévelos luego en la pestaña Simulación.</p>
                                </Show>
                            </div>
                        </Show>
                    </div>
                )}
            </Show>

            <Show when={step() === "connect" && created()?.device}>
                <div class="space-y-4">
                    <p class="text-sm text-muted">
                        «{created()!.crop.name}» está listo. Conéctalo con un ESP32 físico o con la simulación del mismo
                        firmware en
                        Wokwi: los dos son cultivos reales y usan esta clave.
                    </p>
                    <ConnectionGuide credentials={created()!.device!}/>
                </div>
            </Show>
        </Dialog>
    );
}
