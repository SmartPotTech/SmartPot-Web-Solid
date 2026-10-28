import {A} from "@solidjs/router";
import {
    ArrowRight,
    Bot,
    BrainCircuit,
    Download,
    FileDown,
    Gauge,
    Radio,
    ShieldCheck,
    Smartphone,
    Sprout,
    Wifi,
} from "lucide-solid";
import {For, Show} from "solid-js";
import {LogoMark} from "../../components/brand/Logo";
import {usePageMeta} from "../../hooks/usePageMeta";
import {CROP_TYPES} from "../../lib/catalog";
import {useInstallPrompt} from "../pwa/pwa";
import {FAQ} from "./faq";

const FEATURES = [
    {
        icon: Radio, title: "Monitoreo en tiempo real",
        text: "Temperatura, humedad del aire y del sustrato, luz, pH y nutrientes llegan desde tu ESP32 cada 30 segundos por MQTT, o de un cultivo virtual que SmartPot simula."
    },
    {
        icon: BrainCircuit, title: "Asistente de inteligencia artificial",
        text: "Un sistema experto, lógica difusa y modelos de aprendizaje automático diagnostican tu cultivo y te dicen qué hacer."
    },
    {
        icon: Bot, title: "Automatización con un agente",
        text: "Activa el modo automático y el agente riega, ventila o enciende la luz ultravioleta cuando hace falta."
    },
    {
        icon: Gauge, title: "Índice de salud",
        text: "Un puntaje de 0 a 100 resume el estado de cada planta para que sepas de un vistazo cuál necesita atención."
    },
    {
        icon: FileDown, title: "Historial y exportación",
        text: "Gráficas con el rango ideal de cada especie y descarga de tus lecturas en CSV para analizarlas."
    },
    {
        icon: ShieldCheck, title: "Seguro por diseño",
        text: "Conexión cifrada con TLS, una clave distinta por cultivo y aislamiento: nadie puede leer ni controlar tus cultivos."
    },
];

const STEPS = [
    {
        title: "Crea tu cultivo",
        text: "Elige si es real o virtual, la especie y su forma: maceta, tubos NFT, torre o balsa. SmartPot carga sus rangos ideales."
    },
    {
        title: "Conéctalo y míralo en vivo",
        text: "Configura el ESP32 (o su simulación en Wokwi) con la guía y la clave del cultivo, o deja que SmartPot lo simule. Lo verás crecer con cada actuador."
    },
    {
        title: "Cuida con datos",
        text: "Sigue las lecturas, recibe alertas y deja que el asistente te recomiende o actúe por ti."
    },
];

export function LandingPage() {
    usePageMeta("", {
        index: true,
        description: "SmartPot monitorea tus cultivos hidropónicos en tiempo real y un asistente de IA te dice qué necesitan o actúa por ti. Gratis, instalable y de código abierto.",
    });
    const installPrompt = useInstallPrompt();

    return (
        <>
            <section class="relative overflow-hidden bg-leaf-950 text-white">
                <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(0,176,116,0.35),transparent_55%)]"/>
                <div class="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
                    <div>
                        <p class="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold
              text-leaf-300">
                            <Sprout size={14}/> Hidroponía + IoT + inteligencia artificial
                        </p>
                        <h1 class="mt-5 text-4xl font-bold leading-tight md:text-6xl">
                            Tu huerto hidropónico, <span class="text-leaf-500">en tu bolsillo</span>
                        </h1>
                        <p class="mt-5 max-w-xl text-lg text-leaf-100/85">
                            SmartPot monitorea tus cultivos en tiempo real y un asistente de IA te dice qué necesitan
                            cada planta,
                            o actúa por ti cuando activas el modo automático.
                        </p>
                        <div class="mt-8 flex flex-wrap gap-3">
                            <A href="/register" class="inline-flex h-12 items-center gap-2 rounded-xl bg-leaf-500 px-6 font-semibold
                text-leaf-950 hover:bg-leaf-300">
                                Crear cuenta gratis <ArrowRight size={18}/>
                            </A>
                            <A href="/login" class="inline-flex h-12 items-center rounded-xl border border-white/25 px-6 font-semibold
                hover:bg-white/10">
                                Ya tengo cuenta
                            </A>
                        </div>
                    </div>
                    <div class="mx-auto w-full max-w-sm">
                        <div class="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
                            <div class="flex items-center gap-3">
                                <LogoMark size={44}/>
                                <div>
                                    <p class="font-display text-lg font-semibold">Lechugas del balcón</p>
                                    <p class="text-sm text-leaf-300">En línea · hace 12 s</p>
                                </div>
                            </div>
                            <div class="mt-6 grid grid-cols-2 gap-3 text-sm">
                                <For each={[["Temperatura", "19,4 °C"], ["Sustrato", "68 %"], ["pH", "6,05"], ["Nutrientes", "712 ppm"]] as const}>
                                    {([k, v]) => (
                                        <div class="rounded-2xl bg-white/5 p-3">
                                            <p class="text-leaf-300/80">{k}</p>
                                            <p class="mt-1 text-lg font-semibold">{v}</p>
                                        </div>
                                    )}
                                </For>
                            </div>
                            <div class="mt-4 rounded-2xl bg-leaf-500/15 p-3 text-sm">
                                <p class="font-semibold text-leaf-300">Salud 92/100 · Excelente</p>
                                <p class="mt-1 text-leaf-100/80">Todas las variables están en su rango ideal.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="funciones" class="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:py-20">
                <h2 class="text-3xl font-bold md:text-4xl">Todo lo que tu cultivo necesita</h2>
                <p class="mt-3 max-w-2xl text-muted">Pensado para estudiantes, huertas caseras y proyectos
                    comunitarios de hidroponía.</p>
                <div class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <For each={FEATURES}>
                        {({icon: Icon, title, text}) => (
                            <article class="card p-6">
                                <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-50 text-leaf-700">
                                    <Icon size={22}/>
                                </div>
                                <h3 class="mt-4 text-lg font-semibold">{title}</h3>
                                <p class="mt-2 text-sm leading-relaxed text-muted">{text}</p>
                            </article>
                        )}
                    </For>
                </div>
            </section>

            <section id="como-funciona" class="scroll-mt-20 bg-surface">
                <div class="mx-auto max-w-6xl px-4 py-16 md:py-20">
                    <h2 class="text-3xl font-bold md:text-4xl">Cómo funciona</h2>
                    <ol class="mt-10 grid gap-5 md:grid-cols-3">
                        <For each={STEPS}>
                            {(step, index) => (
                                <li class="card p-6">
                                    <span class="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-700 font-display font-bold text-white">
                                        {index() + 1}
                                    </span>
                                    <h3 class="mt-4 text-lg font-semibold">{step.title}</h3>
                                    <p class="mt-2 text-sm text-muted">{step.text}</p>
                                </li>
                            )}
                        </For>
                    </ol>
                </div>
            </section>

            <section id="ia" class="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:py-20">
                <div class="grid gap-10 md:grid-cols-2 md:items-center">
                    <div>
                        <h2 class="text-3xl font-bold md:text-4xl">Inteligencia artificial que se explica</h2>
                        <p class="mt-4 text-muted">
                            El asistente de SmartPot combina cuatro técnicas y siempre te muestra por qué recomienda
                            algo.
                        </p>
                    </div>
                    <dl class="grid gap-4">
                        <For each={[
                            ["Sistema experto", "Reglas de agronomía encadenadas: detecta estrés térmico, riesgo de hongos o bloqueo de nutrientes."],
                            ["Lógica difusa", "Convierte lecturas imprecisas en un índice de salud de 0 a 100."],
                            ["Aprendizaje automático", "Una regresión logística, una red neuronal y un Isolation Forest predicen ventilación, corrección de pH y lecturas atípicas."],
                            ["Agente reactivo", "Traduce el diagnóstico en acciones sobre la bomba, la luz o el ventilador cuando tú lo permites."],
                        ] as const}>
                            {([term, detail]) => (
                                <div class="card p-5">
                                    <dt class="font-semibold text-leaf-800">{term}</dt>
                                    <dd class="mt-1 text-sm text-muted">{detail}</dd>
                                </div>
                            )}
                        </For>
                    </dl>
                </div>
            </section>

            <section class="bg-surface">
                <div class="mx-auto max-w-6xl px-4 py-16">
                    <h2 class="text-3xl font-bold">Seis especies listas para cultivar</h2>
                    <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <For each={Object.entries(CROP_TYPES)}>
                            {([, crop]) => (
                                <li class="card flex items-start gap-3 p-5">
                                    <Sprout class="mt-0.5 shrink-0 text-leaf-600" size={20}/>
                                    <div>
                                        <p class="font-semibold">{crop.label}</p>
                                        <p class="text-sm text-muted">{crop.hint}</p>
                                    </div>
                                </li>
                            )}
                        </For>
                    </ul>
                </div>
            </section>

            <section class="mx-auto max-w-6xl px-4 py-16">
                <div class="card flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between">
                    <div class="flex items-start gap-4">
                        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-water-100 text-water-700">
                            <Smartphone size={24}/>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold">Instálala como una app</h2>
                            <p class="mt-1 text-muted">
                                SmartPot es una aplicación web progresiva: funciona en el navegador y se instala en
                                Android, iOS o
                                escritorio sin pasar por una tienda.
                            </p>
                            <Show when={installPrompt.iosHint}>
                                <p class="mt-2 text-sm text-leaf-800">En iPhone: toca «Compartir» y luego «Agregar a
                                    inicio».</p>
                            </Show>
                        </div>
                    </div>
                    <Show when={installPrompt.available} fallback={
                        <span class="inline-flex items-center gap-2 text-sm font-semibold text-leaf-800">
                            <Wifi size={18}/> Funciona también sin conexión
                        </span>
                    }>
                        <button type="button" onClick={() => void installPrompt.install()} class="inline-flex h-11 items-center gap-2 rounded-xl
              bg-leaf-700 px-5 font-semibold text-white hover:bg-leaf-800">
                            <Download size={18}/> Instalar SmartPot
                        </button>
                    </Show>
                </div>
            </section>

            <section id="preguntas" class="scroll-mt-20 bg-surface">
                <div class="mx-auto max-w-3xl px-4 py-16 md:py-20">
                    <h2 class="text-3xl font-bold md:text-4xl">Preguntas frecuentes</h2>
                    <div class="mt-8 space-y-3">
                        <For each={FAQ}>
                            {({question, answer}) => (
                                <details class="card group p-5">
                                    <summary class="cursor-pointer list-none font-semibold marker:hidden">
                                        <span class="flex items-center justify-between gap-4">
                                            {question}
                                            <ArrowRight size={18}
                                                        class="shrink-0 text-leaf-600 transition-transform group-open:rotate-90"/>
                                        </span>
                                    </summary>
                                    <p class="mt-3 text-sm leading-relaxed text-muted">{answer}</p>
                                </details>
                            )}
                        </For>
                    </div>
                </div>
            </section>

            <section class="bg-leaf-900 text-white">
                <div class="mx-auto flex max-w-6xl flex-col items-center px-4 py-16 text-center">
                    <h2 class="text-3xl font-bold">Empieza hoy, es gratis</h2>
                    <p class="mt-3 max-w-xl text-leaf-100/80">Crea tu cuenta y tu primer cultivo, real o virtual, en
                        minutos.</p>
                    <A href="/register" class="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-leaf-500 px-6 font-semibold
            text-leaf-950 hover:bg-leaf-300">
                        Crear cuenta gratis <ArrowRight size={18}/>
                    </A>
                </div>
            </section>
        </>
    );
}
