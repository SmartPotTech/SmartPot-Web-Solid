import {HEALTH} from "../../../lib/catalog";
import type {HealthLevel} from "../../../lib/api/types";

interface HealthGaugeProps {
    index: number | null;
    level: HealthLevel;
    label: string;
    size?: number;
}

/** Medidor semicircular del índice difuso de salud (0 a 100). */
export function HealthGauge(props: HealthGaugeProps) {
    const size = () => props.size ?? 160;
    const value = () => props.index === null ? 0 : Math.max(0, Math.min(100, props.index));
    const radius = 70;
    const circumference = Math.PI * radius;
    const color = () => HEALTH[props.level]?.color ?? HEALTH.UNKNOWN.color;
    return (
        <figure class="flex flex-col items-center"
                aria-label={`Salud ${props.index === null ? "sin datos" : `${Math.round(value())} de 100`}, ${props.label}`}>
            <svg width={size()} height={size() * 0.62} viewBox="0 0 180 112" aria-hidden="true">
                <path d="M20 100a70 70 0 0 1 140 0" fill="none" stroke="#E4EEE9" stroke-width="16"
                      stroke-linecap="round"/>
                <path d="M20 100a70 70 0 0 1 140 0" fill="none" stroke={color()} stroke-width="16"
                      stroke-linecap="round"
                      stroke-dasharray={`${(value() / 100) * circumference} ${circumference}`}/>
                <text x="90" y="92" text-anchor="middle" class="font-display" font-size="34" font-weight="700"
                      fill="#17261F">
                    {props.index === null ? "—" : Math.round(value())}
                </text>
            </svg>
            <figcaption class="-mt-1 text-sm font-semibold" style={{"color": color()}}>{props.label}</figcaption>
        </figure>
    );
}
