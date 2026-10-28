import {For, type JSX, Show} from "solid-js";
import type {ActuatorType} from "../../../../lib/api/types";
import {ACTUATORS} from "../../../../lib/catalog";
import {GROUND} from "./Backdrop";

const METAL = "#5B6B63";
const IDLE = "#8FA3AE";
const WATER = "#2D9CDB";

/** Grupo de un actuador: lo anuncia con su estado y deja marcado si está encendido. */
function Actuator(props: { type: ActuatorType; on: boolean; children: JSX.Element }) {
    const label = () => ACTUATORS[props.type].label;
    return (
        <g data-actuator={props.type} data-on={String(props.on)}>
            <title>{`${label()}: ${props.on ? "encendido" : "apagado"}`}</title>
            {props.children}
        </g>
    );
}

function Led(props: { x: number; y: number; on: boolean }) {
    return <circle cx={props.x} cy={props.y} r="2" fill={props.on ? "#00B074" : IDLE} class={props.on ? "scene-glow" : undefined}/>;
}

/** Tubo de agua: con la bomba encendida la solución corre por dentro. */
export function Pipe(props: { d: string; flowing: boolean; width?: number }) {
    const width = () => props.width ?? 5;
    return (
        <g>
            <path d={props.d} fill="none" stroke="#B9C7CE" stroke-width={width()} stroke-linecap="round" stroke-linejoin="round"/>
            <path d={props.d} fill="none" stroke={props.flowing ? "#E3F2FB" : "#F2F7F4"} stroke-width={width() - 2}
                  stroke-linecap="round"
                  stroke-linejoin="round"/>
            <Show when={props.flowing}>
                <path d={props.d} class="scene-flow" fill="none" stroke={WATER} stroke-width={width() - 2.5}
                      stroke-dasharray="5 6"
                      stroke-linecap="round" stroke-linejoin="round"/>
            </Show>
        </g>
    );
}

/** Bomba sumergida en el depósito con sus tubos. */
export function WaterPump(props: {
    x: number;
    y: number;
    on: boolean;
    pipes: string[];
    drips?: [number, number][];
    bubbles?: [number, number][];
}) {
    return (
        <Actuator type="WATER_PUMP" on={props.on}>
            <For each={props.pipes}>{(d) => <Pipe d={d} flowing={props.on}/>}</For>
            <rect x={props.x - 10} y={props.y - 7} width="20" height="14" rx="3" fill={props.on ? "#1F6FA0" : METAL}/>
            <circle cx={props.x} cy={props.y} r="3.5" fill="none" stroke="#FFFFFF" stroke-width="1.2"
                    class={props.on ? "scene-spin" : undefined}/>
            <Led x={props.x + 6} y={props.y - 4} on={props.on}/>
            <Show when={props.on}>
                <For each={props.drips ?? []}>
                    {([dx, dy], i) => (
                        <path class="scene-drop" style={{"animation-delay": `${i() * 0.25}s`}}
                              d={`M${dx} ${dy} q3 5 0 8 q-3 -3 0 -8 Z`} fill={WATER}/>
                    )}
                </For>
                <For each={props.bubbles ?? []}>
                    {([bx, by], i) => (
                        <circle class="scene-bubble" style={{"animation-delay": `${i() * 0.35}s`}} cx={bx}
                                cy={by}
                                r="2.5" fill="#FFFFFF" stroke={WATER} stroke-width="0.8"/>
                    )}
                </For>
            </Show>
        </Actuator>
    );
}

/** Barra de luz ultravioleta colgada sobre las plantas; encendida ilumina hasta la altura indicada. */
export function GrowLight(props: {
    x: number;
    y: number;
    width: number;
    reach: number;
    on: boolean;
    glow: string;
}) {
    const left = () => props.x - props.width / 2;
    const right = () => props.x + props.width / 2;
    return (
        <Actuator type="UV_LIGHT" on={props.on}>
            <line x1={left() + 10} y1="0" x2={left() + 10} y2={props.y} stroke={METAL} stroke-width="1.2"/>
            <line x1={right() - 10} y1="0" x2={right() - 10} y2={props.y} stroke={METAL} stroke-width="1.2"/>
            <Show when={props.on}>
                <path class="scene-glow"
                      d={`M${left() + 4} ${props.y + 7} L${right() - 4} ${props.y + 7} L${right() + 22} ${props.reach} L${left() - 22} ${props.reach} Z`}
                      fill={`url(#${props.glow})`}/>
            </Show>
            <rect x={left()} y={props.y} width={props.width} height="8" rx="3" fill="#17261F"/>
            <For each={Array.from({length: Math.floor((props.width - 8) / 12)}, (_, i) => i)}>
                {(i) => (
                    <circle cx={left() + 10 + i * 12} cy={props.y + 5} r="2" fill={props.on ? "#FDF4DD" : IDLE}/>
                )}
            </For>
        </Actuator>
    );
}

/** Ventilador de pie; encendido gira y empuja aire hacia las plantas. */
export function Fan(props: { x: number; y: number; on: boolean }) {
    return (
        <Actuator type="FAN" on={props.on}>
            <line x1={props.x} y1={props.y + 16} x2={props.x} y2={GROUND} stroke={METAL} stroke-width="3"/>
            <rect x={props.x - 12} y={GROUND - 4} width="24" height="4" rx="2" fill={METAL}/>
            <Show when={props.on}>
                <g class="scene-flow" fill="none" stroke={WATER} stroke-width="1.6" stroke-linecap="round"
                   stroke-dasharray="8 7">
                    <path d={`M${props.x + 22} ${props.y - 8} q18 -6 36 0`}/>
                    <path d={`M${props.x + 24} ${props.y} q20 6 42 0`}/>
                    <path d={`M${props.x + 22} ${props.y + 8} q18 6 36 0`}/>
                </g>
            </Show>
            <circle cx={props.x} cy={props.y} r="17" fill="#FFFFFF" stroke="#B9C7CE" stroke-width="2"/>
            <g class={props.on ? "scene-spin" : undefined}>
                <For each={[0, 120, 240]}>
                    {(angle) => (
                        <ellipse cx={props.x} cy={props.y - 7} rx="4" ry="8" fill={props.on ? "#1F6FA0" : IDLE}
                                 transform={`rotate(${angle} ${props.x} ${props.y})`}/>
                    )}
                </For>
            </g>
            <circle cx={props.x} cy={props.y} r="2.5" fill={METAL}/>
        </Actuator>
    );
}

/** Humidificador en el piso; encendido suelta bruma. */
export function Humidifier(props: { x: number; on: boolean }) {
    const top = GROUND - 34;
    return (
        <Actuator type="HUMIDIFIER" on={props.on}>
            <Show when={props.on}>
                <For each={[0, 1, 2]}>
                    {(i) => (
                        <circle class="scene-mist" style={{"animation-delay": `${i * 0.6}s`}} cx={props.x + (i - 1) * 4}
                                cy={top - 6}
                                r={6 + i} fill="#FFFFFF" stroke="#E3F2FB"/>
                    )}
                </For>
            </Show>
            <rect x={props.x - 13} y={top} width="26" height="34" rx="8" fill="#FFFFFF" stroke="#B9C7CE" stroke-width="2"/>
            <rect x={props.x - 7} y={top + 12} width="14" height="14" rx="3" fill={props.on ? "#E3F2FB" : "#F2F7F4"}/>
            <rect x={props.x - 7} y={top + 19} width="14" height="7" rx="2" fill={WATER} opacity="0.6"/>
            <rect x={props.x - 4} y={top - 4} width="8" height="5" rx="2" fill={METAL}/>
            <Led x={props.x + 7} y={top + 6} on={props.on}/>
        </Actuator>
    );
}

/** Frasco dosificador: encendido deja caer gotas en la solución. */
export function Doser(props: {
    type: "NUTRIENT_DOSER" | "PH_DOSER";
    x: number;
    y: number;
    on: boolean;
    dropY: number;
}) {
    const liquid = () => (props.type === "PH_DOSER" ? "#1F6FA0" : "#00B074");
    return (
        <Actuator type={props.type} on={props.on}>
            <rect x={props.x - 3} y={props.y - 30} width="6" height="5" rx="1" fill={METAL}/>
            <rect x={props.x - 8} y={props.y - 26} width="16" height="26" rx="4" fill="#FFFFFF" stroke="#B9C7CE" stroke-width="1.5"/>
            <rect x={props.x - 6} y={props.y - 16} width="12" height="14" rx="3" fill={liquid()} opacity={props.on ? 1 : 0.7}/>
            <text x={props.x} y={props.y - 6} text-anchor="middle" font-size="7" font-weight="700" fill="#FFFFFF">
                {props.type === "PH_DOSER" ? "pH" : "N"}
            </text>
            <Led x={props.x} y={props.y - 21} on={props.on}/>
            <Show when={props.on}>
                <For each={[0, 1]}>
                    {(i) => (
                        <path class="scene-drop" style={{"animation-delay": `${i * 0.4}s`}}
                              d={`M${props.x} ${props.dropY} q2.5 4 0 6.5 q-2.5 -2.5 0 -6.5 Z`} fill={liquid()}/>
                    )}
                </For>
            </Show>
        </Actuator>
    );
}
