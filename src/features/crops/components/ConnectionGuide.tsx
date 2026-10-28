import {Check, Copy, Cpu, ExternalLink, MonitorPlay} from "lucide-solid";
import {createEffect, createSignal, For, type JSX, onCleanup, Show} from "solid-js";
import {Alert} from "../../../components/ui/Feedback";
import type {DeviceCredentials} from "../../../lib/api/types";
import {BROKER_CA_PATH, FIRMWARE_REPO, firmwareConfig, type FirmwareTarget, WOKWI_PROJECT} from "../firmware";
import {CredentialsView} from "./CredentialsView";

const TARGETS: { id: FirmwareTarget; label: string; hint: string; icon: typeof Cpu }[] = [
    {id: "esp32", label: "ESP32 físico", hint: "Tu placa con sus sensores y actuadores", icon: Cpu},
    {id: "wokwi", label: "Simulado en Wokwi", hint: "El mismo firmware en un ESP32 del navegador", icon: MonitorPlay},
];

/** Pines del circuito, los mismos del proyecto de Wokwi. */
const PINS = [
    ["DHT22 (temperatura y humedad)", "GPIO 15"],
    ["Luz", "GPIO 34"],
    ["pH", "GPIO 35"],
    ["TDS (nutrientes)", "GPIO 32"],
    ["Humedad del sustrato", "GPIO 33"],
    ["Bomba de agua", "GPIO 19"],
    ["Luz ultravioleta", "GPIO 18"],
    ["Ventilador", "GPIO 5"],
    ["Pantalla LCD I2C", "SCL 16 · SDA 17"],
];

function Step(props: { number: number; title: string; children: JSX.Element }) {
    return (
        <li class="flex gap-3">
            <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-leaf-700 text-sm font-bold text-white">
                {props.number}
            </span>
            <div class="min-w-0 flex-1 space-y-2 text-sm">
                <p class="font-semibold text-ink">{props.title}</p>
                {props.children}
            </div>
        </li>
    );
}

/** La CA pública del broker, para incluirla en BROKER de config.py. */
function useBrokerCertificate(enabled: () => boolean) {
    const [certificate, setCertificate] = createSignal<string>();
    createEffect(() => {
        if (!enabled()) return;
        let active = true;
        fetch(BROKER_CA_PATH)
            .then((response) => (response.ok ? response.text() : ""))
            .then((text) => {
                if (active && text.includes("BEGIN CERTIFICATE")) setCertificate(text);
            })
            .catch(() => undefined);
        onCleanup(() => {
            active = false;
        });
    });
    return certificate;
}

function ConfigBlock(props: { credentials: DeviceCredentials; target: FirmwareTarget }) {
    const [copied, setCopied] = createSignal(false);
    const certificate = useBrokerCertificate(() => props.credentials.tls);
    const config = () => firmwareConfig(props.credentials, props.target, certificate());
    return (
        <div class="relative">
            <pre class="overflow-x-auto rounded-lg bg-leaf-950 p-3 pr-10 text-xs text-leaf-100">{config()}</pre>
            <button type="button" aria-label="Copiar config.py"
                    class="absolute right-2 top-2 rounded p-1 text-leaf-100/80 hover:text-white"
                    onClick={async () => {
                        await navigator.clipboard?.writeText(config());
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                    }}>
                <Show when={copied()} fallback={<Copy size={16}/>}>
                    <Check size={16}/>
                </Show>
            </button>
            <Show when={props.credentials.tls}>
                <p class="mt-1.5 text-xs text-muted">
                    <code>BROKER</code> ya trae la CA pública con la que el dispositivo verifica el broker (<a
                    href={BROKER_CA_PATH} download="" class="font-semibold text-leaf-700">ca.crt</a>).
                </p>
            </Show>
        </div>
    );
}

function Link(props: { href: string; children: JSX.Element }) {
    return (
        <a href={props.href} target="_blank" rel="noreferrer"
           class="inline-flex items-center gap-1 font-semibold text-water-700 hover:underline">
            {props.children} <ExternalLink size={13}/>
        </a>
    );
}

/**
 * Guía para conectar un cultivo real: un ESP32 físico o el mismo firmware simulado en Wokwi. Los dos usan la
 * cuenta MQTT del cultivo; lo simulado en Wokwi también es un cultivo real, distinto de un cultivo virtual.
 */
export function ConnectionGuide(props: { credentials: DeviceCredentials }) {
    const [target, setTarget] = createSignal<FirmwareTarget>("esp32");
    return (
        <div class="space-y-5">
            <CredentialsView credentials={props.credentials}/>

            <div class="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Dónde corre el firmware">
                <For each={TARGETS}>
                    {(item) => {
                        const Icon = item.icon;
                        return (
                            <button type="button" role="radio" aria-checked={target() === item.id}
                                    onClick={() => setTarget(item.id)}
                                    class={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${target() === item.id
                                        ? "border-leaf-600 bg-leaf-50 ring-2 ring-leaf-600/30" : "border-line bg-white hover:bg-surface"}`}>
                                <Icon size={20} class="mt-0.5 shrink-0 text-leaf-700"/>
                                <span>
                                    <span class="block font-semibold">{item.label}</span>
                                    <span class="block text-xs text-muted">{item.hint}</span>
                                </span>
                            </button>
                        );
                    }}
                </For>
            </div>

            <Show when={target() === "esp32"} fallback={
                <ol class="space-y-4">
                    <Step number={1} title="Abre el proyecto de Wokwi">
                        <p class="text-muted">
                            <Link href={WOKWI_PROJECT}>Proyecto SmartPot en Wokwi</Link>: el ESP32, los sensores y los
                            actuadores ya
                            están conectados. Guarda una copia en tu cuenta de Wokwi.
                        </p>
                    </Step>
                    <Step number={2} title="Pega config.py">
                        <ConfigBlock credentials={props.credentials} target="wokwi"/>
                    </Step>
                    <Step number={3} title="Ejecuta la simulación">
                        <p class="text-muted">La red <code>Wokwi-GUEST</code> tiene salida a Internet: mueve los
                            sensores del circuito
                            y mira cómo cambian las lecturas y cómo reaccionan los actuadores.</p>
                    </Step>
                </ol>
            }>
                <ol class="space-y-4">
                    <Step number={1} title="Arma el circuito">
                        <ul class="grid gap-x-4 gap-y-1 text-muted sm:grid-cols-2">
                            <For each={PINS}>
                                {([part, pin]) => (
                                    <li class="flex justify-between gap-2 border-b border-line/70 py-0.5">
                                        <span>{part}</span><span class="font-medium text-ink">{pin}</span>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </Step>
                    <Step number={2} title="Graba MicroPython y el firmware">
                        <p class="text-muted">
                            Instala MicroPython 1.23 en el ESP32 y copia la carpeta <code>fs/</code> del <Link
                            href={FIRMWARE_REPO}>firmware
                            de SmartPot</Link> con <code>mpremote</code>.
                        </p>
                    </Step>
                    <Step number={3} title="Crea config.py con tu red y este cultivo">
                        <ConfigBlock credentials={props.credentials} target="esp32"/>
                    </Step>
                    <Step number={4} title="Enciende la placa">
                        <p class="text-muted">En unos segundos el cultivo aparece <strong class="text-ink">En
                            línea</strong> y
                            llegan las lecturas; la pantalla LCD muestra los mismos valores.</p>
                    </Step>
                </ol>
            </Show>
            <Show when={target() === "wokwi"}>
                <Alert tone="warning">
                    Deja tu copia del proyecto como privada: quien vea <code>config.py</code> puede publicar como tu
                    cultivo. Si se
                    filtra, genera una nueva clave.
                </Alert>
            </Show>
        </div>
    );
}
