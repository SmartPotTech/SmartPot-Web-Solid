import {render, screen} from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import {describe, expect, it, vi} from "vitest";
import type {Insight} from "../../lib/api/types";
import {HealthGauge} from "./components/HealthGauge";
import {InsightPanel} from "./components/InsightPanel";
import {MetricTile} from "./components/MetricTile";
import {firmwareConfig} from "./firmware";

const INSIGHT: Insight = {
    cropType: "LETTUCE",
    health: {index: 41.5, level: "POOR", label: "En riesgo"},
    diagnosis: [
        {
            parameter: "soilMoisture", value: 35, status: "LOW", severity: "CRITICAL",
            message: "La humedad del sustrato (35 %) está por debajo del rango ideal (60–80 %).",
            recommendation: "Riega hasta humedecer el sustrato sin encharcarlo.",
        },
        {
            parameter: "ph",
            value: 6.1,
            status: "OPTIMAL",
            severity: "OK",
            message: "El pH está en el rango ideal.",
            recommendation: null,
        },
    ],
    conclusions: [{rule: "drought", title: "Sequía", message: "El sustrato está muy seco.", certainty: 0.9}],
    predictions: [{
        name: "ventilation",
        label: "Necesidad de ventilación",
        probability: 0.12,
        model: "Regresión logística",
    }],
    actions: [{
        actuator: "WATER_PUMP",
        action: "ACTIVATE",
        durationSeconds: 30,
        reason: "El sustrato está seco: riego automático.",
    }],
    summary: "Tu lechuga está en estado «En riesgo» (42/100). Revisa la humedad del sustrato.",
    evaluatedAt: new Date().toISOString(),
};

describe("componentes del cultivo", () => {
    it("MetricTile marca el valor frente al rango ideal", () => {
        render(() => <MetricTile metric="ph" value={7.2} range={{min: 5.5, max: 6.5, unit: "pH", label: "el pH"}}/>);
        expect(screen.getByText("7,2")).toBeInTheDocument();
        expect(screen.getByText("Alto")).toBeInTheDocument();
        expect(screen.getByText("Ideal: 5.5–6.5 pH")).toBeInTheDocument();
    });

    it("HealthGauge anuncia el índice de salud", () => {
        render(() => <HealthGauge index={82.4} level="GOOD" label="Saludable"/>);
        expect(screen.getByLabelText("Salud 82 de 100, Saludable")).toBeInTheDocument();
    });

    it("InsightPanel muestra diagnóstico, conclusiones y ejecuta acciones", async () => {
        const onRunAction = vi.fn().mockResolvedValue(undefined);
        const pump = {id: "a1", cropId: "c1", type: "WATER_PUMP" as const, active: false, lastChangedAt: null};
        render(() => <InsightPanel insight={INSIGHT} error={null} loading={false} actuators={[pump]}
                                   onRefresh={() => undefined} onRunAction={onRunAction}/>);

        expect(screen.getByText(INSIGHT.summary)).toBeInTheDocument();
        expect(screen.getByText("Sequía")).toBeInTheDocument();
        expect(screen.getByText("Riega hasta humedecer el sustrato sin encharcarlo.")).toBeInTheDocument();
        expect(screen.getByText("12 %")).toBeInTheDocument();

        await userEvent.click(screen.getByRole("button", {name: "Ejecutar"}));
        expect(onRunAction).toHaveBeenCalledWith(INSIGHT.actions[0], pump);
    });

    it("InsightPanel presenta la luz baja nocturna como descanso", () => {
        const night: Insight = {
            ...INSIGHT, actions: [], diagnosis: [
                {
                    parameter: "brightness", value: 20, status: "REST", severity: "OK",
                    message: "Es de noche: la planta descansa y la luz baja (20 lux) es normal entre las 22:00 y las 6:00.",
                    recommendation: null,
                },
            ],
        };
        render(() => <InsightPanel insight={night} error={null} loading={false} actuators={[]}
                                   onRefresh={() => undefined} onRunAction={vi.fn()}/>);

        expect(screen.getByText(/^Descanso/)).toBeInTheDocument();
        expect(screen.getByText(/Es de noche: la planta descansa/)).toBeInTheDocument();
        expect(screen.getByText("Todas las variables están en su rango ideal.")).toBeInTheDocument();
    });

    it("InsightPanel muestra el pronóstico y de qué depende el índice", () => {
        const withForecast: Insight = {
            ...INSIGHT, actions: [],
            health: {...INSIGHT.health, byParameter: {soilMoisture: 20, ph: 100}},
            forecasts: [{
                parameter: "soilMoisture", current: 64, slopePerHour: -6, expectedIn3h: 46, trend: "FALLING",
                hoursToLimit: 0.66, limit: "MIN", confidence: 1,
                message: "La humedad del sustrato baja 6 % por hora: llegará al mínimo (60 %) en unos 40 minutos.",
            },
            {
                parameter: "ph", current: 6.1, slopePerHour: 0, expectedIn3h: 6.1, trend: "STABLE", confidence: 1,
                message: "El pH se mantiene estable.",
            }],
        };
        render(() => <InsightPanel insight={withForecast} error={null} loading={false} actuators={[]}
                                   onRefresh={() => undefined} onRunAction={vi.fn()}/>);

        expect(screen.getByText("Pronóstico de las próximas horas")).toBeInTheDocument();
        expect(screen.getByText("Saldrá del rango ideal en unos 40 min")).toBeInTheDocument();
        expect(screen.getAllByText(/Saldrá del rango ideal/)).toHaveLength(1);
        expect(screen.getByText("De qué depende el índice")).toBeInTheDocument();
    });

    it("genera la configuración del firmware sin exponer claves ausentes", () => {
        const config = firmwareConfig({
            host: "mqtt.smartpot.app", port: 8883, tls: true, username: "c1",
            topics: {telemetry: "t", commands: "c", commandAck: "a", status: "s"},
        });
        expect(config).toContain('"crop_id": "c1"');
        expect(config).toContain('"tls": True');
        expect(config).toContain("<CLAVE_DEL_DISPOSITIVO>");
        expect(config).toContain("<NOMBRE_DE_TU_RED>");
        expect(config).toContain('"CA_CRT": """<CA_DE_SMARTPOT>"""');
        expect(config).not.toContain("ca_file");
        expect(firmwareConfig({
            host: "h", port: 8883, tls: true, username: "c1", key: "k",
            topics: {telemetry: "t", commands: "c", commandAck: "a", status: "s"},
        }, "wokwi")).toContain('"ssid": "Wokwi-GUEST"');
    });

    it("lleva la CA del broker en BROKER, también sin TLS", () => {
        const credentials = {
            host: "h", port: 8883, tls: true, username: "c1",
            topics: {telemetry: "t", commands: "c", commandAck: "a", status: "s"},
        };
        const ca = "-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----";
        expect(firmwareConfig(credentials, "esp32", `${ca}\n`))
            .toContain(`BROKER = {\n    "CA_CRT": """${ca}"""\n}`);
        expect(firmwareConfig({...credentials, port: 1883, tls: false}, "esp32", ca))
            .toContain('"CA_CRT": """"""');
    });
});
