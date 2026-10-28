import {createUniqueId, For, type JSX, Show} from "solid-js";
import {Dynamic} from "solid-js/web";
import type {
    ActuatorType,
    CropForm,
    CropType,
    PlacementSetting,
    SunExposure,
    WeatherCondition,
} from "../../../../lib/api/types";
import type {Vigor} from "../../live";
import {Backdrop, GROUND, HEIGHT, Shelter, WIDTH} from "./Backdrop";
import {Doser, Fan, GrowLight, Humidifier, WaterPump} from "./Equipment";
import {Plant} from "./Plant";

export interface CropSceneProps {
    form: CropForm;
    type: CropType;
    /** Actuadores instalados: solo se dibujan esos. */
    installed: ActuatorType[];
    running: Set<ActuatorType>;
    /** Clima del lugar: el cielo al aire libre o lo que se ve por la ventana bajo techo. */
    condition?: WeatherCondition | null;
    /** Bajo techo o al aire libre; sin él, un clima conocido significa aire libre. */
    setting?: PlacementSetting | null;
    /** Cuánto sol recibe: al aire libre agrega una malla de sombra o un árbol; bajo techo, el sol de la ventana. */
    exposure?: SunExposure | null;
    isDay: boolean;
    vigor: Vigor;
    /** Humedad del sustrato (0–100): oscurece el sustrato de la maceta y de la torre. */
    moisture?: number;
    label: string;
}

interface Parts {
    has: (type: ActuatorType) => boolean;
    on: (type: ActuatorType) => boolean;
    readonly type: CropType;
    readonly vigor: Vigor;
    readonly soil: string;
}

const TALL: CropType[] = ["TOMATO", "PEPPER", "BASIL"];
const OUTLINE = "#B9C7CE";

function soilColor(moisture: number | undefined): string {
    const t = Math.min(1, Math.max(0, (moisture ?? 60) / 100));
    const mix = (dry: number, wet: number) => Math.round(dry + (wet - dry) * t).toString(16).padStart(2, "0");
    return `#${mix(0xc9, 0x5a)}${mix(0xa2, 0x3e)}${mix(0x7e, 0x2c)}`;
}

function Reservoir(props: { x: number; y: number; w: number }) {
    const h = () => GROUND - props.y;
    return (
        <g data-part="reservoir">
            <rect x={props.x} y={props.y} width={props.w} height={h()} rx="4" fill="#FFFFFF" stroke={OUTLINE} stroke-width="2"/>
            <rect x={props.x + 3} y={props.y + h() * 0.3} width={props.w - 6} height={h() * 0.7 - 3} rx="2" fill="#2D9CDB" opacity="0.35"/>
            <line x1={props.x} y1={props.y} x2={props.x + props.w} y2={props.y} stroke="#8FA3AE" stroke-width="3" stroke-linecap="round"/>
        </g>
    );
}

function Dosers(props: { parts: Parts; slots: [number, number]; lid: number }) {
    return (
        <>
            <Show when={props.parts.has("NUTRIENT_DOSER")}>
                <Doser type="NUTRIENT_DOSER" x={props.slots[0]} y={props.lid} dropY={props.lid + 5} on={props.parts.on("NUTRIENT_DOSER")}/>
            </Show>
            <Show when={props.parts.has("PH_DOSER")}>
                <Doser type="PH_DOSER" x={props.slots[1]} y={props.lid} dropY={props.lid + 5} on={props.parts.on("PH_DOSER")}/>
            </Show>
        </>
    );
}

/** Maceta con depósito debajo: la bomba sube la solución y la gotea sobre el sustrato. */
function PotSystem(parts: Parts) {
    return (
        <g data-form="POT">
            <Reservoir x={108} y={170} w={144}/>
            <Show when={parts.has("WATER_PUMP")}>
                <WaterPump x={124} y={189} on={parts.on("WATER_PUMP")} pipes={["M124 182 L124 100 L160 100 L160 108"]}
                           drips={[[160, 111], [160, 116]]}/>
            </Show>
            <path d="M146 124 L214 124 L206 170 L154 170 Z" fill="#D9734E"/>
            <ellipse cx="180" cy="124" rx="34" ry="4" fill={parts.soil}/>
            <Plant type={parts.type} x={180} y={122} scale={1.05} vigor={parts.vigor}/>
            <rect x="140" y="118" width="80" height="9" rx="3" fill="#B85A38"/>
            <Dosers parts={parts} slots={[224, 242]} lid={170}/>
        </g>
    );
}

/** Tubos NFT: la bomba llena el colector derecho, la solución corre por cada tubo y vuelve al depósito. */
function NftSystem(parts: Parts) {
    const tubes = [74, 110, 146];
    const cups = [112, 158, 204, 250];
    const scale = () => (TALL.includes(parts.type) ? 0.42 : 0.55);
    const flowing = () => parts.on("WATER_PUMP");
    return (
        <g data-form="NFT">
            <For each={[80, 290]}>
                {(x) => <line x1={x} y1={60} x2={x} y2={GROUND} stroke="#5B6B63" stroke-width="3"/>}
            </For>
            <Reservoir x={168} y={172} w={108}/>
            <Show when={parts.has("WATER_PUMP")}>
                <WaterPump x={262} y={190} on={flowing()} pipes={[
                    "M262 183 L262 178 L300 178 L300 74 L286 74", "M300 110 L286 110", "M300 146 L286 146",
                    "M84 74 L68 74 L68 160 L178 160 L178 172", "M84 110 L68 110", "M84 146 L68 146",
                ]}/>
            </Show>
            <For each={tubes}>
                {(y) => (
                    <g>
                        <rect x="84" y={y - 7} width="202" height="14" rx="7" fill="#FFFFFF" stroke={OUTLINE}
                              stroke-width="2"/>
                        <line x1="90" y1={y + 3} x2="280" y2={y + 3} stroke={flowing() ? "#2D9CDB" : "#E3F2FB"}
                              stroke-width="2.5"
                              stroke-dasharray={flowing() ? "6 4" : undefined} class={flowing() ? "scene-flow" : undefined}/>
                        <For each={cups}>
                            {(x) => (
                                <g>
                                    <Plant type={parts.type} x={x} y={y - 8} scale={scale()} vigor={parts.vigor}/>
                                    <rect x={x - 6} y={y - 10} width="12" height="5" rx="1.5" fill="#5B6B63"/>
                                </g>
                            )}
                        </For>
                    </g>
                )}
            </For>
            <Dosers parts={parts} slots={[206, 228]} lid={172}/>
        </g>
    );
}

/** Torre vertical: la bomba sube la solución por dentro y baja por gravedad a cada bolsillo. */
function TowerSystem(parts: Parts) {
    const pockets: [number, "left" | "right"][] = [[70, "left"], [92, "right"], [114, "left"], [136, "right"]];
    return (
        <g data-form="TOWER">
            <Reservoir x={118} y={168} w={124}/>
            <rect x="166" y="42" width="28" height="126" rx="4" fill="#FFFFFF" stroke={OUTLINE} stroke-width="2"/>
            <Show when={parts.has("WATER_PUMP")}>
                <WaterPump x={180} y={190} on={parts.on("WATER_PUMP")} pipes={["M180 183 L180 48"]}
                           drips={[[173, 62], [187, 88], [173, 110], [187, 132]]}/>
            </Show>
            <rect x="161" y="36" width="38" height="8" rx="3" fill={OUTLINE}/>
            <Plant type={parts.type} x={180} y={37} scale={0.5} vigor={parts.vigor}/>
            <For each={pockets}>
                {([y, side]) => {
                    const sign = side === "left" ? -1 : 1;
                    const wall = side === "left" ? 166 : 194;
                    const mouth = wall + sign * 13;
                    return (
                        <g>
                            <path
                                d={`M${wall} ${y + 4} L${wall + sign * 15} ${y - 6} L${wall + sign * 11} ${y - 12} L${wall} ${y - 4} Z`}
                                fill="#FFFFFF" stroke={OUTLINE} stroke-width="1.5"/>
                            <g transform={`rotate(${sign * 28} ${mouth} ${y - 9})`}>
                                <Plant type={parts.type} x={mouth} y={y - 9} scale={0.42} vigor={parts.vigor}/>
                            </g>
                            <ellipse cx={wall + sign * 13} cy={y - 9} rx="4" ry="2" fill={parts.soil}
                                     transform={`rotate(${sign * 28} ${mouth} ${y - 9})`}/>
                        </g>
                    );
                }}
            </For>
            <Dosers parts={parts} slots={[214, 232]} lid={168}/>
        </g>
    );
}

/** Balsa flotante: las raíces cuelgan en la solución y la bomba la airea desde el fondo. */
function RaftSystem(parts: Parts) {
    const pots = [116, 160, 204, 248];
    const scale = () => (TALL.includes(parts.type) ? 0.6 : 0.75);
    return (
        <g data-form="RAFT">
            <rect x="60" y="126" width="226" height={GROUND - 126} rx="4" fill="#FFFFFF" stroke={OUTLINE}
                  stroke-width="2"/>
            <rect x="63" y="140" width="220" height={GROUND - 143} rx="2" fill="#2D9CDB" opacity="0.35"/>
            <For each={pots}>
                {(x) => (
                    <g fill="none" stroke="#7FDBB0" stroke-width="1.3" stroke-linecap="round">
                        <path d={`M${x - 3} 144 q-4 12 0 24 q3 8 -2 14`}/>
                        <path d={`M${x} 144 q3 14 0 28`}/>
                        <path d={`M${x + 3} 144 q5 10 1 22`}/>
                    </g>
                )}
            </For>
            <Show when={parts.has("WATER_PUMP")}>
                <rect x="238" y="186" width="34" height="6" rx="3" fill="#5B6B63"/>
                <WaterPump x={304} y={193} on={parts.on("WATER_PUMP")}
                           pipes={["M304 186 L304 118 L277 118 L277 188"]}
                           bubbles={[[244, 184], [252, 180], [260, 184], [268, 180]]}/>
            </Show>
            <rect x="92" y="134" width="178" height="10" rx="3" fill="#F2F7F4" stroke={OUTLINE} stroke-width="1.5"/>
            <For each={pots}>
                {(x) => (
                    <g>
                        <Plant type={parts.type} x={x} y={134} scale={scale()} vigor={parts.vigor}/>
                        <rect x={x - 7} y="132" width="14" height="7" rx="2" fill="#5B6B63"/>
                    </g>
                )}
            </For>
            <rect x="60" y="120" width="32" height="3" rx="1" fill="#5B6B63"/>
            <Dosers parts={parts} slots={[68, 84]} lid={120}/>
        </g>
    );
}

const SYSTEMS: Record<CropForm, (parts: Parts) => JSX.Element> = {
    POT: PotSystem,
    NFT: NftSystem,
    TOWER: TowerSystem,
    RAFT: RaftSystem,
};

const LIGHTS: Record<CropForm, { x: number; y: number; width: number; reach: number }> = {
    POT: {x: 180, y: 30, width: 100, reach: 124},
    NFT: {x: 185, y: 18, width: 206, reach: 150},
    TOWER: {x: 180, y: 6, width: 110, reach: 168},
    RAFT: {x: 176, y: 24, width: 200, reach: 134},
};

const FANS: Record<CropForm, { x: number; y: number }> = {
    POT: {x: 44, y: 118},
    NFT: {x: 36, y: 110},
    TOWER: {x: 44, y: 112},
    RAFT: {x: 30, y: 100},
};

const HUMIDIFIERS: Record<CropForm, number> = {POT: 318, NFT: 330, TOWER: 318, RAFT: 336};

/**
 * Ilustración fiel del cultivo: su forma (maceta, tubos NFT, torre o balsa), la especie con el color de su salud,
 * el entorno (bajo techo o al aire libre, con el clima y la sombra del lugar) y cada actuador instalado, animado
 * mientras está encendido.
 */
export function CropScene(props: CropSceneProps) {
    const has = (actuator: ActuatorType) => props.installed.includes(actuator);
    const on = (actuator: ActuatorType) => has(actuator) && props.running.has(actuator);
    const parts: Parts = {
        has,
        on,
        get type() {
            return props.type;
        },
        get vigor() {
            return props.vigor;
        },
        get soil() {
            return soilColor(props.moisture);
        },
    };
    const system = () => SYSTEMS[props.form] ?? PotSystem;
    const light = () => LIGHTS[props.form] ?? LIGHTS.POT;
    const fan = () => FANS[props.form] ?? FANS.POT;
    const id = `scene${createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
    return (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={props.label}
             class="crop-scene h-auto w-full rounded-xl">
            <defs>
                <linearGradient id={`${id}-light`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="#F2B632" stop-opacity="0.5"/>
                    <stop offset="1" stop-color="#F2B632" stop-opacity="0.06"/>
                </linearGradient>
            </defs>
            <Backdrop id={id} condition={props.condition} isDay={props.isDay} setting={props.setting} exposure={props.exposure}/>
            <Show when={has("FAN")}><Fan x={fan().x} y={fan().y} on={on("FAN")}/></Show>
            <Show when={has("HUMIDIFIER")}><Humidifier x={HUMIDIFIERS[props.form] ?? 318} on={on("HUMIDIFIER")}/></Show>
            <Dynamic component={system()} {...parts}/>
            <Show when={has("UV_LIGHT")}><GrowLight {...light()} on={on("UV_LIGHT")} glow={`${id}-light`}/></Show>
            <Shelter setting={props.setting} exposure={props.exposure} isDay={props.isDay}/>
        </svg>
    );
}
