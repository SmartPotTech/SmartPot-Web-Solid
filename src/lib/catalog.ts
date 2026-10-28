import type {
    ActuatorType,
    CommandAction,
    CommandStatus,
    CropForm,
    CropKind,
    CropType,
    HealthLevel,
    MetricKey,
    Placement,
    PlacementSetting,
    SunExposure,
} from "./api/types";

export const CROP_TYPES: Record<CropType, { label: string; hint: string }> = {
    LETTUCE: {label: "Lechuga", hint: "Hoja de clima fresco, ideal para empezar."},
    TOMATO: {label: "Tomate", hint: "Fruto exigente en luz y nutrientes."},
    STRAWBERRY: {label: "Fresa", hint: "Sensible a las sales y a la humedad alta."},
    BASIL: {label: "Albahaca", hint: "Aromática de clima cálido."},
    SPINACH: {label: "Espinaca", hint: "Hoja de clima fresco con mucho nitrógeno."},
    PEPPER: {label: "Pimentón", hint: "Fruto de clima cálido y luz intensa."},
};

export const CROP_KINDS: Record<CropKind, { label: string; hint: string }> = {
    REAL: {
        label: "Real",
        hint: "Un ESP32 con el firmware de SmartPot, físico o simulado en Wokwi, con sus sensores y actuadores."
    },
    VIRTUAL: {
        label: "Virtual",
        hint: "SmartPot lo simula por ti, siempre encendido: clima real, día y noche o valores a mano."
    },
};

/** phrase completa frases como «Lechuga en tubos NFT». */
export const CROP_FORMS: Record<CropForm, { label: string; phrase: string; hint: string }> = {
    POT: {label: "Maceta", phrase: "en maceta", hint: "Una planta en su maceta con depósito y riego por goteo."},
    NFT: {
        label: "Tubos NFT",
        phrase: "en tubos NFT",
        hint: "Tubos horizontales por los que corre una película de solución nutritiva."
    },
    TOWER: {
        label: "Torre vertical",
        phrase: "en torre vertical",
        hint: "Bolsillos escalonados; la bomba sube la solución y baja por gravedad."
    },
    RAFT: {
        label: "Balsa flotante",
        phrase: "en balsa flotante",
        hint: "Plantas sobre una balsa que flota en un estanque de solución aireada."
    },
};

export const PLACEMENT_SETTINGS: Record<PlacementSetting, { label: string; hint: string }> = {
    INDOOR: {label: "Bajo techo", hint: "Dentro de la casa, un invernadero cerrado o un cuarto de cultivo."},
    OUTDOOR: {label: "Al aire libre", hint: "Balcón, terraza, patio o huerta, con el clima de afuera."},
};

/** La exposición se nombra distinto según el lugar: afuera cuenta el sol directo; adentro, la ventana. */
export const EXPOSURES: Record<SunExposure, Record<PlacementSetting, {
    label: string;
    hint: string;
    phrase: string
}>> = {
    FULL_SUN: {
        OUTDOOR: {label: "Pleno sol", hint: "6 horas o más de sol directo.", phrase: "a pleno sol"},
        INDOOR: {
            label: "Ventana soleada",
            hint: "Le da el sol directo por la ventana.",
            phrase: "junto a una ventana soleada"
        },
    },
    PARTIAL_SUN: {
        OUTDOOR: {
            label: "Media sombra",
            hint: "Sol de la mañana o filtrado, de 3 a 5 horas.",
            phrase: "en media sombra"
        },
        INDOOR: {label: "Luz indirecta", hint: "Cerca de una ventana, sin sol directo.", phrase: "con luz indirecta"},
    },
    SHADE: {
        OUTDOOR: {label: "Sombra", hint: "Bajo un techo o un árbol: menos de 3 horas de sol.", phrase: "en sombra"},
        INDOOR: {
            label: "Sin luz natural",
            hint: "Lejos de las ventanas; depende de la lámpara.",
            phrase: "sin luz natural"
        },
    },
};

/** Luz que pide cada especie, la misma base de conocimiento del asistente. */
export const LIGHT_NEEDS: Record<CropType, { exposure: SunExposure; note: string }> = {
    LETTUCE: {exposure: "PARTIAL_SUN", note: "La lechuga prefiere media sombra: con sol fuerte se espiga."},
    SPINACH: {exposure: "PARTIAL_SUN", note: "La espinaca prefiere media sombra y clima fresco."},
    TOMATO: {exposure: "FULL_SUN", note: "El tomate es de sol: de 6 a 8 horas de sol directo."},
    PEPPER: {exposure: "FULL_SUN", note: "El pimentón es de sol: de 6 a 8 horas de sol directo."},
    STRAWBERRY: {exposure: "FULL_SUN", note: "La fresa necesita al menos 6 horas de sol directo."},
    BASIL: {exposure: "FULL_SUN", note: "La albahaca es de sol: 6 horas de sol directo."},
};

/** «al aire libre a pleno sol en Medellín»; null si no se sabe dónde está. */
export function describePlacement(placement: Placement | null | undefined): string | null {
    if (!placement?.setting) return placement?.location ? `en ${placement.location.name}` : null;
    const parts = [PLACEMENT_SETTINGS[placement.setting].label.toLowerCase()];
    if (placement.exposure) parts.push(EXPOSURES[placement.exposure][placement.setting].phrase);
    if (placement.location) parts.push(`en ${placement.location.name}`);
    return parts.join(" ");
}

/**
 * durations: cuánto tiempo puede quedar encendido al activarlo con el switch; unlimited permite dejarlo encendido
 * hasta apagarlo (nunca la bomba ni los dosificadores).
 */
export const ACTUATORS: Record<ActuatorType, {
    label: string; defaultSeconds: number | null; durations: number[];
    unlimited: boolean
}> = {
    WATER_PUMP: {label: "Bomba de agua", defaultSeconds: 15, durations: [5, 15, 30, 60], unlimited: false},
    UV_LIGHT: {label: "Luz ultravioleta", defaultSeconds: 900, durations: [900, 1800, 3600, 7200], unlimited: true},
    FAN: {label: "Ventilador", defaultSeconds: 600, durations: [300, 600, 1800], unlimited: true},
    HUMIDIFIER: {label: "Humidificador", defaultSeconds: 300, durations: [300, 600, 1800], unlimited: true},
    NUTRIENT_DOSER: {label: "Dosificador de nutrientes", defaultSeconds: 3, durations: [1, 3, 5], unlimited: false},
    PH_DOSER: {label: "Dosificador de pH", defaultSeconds: 3, durations: [1, 3, 5], unlimited: false},
};

export interface MetricInfo {
    label: string;
    unit: string;
    decimals: number;
    color: string;
}

export const METRICS: Record<MetricKey, MetricInfo> = {
    temperature: {label: "Temperatura", unit: "°C", decimals: 1, color: "#D9734E"},
    humidity: {label: "Humedad del aire", unit: "%", decimals: 0, color: "#2D9CDB"},
    soilMoisture: {label: "Humedad del sustrato", unit: "%", decimals: 0, color: "#1F6FA0"},
    brightness: {label: "Luz", unit: "lux", decimals: 0, color: "#F2B632"},
    ph: {label: "pH", unit: "", decimals: 2, color: "#067A52"},
    tds: {label: "Nutrientes (TDS)", unit: "ppm", decimals: 0, color: "#00B074"},
    atmosphere: {label: "Presión", unit: "hPa", decimals: 0, color: "#5B6B63"},
};

export const PRIMARY_METRICS: MetricKey[] = ["temperature", "humidity", "soilMoisture", "brightness", "ph", "tds"];

/**
 * Un color por cultivo en las comparativas, en orden fijo y nunca reciclado. Tonos de la marca más un
 * violeta solo para gráficos; el orden está validado para daltonismo (protan, deutan) y contraste entre vecinos.
 */
export const CROP_COLORS = ["#009A64", "#2D9CDB", "#D9734E", "#1F6FA0", "#C98D12", "#067A52", "#7A5AC8", "#B85A38"];

/** Máximo de cultivos en un mismo gráfico comparativo: uno por color de la paleta. */
export const MAX_COMPARED = CROP_COLORS.length;

/** Órdenes frecuentes para aplicar a varios cultivos a la vez. */
export const QUICK_ACTIONS: {
    label: string; actuatorType: ActuatorType; action: CommandAction;
    durationSeconds: number | null
}[] = [
    {label: "Regar 15 s", actuatorType: "WATER_PUMP", action: "ACTIVATE", durationSeconds: 15},
    {label: "Ventilar 10 min", actuatorType: "FAN", action: "ACTIVATE", durationSeconds: 600},
    {label: "Luz 15 min", actuatorType: "UV_LIGHT", action: "ACTIVATE", durationSeconds: 900},
    {label: "Apagar luces", actuatorType: "UV_LIGHT", action: "DEACTIVATE", durationSeconds: null},
    {label: "Apagar ventiladores", actuatorType: "FAN", action: "DEACTIVATE", durationSeconds: null},
];

export const COMMAND_STATUS: Record<CommandStatus, { label: string; tone: Tone }> = {
    PENDING: {label: "Pendiente", tone: "neutral"},
    SENT: {label: "Enviado", tone: "info"},
    EXECUTED: {label: "Ejecutado", tone: "success"},
    FAILED: {label: "Falló", tone: "danger"},
    EXPIRED: {label: "Sin respuesta", tone: "warning"},
};

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const HEALTH: Record<HealthLevel, { tone: Tone; color: string }> = {
    EXCELLENT: {tone: "success", color: "#00B074"},
    GOOD: {tone: "success", color: "#009A64"},
    FAIR: {tone: "warning", color: "#F2B632"},
    POOR: {tone: "danger", color: "#D9734E"},
    CRITICAL: {tone: "danger", color: "#D64545"},
    UNKNOWN: {tone: "neutral", color: "#5B6B63"},
};
