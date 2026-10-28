import {describe, expect, it} from "vitest";
import {describeAction, formatDuration, formatHoursAhead, formatMetric, greeting, rangeStatus, timeAgo} from "./format";

describe("formatMetric", () => {
    it("usa la unidad y los decimales de cada variable", () => {
        expect(formatMetric("temperature", 23.456)).toBe("23,5 °C");
        expect(formatMetric("ph", 6.1234)).toBe("6,12");
        expect(formatMetric("tds", 812.7)).toBe("813 ppm");
    });

    it("muestra una raya cuando no hay dato", () => {
        expect(formatMetric("humidity", undefined)).toBe("—");
        expect(formatMetric("humidity", Number.NaN)).toBe("—");
    });
});

describe("rangeStatus", () => {
    const range = {min: 5.5, max: 6.5, unit: "pH", label: "el pH"};

    it("clasifica respecto al rango ideal", () => {
        expect(rangeStatus(5, range)).toBe("low");
        expect(rangeStatus(6, range)).toBe("ok");
        expect(rangeStatus(7, range)).toBe("high");
        expect(rangeStatus(undefined, range)).toBe("unknown");
        expect(rangeStatus(6, undefined)).toBe("unknown");
    });
});

describe("timeAgo y greeting", () => {
    it("expresa tiempos relativos en español", () => {
        const now = Date.parse("2026-09-26T12:00:00Z");
        expect(timeAgo("2026-09-26T11:58:00Z", now)).toBe("hace 2 minutos");
        expect(timeAgo(null, now)).toBe("nunca");
    });

    it("saluda según la hora", () => {
        expect(greeting(new Date(2026, 0, 1, 8))).toBe("Buenos días");
        expect(greeting(new Date(2026, 0, 1, 15))).toBe("Buenas tardes");
        expect(greeting(new Date(2026, 0, 1, 21))).toBe("Buenas noches");
        expect(greeting(new Date(2026, 0, 1, 1))).toBe("Buenas noches");
    });
});

describe("acciones y duraciones", () => {
    it("describe las órdenes en lenguaje natural", () => {
        expect(describeAction("WATER_PUMP", "ACTIVATE", 15)).toBe("Encender bomba de agua por 15 s");
        expect(describeAction("UV_LIGHT", "ACTIVATE", 900)).toBe("Encender luz ultravioleta por 15 min");
        expect(describeAction("FAN", "DEACTIVATE", 600)).toBe("Apagar ventilador");
    });

    it("redondea las horas que faltan para salir del rango", () => {
        expect(formatDuration(5400)).toBe("1,5 h");
        expect(formatHoursAhead(0.66)).toBe("unos 40 min");
        expect(formatHoursAhead(1.2)).toBe("alrededor de 1 h");
        expect(formatHoursAhead(3.4)).toBe("unas 3 h");
    });
});
