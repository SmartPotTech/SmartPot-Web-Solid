import {For, Show} from "solid-js";
import type {PlacementSetting, SunExposure, WeatherCondition} from "../../../../lib/api/types";

export const WIDTH = 360;
export const HEIGHT = 220;
export const GROUND = 200;

const SKY = {
    clear: ["#7FC8F0", "#E3F2FB"],
    cloudy: ["#A9C3D1", "#E6EEF2"],
    wet: ["#6F8794", "#B9C7CE"],
    fog: ["#C4CFD3", "#E9EEF0"],
    snow: ["#C9DDE8", "#F2F7F4"],
    night: ["#06281C", "#1F6FA0"],
} satisfies Record<string, [string, string]>;

const CLOUDS: Partial<Record<WeatherCondition, number>> = {
    MOSTLY_CLEAR: 1, PARTLY_CLOUDY: 2, CLOUDY: 3, FOG: 2, DRIZZLE: 3, RAIN: 3, SNOW: 3, STORM: 3,
};

function skyFor(condition: WeatherCondition, isDay: boolean): [string, string] {
    if (!isDay) return SKY.night;
    if (condition === "CLEAR" || condition === "MOSTLY_CLEAR") return SKY.clear;
    if (condition === "PARTLY_CLOUDY" || condition === "CLOUDY") return SKY.cloudy;
    if (condition === "FOG") return SKY.fog;
    if (condition === "SNOW") return SKY.snow;
    return SKY.wet;
}

function Cloud(props: { x: number; y: number; scale: number; dark: boolean }) {
    return (
        <g transform={`translate(${props.x} ${props.y}) scale(${props.scale})`} fill={props.dark ? "#8FA3AE" : "#FFFFFF"}
           opacity={props.dark ? 0.95 : 0.92}>
            <ellipse cx="0" cy="10" rx="30" ry="14"/>
            <circle cx="-12" cy="2" r="13"/>
            <circle cx="10" cy="-2" r="17"/>
            <circle cx="26" cy="8" r="11"/>
        </g>
    );
}

function Moon(props: { x: number; y: number; sky: string }) {
    return (
        <g transform={`translate(${props.x} ${props.y})`}>
            <circle r="16" fill="#FDF4DD"/>
            <circle cx="7" cy="-5" r="14" fill={props.sky}/>
        </g>
    );
}

/** Exterior con el clima del lugar: sol, luna, nubes, lluvia, niebla, nieve o tormenta. */
function Outdoor(props: { id: string; condition: WeatherCondition; isDay: boolean }) {
    const sky = () => skyFor(props.condition, props.isDay);
    const clouds = () => CLOUDS[props.condition] ?? 0;
    const dark = () => props.condition === "RAIN" || props.condition === "STORM" || props.condition === "DRIZZLE";
    const rain = () => (props.condition === "RAIN" || props.condition === "STORM" ? 16 : props.condition === "DRIZZLE" ? 8 : 0);
    const sunny = () => props.isDay && ["CLEAR", "MOSTLY_CLEAR", "PARTLY_CLOUDY"].includes(props.condition);
    return (
        <g data-backdrop="outdoor">
            <defs>
                <linearGradient id={`${props.id}-sky`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color={sky()[0]}/>
                    <stop offset="1" stop-color={sky()[1]}/>
                </linearGradient>
            </defs>
            <rect width={WIDTH} height={HEIGHT} fill={`url(#${props.id}-sky)`}/>
            <Show when={sunny()}>
                <g class="scene-sun" transform="translate(312 36)">
                    <For each={[0, 1, 2, 3, 4, 5, 6, 7]}>
                        {(i) => (
                            <line x1="0" y1="-24" x2="0" y2="-31" stroke="#F2B632" stroke-width="3"
                                  stroke-linecap="round"
                                  transform={`rotate(${i * 45})`}/>
                        )}
                    </For>
                    <circle r="18" fill="#F2B632"/>
                </g>
            </Show>
            <Show when={!props.isDay}>
                <g>
                    <Moon x={312} y={34} sky={sky()[0]}/>
                    <For each={[[40, 30], [110, 18], [230, 26], [270, 60]] as const}>
                        {([x, y]) => <circle cx={x} cy={y} r="1.4" fill="#FDF4DD"/>}
                    </For>
                </g>
            </Show>
            <Show when={clouds() >= 1}><Cloud x={250} y={40} scale={0.9} dark={dark()}/></Show>
            <Show when={clouds() >= 2}><Cloud x={70} y={30} scale={1.1} dark={dark()}/></Show>
            <Show when={clouds() >= 3}><Cloud x={160} y={46} scale={0.8} dark={dark()}/></Show>
            <Show when={rain() > 0}>
                <g class="scene-rain" stroke="#2D9CDB" stroke-width="2" stroke-linecap="round">
                    <For each={Array.from({length: rain()}, (_, i) => i)}>
                        {(i) => (
                            <line x1={20 + i * 21} y1={70 + (i % 3) * 10} x2={16 + i * 21} y2={82 + (i % 3) * 10}/>
                        )}
                    </For>
                </g>
            </Show>
            <Show when={props.condition === "SNOW"}>
                <g class="scene-rain" fill="#FFFFFF">
                    <For each={Array.from({length: 16}, (_, i) => i)}>
                        {(i) => <circle cx={16 + i * 21} cy={74 + (i % 4) * 10} r="2.5"/>}
                    </For>
                </g>
            </Show>
            <Show when={props.condition === "STORM"}>
                <path d="M120 58 L110 84 L122 84 L114 108 L136 76 L124 76 L132 58 Z" fill="#F2B632"/>
            </Show>
            <Show when={props.condition === "FOG"}>
                <g fill="#FFFFFF" opacity="0.55">
                    <rect x="0" y="120" width={WIDTH} height="10" rx="5"/>
                    <rect x="30" y="146" width="300" height="8" rx="4"/>
                </g>
            </Show>
            <rect x="0" y={GROUND} width={WIDTH} height={HEIGHT - GROUND} fill="#DDF5EA"/>
        </g>
    );
}

/**
 * Interior: pared, piso y una ventana con el cielo de afuera. Con ventana soleada entra un haz de sol hasta el
 * cultivo; sin luz natural la cortina queda cerrada.
 */
function Indoor(props: {
    id: string;
    isDay: boolean;
    condition?: WeatherCondition | null;
    exposure?: SunExposure | null;
}) {
    const wall = () => (props.isDay ? ["#EEFAF4", "#DDF5EA"] : ["#0B3D2B", "#06281C"]);
    const sky = () => skyFor(props.condition ?? "MOSTLY_CLEAR", props.isDay)[0];
    const frame = () => (props.isDay ? "#D5E3DC" : "#0A5A3C");
    const sunny = () => props.isDay && (!props.condition || ["CLEAR", "MOSTLY_CLEAR", "PARTLY_CLOUDY"].includes(props.condition));
    const wet = () => props.condition === "RAIN" || props.condition === "STORM" || props.condition === "DRIZZLE";
    const closed = () => props.exposure === "SHADE";
    return (
        <g data-backdrop="indoor">
            <defs>
                <linearGradient id={`${props.id}-wall`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color={wall()[0]}/>
                    <stop offset="1" stop-color={wall()[1]}/>
                </linearGradient>
            </defs>
            <rect width={WIDTH} height={HEIGHT} fill={`url(#${props.id}-wall)`}/>
            <g transform="translate(282 18)" data-window={closed() ? "closed" : "open"}>
                <rect width="62" height="54" rx="4" fill={sky()} stroke={frame()} stroke-width="4"/>
                <Show when={props.isDay && sunny() && !closed()}><circle cx="46" cy="16" r="7" fill="#F2B632"/></Show>
                <Show when={!props.isDay && !closed()}><Moon x={46} y={16} sky={sky()}/></Show>
                <Show when={props.isDay && !sunny() && !closed()}><Cloud x={24} y={16} scale={0.45} dark={wet()}/></Show>
                <Show when={wet() && !closed()}>
                    <g stroke="#2D9CDB" stroke-width="1.5" stroke-linecap="round">
                        <For each={[8, 20, 38, 50]}>
                            {(x) => <line x1={x} y1={30} x2={x - 3} y2={38}/>}
                        </For>
                    </g>
                </Show>
                <line x1="31" y1="0" x2="31" y2="54" stroke={frame()} stroke-width="3"/>
                <Show when={closed()}>
                    <g data-curtain="">
                        <rect x="-2" y="-2" width="66" height="58" rx="3" fill="#D9734E" opacity="0.85"/>
                        <For each={[10, 22, 34, 46, 58]}>
                            {(x) => <line x1={x} y1="-2" x2={x} y2="56" stroke="#B85A38" stroke-width="2"/>}
                        </For>
                    </g>
                </Show>
            </g>
            <Show when={props.exposure === "FULL_SUN" && props.isDay && sunny()}>
                <polygon data-sunbeam="" points="284,70 344,72 250,200 140,200" fill="#F2B632" opacity="0.14"/>
            </Show>
            <rect x="0" y={GROUND} width={WIDTH} height={HEIGHT - GROUND} fill={props.isDay ? "#D5E3DC" : "#0A5A3C"}/>
        </g>
    );
}

interface BackdropProps {
    id: string;
    /** Clima del lugar: afuera pinta el cielo; adentro, lo que se ve por la ventana. */
    condition?: WeatherCondition | null;
    isDay: boolean;
    /** Sin lugar definido, un clima conocido significa aire libre y su ausencia, interior. */
    setting?: PlacementSetting | null;
    exposure?: SunExposure | null;
}

/** El id prefija los degradados: varias escenas en la misma página no deben compartirlos. */
export function Backdrop(props: BackdropProps) {
    const outdoor = () => (props.setting ? props.setting === "OUTDOOR" : Boolean(props.condition));
    return (
        <Show
            when={outdoor()}
            fallback={<Indoor id={props.id} isDay={props.isDay} condition={props.condition} exposure={props.exposure}/>}
        >
            <Outdoor id={props.id} condition={props.condition ?? (props.isDay ? "MOSTLY_CLEAR" : "CLEAR")} isDay={props.isDay}/>
        </Show>
    );
}

/**
 * Lo que da sombra al aire libre, encima del cultivo: una malla sobre una pérgola en media sombra, o la copa de un
 * árbol en sombra. Tiñe la escena para que se note que la planta recibe menos sol.
 */
export function Shelter(props: {
    setting?: PlacementSetting | null;
    exposure?: SunExposure | null;
    isDay: boolean;
}) {
    const tint = () => (props.isDay ? "#06281C" : "#000000");
    return (
        <Show when={props.setting === "OUTDOOR" && props.exposure && props.exposure !== "FULL_SUN"}>
            <Show
                when={props.exposure === "PARTIAL_SUN"}
                fallback={
                    <g data-shade="SHADE">
                        <rect x="0" y="0" width={WIDTH} height={GROUND} fill={tint()} opacity="0.16"/>
                        <rect x="18" y="40" width="14" height={GROUND - 40} rx="3" fill="#B85A38"/>
                        <g fill="#067A52">
                            <circle cx="30" cy="30" r="40"/>
                            <circle cx="95" cy="16" r="34"/>
                            <circle cx="160" cy="6" r="30"/>
                            <circle cx="220" cy="-4" r="28"/>
                        </g>
                        <g fill="#00B074" opacity="0.5">
                            <circle cx="50" cy="20" r="18"/>
                            <circle cx="120" cy="8" r="14"/>
                        </g>
                        <ellipse cx="180" cy={GROUND + 6} rx="170" ry="8" fill="#06281C" opacity="0.18"/>
                    </g>
                }
            >
                <g data-shade="PARTIAL_SUN">
                    <rect x="0" y="0" width={WIDTH} height={GROUND} fill={tint()} opacity="0.07"/>
                    <rect x="10" y="10" width="5" height={GROUND - 10} fill="#B85A38"/>
                    <rect x="345" y="10" width="5" height={GROUND - 10} fill="#B85A38"/>
                    <rect x="6" y="6" width="348" height="8" rx="2" fill="#067A52" opacity="0.75"/>
                    <g stroke="#0B3D2B" stroke-width="1" opacity="0.5">
                        <For each={Array.from({length: 34}, (_, i) => i)}>
                            {(i) => <line x1={10 + i * 10} y1="6" x2={10 + i * 10} y2="14"/>}
                        </For>
                    </g>
                </g>
            </Show>
        </Show>
    );
}
