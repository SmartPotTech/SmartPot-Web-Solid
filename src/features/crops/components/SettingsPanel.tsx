import {useNavigate} from "@solidjs/router";
import {MapPinned, Save, Trash2} from "lucide-solid";
import {createSignal, For, Show} from "solid-js";
import {Button} from "../../../components/ui/Button";
import {SelectField, TextField} from "../../../components/ui/Field";
import {Alert} from "../../../components/ui/Feedback";
import {Dialog} from "../../../components/ui/Dialog";
import {ApiError} from "../../../lib/api/client";
import {cropApi} from "../../../lib/api/services";
import {CROP_FORMS, CROP_KINDS, CROP_TYPES} from "../../../lib/catalog";
import type {Crop, CropForm, CropType, Placement} from "../../../lib/api/types";
import {CropNotifications} from "./CropNotifications";
import {PlacementPicker} from "./PlacementPicker";

export function SettingsPanel(props: { crop: Crop; onSaved: (crop: Crop) => void }) {
    const navigate = useNavigate();
    const [name, setName] = createSignal(props.crop.name);
    const [type, setType] = createSignal<CropType>(props.crop.type);
    const [form, setForm] = createSignal<CropForm>(props.crop.form);
    const [message, setMessage] = createSignal<{ tone: "success" | "danger"; text: string } | null>(null);
    const [saving, setSaving] = createSignal(false);
    const [deleting, setDeleting] = createSignal(false);
    const [confirmName, setConfirmName] = createSignal("");
    const [open, setOpen] = createSignal(false);
    const [placement, setPlacement] = createSignal<Placement>(props.crop.placement ?? {});
    const [placementMessage, setPlacementMessage] = createSignal<{ tone: "success" | "danger"; text: string } | null>(null);
    const [placing, setPlacing] = createSignal(false);

    async function savePlacement() {
        setPlacing(true);
        setPlacementMessage(null);
        try {
            props.onSaved(await cropApi.update(props.crop.id, {
                name: props.crop.name,
                type: props.crop.type,
                form: props.crop.form,
                placement: placement(),
            }));
            setPlacementMessage({tone: "success", text: "Lugar guardado: la ilustración y el asistente ya lo usan"});
        } catch (caught) {
            setPlacementMessage({
                tone: "danger",
                text: caught instanceof ApiError ? caught.message : "No se pudo guardar",
            });
        } finally {
            setPlacing(false);
        }
    }

    async function save(event: SubmitEvent) {
        event.preventDefault();
        if (name().trim().length < 2) {
            setMessage({tone: "danger", text: "El nombre debe tener al menos 2 caracteres"});
            return;
        }
        setSaving(true);
        try {
            props.onSaved(await cropApi.update(props.crop.id, {
                name: name().trim(),
                type: type(),
                form: form(),
                placement: props.crop.placement ?? undefined,
            }));
            setMessage({tone: "success", text: "Cambios guardados"});
        } catch (caught) {
            setMessage({tone: "danger", text: caught instanceof ApiError ? caught.message : "No se pudo guardar"});
        } finally {
            setSaving(false);
        }
    }

    async function remove() {
        setDeleting(true);
        try {
            await cropApi.remove(props.crop.id);
            navigate("/app/crops", {replace: true});
        } catch (caught) {
            setMessage({tone: "danger", text: caught instanceof ApiError ? caught.message : "No se pudo eliminar"});
            setDeleting(false);
            setOpen(false);
        }
    }

    return (
        <div class="space-y-5">
            <form onSubmit={save} class="card space-y-4 p-5">
                <h3 class="font-semibold">Datos del cultivo</h3>
                <Show when={message()}>
                    {(msg) => <Alert tone={msg().tone}>{msg().text}</Alert>}
                </Show>
                <TextField label="Nombre" value={name()} maxLength={60}
                           onChange={(event) => setName(event.currentTarget.value)}/>
                <SelectField label="Especie" value={type()}
                             onChange={(event) => setType(event.currentTarget.value as CropType)}
                             hint="Cambiar la especie cambia los rangos ideales que usa el asistente.">
                    <For each={Object.entries(CROP_TYPES)}>
                        {([value, info]) => <option value={value}>{info.label}</option>}
                    </For>
                </SelectField>
                <SelectField label="Forma del cultivo" value={form()}
                             onChange={(event) => setForm(event.currentTarget.value as CropForm)}
                             hint={`${CROP_FORMS[form()].hint} Cambia cómo se ilustra el cultivo.`}>
                    <For each={Object.entries(CROP_FORMS)}>
                        {([value, info]) => <option value={value}>{info.label}</option>}
                    </For>
                </SelectField>
                <div class="rounded-xl bg-surface px-3 py-2 text-sm">
                    <p><span
                        class="font-semibold">Tipo: {CROP_KINDS[props.crop.kind].label}.</span> {CROP_KINDS[props.crop.kind].hint}
                    </p>
                    <p class="mt-0.5 text-xs text-muted">No se puede cambiar: para pasar de real a virtual, o al
                        revés, crea otro cultivo.</p>
                </div>
                <Button type="submit" icon={<Save size={16}/>} loading={saving()}>Guardar cambios</Button>
            </form>

            <section class="card space-y-4 p-5" aria-labelledby="placement-title">
                <div>
                    <h3 id="placement-title" class="flex items-center gap-2 font-semibold">
                        <MapPinned size={16} class="text-leaf-700"/> Dónde está
                    </h3>
                    <p class="text-sm text-muted">
                        Cambia cómo se ilustra y lo que recomienda el asistente{props.crop.kind === "VIRTUAL"
                        ? "; en un cultivo virtual también cambia el clima que simula" : ""}.
                    </p>
                </div>
                <Show when={placementMessage()}>
                    {(msg) => <Alert tone={msg().tone}>{msg().text}</Alert>}
                </Show>
                <PlacementPicker type={props.crop.type} value={placement()} onChange={setPlacement}/>
                <Button icon={<Save size={16}/>} loading={placing()} onClick={() => void savePlacement()}>Guardar
                    lugar</Button>
            </section>

            <CropNotifications crop={props.crop}/>

            <section class="card border-danger-500/30 p-5">
                <h3 class="font-semibold text-danger-600">Eliminar cultivo</h3>
                <p class="mt-1 text-sm text-muted">Se borran sus lecturas, comandos y actuadores; la clave del
                    dispositivo deja de funcionar y, si es virtual, se apaga su simulación.</p>
                <Button variant="danger" class="mt-4" icon={<Trash2 size={16}/>}
                        onClick={() => setOpen(true)}>Eliminar</Button>
            </section>

            <Dialog open={open()} title="Eliminar cultivo" onClose={() => setOpen(false)}
                    footer={<>
                        <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button variant="danger" loading={deleting()} disabled={confirmName() !== props.crop.name}
                                onClick={() => void remove()}>
                            Eliminar definitivamente
                        </Button>
                    </>}>
                <p class="mb-3 text-sm text-muted">Esta acción no se puede deshacer.
                    Escribe <strong>{props.crop.name}</strong> para confirmar.</p>
                <TextField label="Nombre del cultivo" value={confirmName()}
                           onChange={(event) => setConfirmName(event.currentTarget.value)}/>
            </Dialog>
        </div>
    );
}
