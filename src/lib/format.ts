import {ACTUATORS, METRICS} from "./catalog";
import type {ActuatorType, CommandAction, MetricKey, ProfileRange} from "./api/types";

const dateTime = new Intl.DateTimeFormat("es-CO", {dateStyle: "medium", timeStyle: "short"});
const time = new Intl.DateTimeFormat("es-CO", {hour: "2-digit", minute: "2-digit"});
const relative = new Intl.RelativeTimeFormat("es", {numeric: "auto"});

export function formatMetric(key: MetricKey, value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    const info = METRICS[key];
    const number = value.toLocaleString("es-CO", {
        minimumFractionDigits: 0,
        maximumFractionDigits: info.decimals,
    });
    return info.unit ? `${number} ${info.unit}` : number;
}

export function formatDateTime(value: string | null | undefined): string {
    return value ? dateTime.format(new Date(value)) : "—";
}

export function formatTime(value: string | number): string {
    return time.format(new Date(value));
}

export function timeAgo(value: string | null | undefined, now: number = Date.now()): string {
    if (!value) return "nunca";
    const seconds = Math.round((new Date(value).getTime() - now) / 1000);
    const abs = Math.abs(seconds);
    if (abs < 60) return relative.format(seconds, "second");
    if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
    if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
    return relative.format(Math.round(seconds / 86_400), "day");
}

export type RangeStatus = "low" | "ok" | "high" | "unknown";

export function rangeStatus(value: number | null | undefined, range: ProfileRange | undefined): RangeStatus {
    if (value === null || value === undefined || !range) return "unknown";
    if (value < range.min) return "low";
    if (value > range.max) return "high";
    return "ok";
}

export function formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return "";
    if (seconds < 60) return `${seconds} s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    return `${(seconds / 3600).toLocaleString("es-CO", {maximumFractionDigits: 1})} h`;
}

/** «Encender bomba de agua por 15 s», «Apagar luz ultravioleta». */
export function describeAction(actuator: ActuatorType, action: CommandAction, durationSeconds?: number | null): string {
    const verb = action === "ACTIVATE" ? "Encender" : "Apagar";
    const duration = action === "ACTIVATE" && durationSeconds ? ` por ${formatDuration(durationSeconds)}` : "";
    return `${verb} ${ACTUATORS[actuator].label.toLowerCase()}${duration}`;
}

/** Horas hasta un límite en lenguaje natural: «unos 40 min», «unas 3 h». */
export function formatHoursAhead(hours: number): string {
    if (hours < 1) return `unos ${Math.max(5, Math.round((hours * 60) / 5) * 5)} min`;
    return hours < 1.5 ? "alrededor de 1 h" : `unas ${Math.round(hours)} h`;
}

export function greeting(date: Date = new Date()): string {
    const hour = date.getHours();
    // De madrugada todavía se saluda con «buenas noches».
    if (hour < 5) return "Buenas noches";
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
}
