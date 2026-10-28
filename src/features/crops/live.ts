import type {
    Actuator,
    ActuatorType,
    Command,
    Crop,
    HealthLevel,
    Measures,
    VirtualDevice,
    Weather,
} from "../../lib/api/types";

export type Vigor = "healthy" | "stressed" | "critical";

/** El color de las hojas sigue el índice de salud: verde sano, amarillento en riesgo y ocre si es crítico. */
export function vigorOf(level: HealthLevel | null | undefined): Vigor {
    if (level === "CRITICAL") return "critical";
    if (level === "FAIR" || level === "POOR") return "stressed";
    return "healthy";
}

/**
 * Actuadores encendidos ahora: los que quedaron encendidos sin límite, los que corren por tiempo según su último
 * comando ejecutado y, en un cultivo virtual, los que reporta el simulador.
 */
export function runningActuators(
    actuators: Actuator[],
    commands: Command[],
    simulated: VirtualDevice["activeActuators"] = [],
    now = Date.now(),
): Set<ActuatorType> {
    const latest = new Map<ActuatorType, Command>();
    for (const command of commands) {
        const previous = latest.get(command.actuatorType);
        if (!previous || Date.parse(command.createdAt) > Date.parse(previous.createdAt)) {
            latest.set(command.actuatorType, command);
        }
    }
    const running = new Set<ActuatorType>();
    for (const actuator of actuators) {
        if (actuator.active) running.add(actuator.type);
        if (actuator.runningUntil && Date.parse(actuator.runningUntil) > now) running.add(actuator.type);
        const last = latest.get(actuator.type);
        if (last?.action === "ACTIVATE" && last.status === "EXECUTED" && last.durationSeconds) {
            const started = Date.parse(last.completedAt ?? last.sentAt ?? last.createdAt);
            if (started + last.durationSeconds * 1000 > now) running.add(actuator.type);
        }
    }
    for (const item of simulated) {
        if (!item.until || Date.parse(item.until) > now) running.add(item.actuator);
    }
    return running;
}

/** De día según el clima del lugar, la luz medida o, sin ninguno de los dos, la hora local. */
export function isDaylight(weather: Weather | null | undefined, measures: Measures | undefined, now = new Date()): boolean {
    if (weather) return weather.isDay;
    if (measures?.brightness != null) return measures.brightness >= 150;
    const hour = now.getHours();
    return hour >= 6 && hour < 18;
}

/** La orden que espera la confirmación del dispositivo para cada actuador. */
export function pendingCommands(commands: Command[]): Map<ActuatorType, Command> {
    const pending = new Map<ActuatorType, Command>();
    for (const command of commands) {
        if ((command.status === "PENDING" || command.status === "SENT") && !pending.has(command.actuatorType)) {
            pending.set(command.actuatorType, command);
        }
    }
    return pending;
}

export type LiveStatus = "live" | "waiting" | "offline" | "paused" | "unavailable";

/**
 * Se ilustra solo lo que está conectado: un cultivo real necesita su dispositivo en línea; uno virtual, su
 * simulación encendida. Sin lecturas todavía, la escena espera la primera.
 */
export function liveStatus(crop: Crop, simulation?: VirtualDevice | null): LiveStatus {
    if (crop.kind === "VIRTUAL") {
        if (simulation && !simulation.available) return "unavailable";
        if (simulation && !simulation.active) return "paused";
        if (!crop.device.online && !simulation?.connected) return "offline";
    } else if (!crop.device.online) {
        return "offline";
    }
    return crop.latestReading || simulation?.lastReading ? "live" : "waiting";
}
