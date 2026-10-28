import {For} from "solid-js";
import {Dynamic} from "solid-js/web";
import type {CropType} from "../../../../lib/api/types";
import type {Vigor} from "../../live";

interface Leaves {
    light: string;
    mid: string;
    dark: string;
}

const LEAVES: Record<Vigor, Leaves> = {
    healthy: {light: "#00B074", mid: "#009A64", dark: "#067A52"},
    stressed: {light: "#7FDBB0", mid: "#C98D12", dark: "#009A64"},
    critical: {light: "#C98D12", mid: "#B85A38", dark: "#D9734E"},
};

/** Alterna el tono claro y el medio entre hojas vecinas. */
const alternate = (colors: Leaves, i: number) => (i % 2 === 0 ? colors.light : colors.mid);

type SpeciesProps = { colors: Leaves; droop: number };

interface PlantProps {
    type: CropType;
    x: number;
    y: number;
    scale?: number;
    vigor?: Vigor;
}

const LEAF = "M0 0 C-12 -10 -14 -30 0 -38 C14 -30 12 -10 0 0 Z";

function Lettuce(props: SpeciesProps) {
    return (
        <g>
            <For each={[-72, -44, -16, 16, 44, 72]}>
                {(angle, i) => (
                    <path d={LEAF} fill={alternate(props.colors, i())}
                          transform={`rotate(${angle + Math.sign(angle) * props.droop})`}/>
                )}
            </For>
            <path d="M0 0 C-8 -8 -8 -22 0 -28 C8 -22 8 -8 0 0 Z" fill={props.colors.light}/>
            <path d="M-4 -6 Q0 -16 4 -6" fill="none" stroke="#FFFFFF" stroke-opacity="0.5" stroke-width="1.2"/>
        </g>
    );
}

function Spinach(props: SpeciesProps) {
    return (
        <g>
            <For each={[-54, -27, 0, 27, 54]}>
                {(angle, i) => (
                    <g transform={`rotate(${angle + Math.sign(angle) * props.droop})`}>
                        <line x1="0" y1="0" x2="0" y2="-14" stroke={props.colors.dark} stroke-width="2"/>
                        <path d="M0 -12 C-10 -18 -11 -34 0 -44 C11 -34 10 -18 0 -12 Z"
                              fill={i() % 2 === 0 ? props.colors.dark : props.colors.mid}/>
                        <line x1="0" y1="-14" x2="0" y2="-38" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="1"/>
                    </g>
                )}
            </For>
        </g>
    );
}

function Basil(props: SpeciesProps) {
    const pairs = [-14, -26, -38];
    return (
        <g>
            <path d="M0 0 C-1 -18 1 -34 0 -50" fill="none" stroke={props.colors.dark} stroke-width="2.5"/>
            <For each={pairs}>
                {(y, i) => (
                    <g>
                        <ellipse cx="-8" cy={y} rx="5" ry="9" fill={alternate(props.colors, i())}
                                 transform={`rotate(${-58 - props.droop} -8 ${y})`}/>
                        <ellipse cx="8" cy={y} rx="5" ry="9" fill={alternate(props.colors, i() + 1)}
                                 transform={`rotate(${58 + props.droop} 8 ${y})`}/>
                    </g>
                )}
            </For>
            <ellipse cx="-3" cy="-52" rx="4" ry="7" fill={props.colors.light} transform="rotate(-20 -3 -52)"/>
            <ellipse cx="3" cy="-52" rx="4" ry="7" fill={props.colors.mid} transform="rotate(20 3 -52)"/>
        </g>
    );
}

function Leaflets(props: { x: number; y: number; angle: number; color: string }) {
    return (
        <g transform={`translate(${props.x} ${props.y}) rotate(${props.angle})`} fill={props.color}>
            <ellipse cx="0" cy="-8" rx="3.5" ry="7"/>
            <ellipse cx="-6" cy="-3" rx="3" ry="6" transform="rotate(-50 -6 -3)"/>
            <ellipse cx="6" cy="-3" rx="3" ry="6" transform="rotate(50 6 -3)"/>
        </g>
    );
}

/** Flor de cinco pétalos: amarilla en el tomate, blanca en la fresa. */
function Flower(props: { x: number; y: number; petals: string }) {
    return (
        <g transform={`translate(${props.x} ${props.y})`}>
            <For each={[0, 72, 144, 216, 288]}>
                {(angle) => (
                    <ellipse cx="0" cy="-2.6" rx="1.6" ry="2.6" fill={props.petals} stroke="#D5E3DC" stroke-width="0.4"
                             transform={`rotate(${angle})`}/>
                )}
            </For>
            <circle r="1.3" fill="#C98D12"/>
        </g>
    );
}

function Tomato(props: SpeciesProps) {
    return (
        <g>
            <line x1="9" y1="4" x2="9" y2="-70" stroke="#B85A38" stroke-width="2" stroke-linecap="round"/>
            <path d="M0 0 C-4 -20 4 -42 0 -66" fill="none" stroke={props.colors.dark} stroke-width="3" stroke-linecap="round"/>
            <Leaflets x={-2} y={-18} angle={-60 - props.droop} color={props.colors.light}/>
            <Leaflets x={2} y={-32} angle={60 + props.droop} color={props.colors.mid}/>
            <Leaflets x={-1} y={-48} angle={-55 - props.droop} color={props.colors.light}/>
            <Leaflets x={1} y={-62} angle={30} color={props.colors.mid}/>
            <For each={[[-8, -26], [-1, -22], [12, -42], [-6, -52]] as const}>
                {([x, y]) => (
                    <g data-fruit="tomato">
                        <circle cx={x} cy={y} r="5.5" fill="#D64545"/>
                        <circle cx={x - 1.8} cy={y - 1.8} r="1.4" fill="#FBE4E4" opacity="0.8"/>
                        <path d={`M${x - 3} ${y - 5} L${x} ${y - 3} L${x + 3} ${y - 5}`} fill="none" stroke={props.colors.dark}
                              stroke-width="1.5"/>
                    </g>
                )}
            </For>
            <Flower x={6} y={-60} petals="#F2B632"/>
        </g>
    );
}

function Strawberry(props: SpeciesProps) {
    return (
        <g>
            <For each={[-38, 0, 38]}>
                {(angle, i) => (
                    <g transform={`rotate(${angle + Math.sign(angle) * props.droop})`}>
                        <line x1="0" y1="0" x2="0" y2="-20" stroke={props.colors.dark} stroke-width="1.6"/>
                        <Leaflets x={0} y={-20} angle={0} color={alternate(props.colors, i())}/>
                    </g>
                )}
            </For>
            <Flower x={0} y={-30} petals="#FFFFFF"/>
            <For each={[[-20, -9], [19, -6]] as const}>
                {([x, y]) => (
                    <g data-fruit="strawberry">
                        <path d={`M${x - 5} ${y - 4} Q${x} ${y + 12} ${x + 5} ${y - 4} Q${x} ${y - 8} ${x - 5} ${y - 4} Z`}
                              fill="#D64545"/>
                        <path d={`M${x - 4} ${y - 6} L${x} ${y - 3} L${x + 4} ${y - 6}`} fill="none" stroke={props.colors.dark}
                              stroke-width="1.5"/>
                        <circle cx={x - 1.5} cy={y} r="0.7" fill="#FDF4DD"/>
                        <circle cx={x + 1.5} cy={y + 3} r="0.7" fill="#FDF4DD"/>
                    </g>
                )}
            </For>
        </g>
    );
}

function Pepper(props: SpeciesProps) {
    return (
        <g>
            <path d="M0 0 C-2 -18 2 -36 0 -54" fill="none" stroke={props.colors.dark} stroke-width="3" stroke-linecap="round"/>
            <For each={[[-9, -16, -60], [9, -26, 60], [-9, -38, -55], [8, -48, 50]] as const}>
                {([x, y, angle], i) => (
                    <ellipse cx={x} cy={y} rx="5" ry="10" fill={alternate(props.colors, i())}
                             transform={`rotate(${angle + Math.sign(angle) * props.droop} ${x} ${y})`}/>
                )}
            </For>
            <g data-fruit="pepper">
                <path d="M-6 -30 C-13 -26 -11 -12 -6 -7 C-1 -12 1 -26 -6 -30 Z" fill="#F2B632"/>
                <path d="M-6 -30 L-6 -34" stroke={props.colors.dark} stroke-width="1.6" stroke-linecap="round"/>
            </g>
            <g data-fruit="pepper">
                <path d="M7 -40 C0 -36 2 -22 7 -17 C12 -22 14 -36 7 -40 Z" fill="#D64545"/>
                <path d="M7 -40 L7 -44" stroke={props.colors.dark} stroke-width="1.6" stroke-linecap="round"/>
            </g>
        </g>
    );
}

const SPECIES: Record<CropType, typeof Lettuce> = {
    LETTUCE: Lettuce,
    SPINACH: Spinach,
    BASIL: Basil,
    TOMATO: Tomato,
    STRAWBERRY: Strawberry,
    PEPPER: Pepper,
};

/** Planta de la especie con la base en (x, y), dibujada hacia arriba. */
export function Plant(props: PlantProps) {
    const vigor = () => props.vigor ?? "healthy";
    const scale = () => props.scale ?? 1;
    const species = () => SPECIES[props.type] ?? Lettuce;
    return (
        <g transform={`translate(${props.x} ${props.y}) scale(${scale()})`} data-plant={props.type} data-vigor={vigor()}>
            <Dynamic
                component={species()}
                colors={LEAVES[vigor()]}
                droop={vigor() === "critical" ? 14 : vigor() === "stressed" ? 6 : 0}
            />
        </g>
    );
}
