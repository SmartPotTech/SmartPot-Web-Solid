import {MemoryRouter, Route} from "@solidjs/router";
import {render, renderHook, screen} from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import {beforeEach, describe, expect, it, vi} from "vitest";
import {commandApi} from "../../lib/api/services";
import {CROP_COLORS} from "../../lib/catalog";
import type {BulkCommandResult, Crop} from "../../lib/api/types";
import {FleetActionsList} from "./components/FleetActionsList";
import {HealthRanking} from "./components/HealthRanking";
import {useComparedCrops} from "./useComparedCrops";

function crop(id: string, name: string, index: number | null): Crop {
    return {
        id,
        name,
        type: "LETTUCE",
        kind: "REAL",
        form: "POT",
        automationEnabled: false,
        createdAt: "2026-09-26T00:00:00Z",
        latestReading: null,
        device: {online: true, lastSeenAt: null, keyRotatedAt: null},
        health: index === null ? null : {
            index, level: index >= 85 ? "EXCELLENT" : "POOR", label: index >= 85 ? "Excelente" : "En riesgo",
            evaluatedAt: "2026-09-26T00:00:00Z",
        },
    };
}

const CROPS = [crop("a", "Lechugas", 95), crop("b", "Tomates", 38), crop("c", "Fresas", null)];

describe("panel general", () => {
    beforeEach(() => vi.restoreAllMocks());

    it("ordena la salud del cultivo que más atención necesita al que menos", () => {
        render(() => (
            <MemoryRouter>
                <Route path="*" component={() => <HealthRanking crops={CROPS}/>}/>
            </MemoryRouter>
        ));
        const names = screen.getAllByRole("link").map((link) => link.textContent);
        expect(names[0]).toContain("Tomates");
        expect(names[1]).toContain("Lechugas");
        expect(names[2]).toContain("Sin evaluar");
    });

    it("conserva el color de cada cultivo al quitar otro de la comparación", () => {
        const {result} = renderHook(() => useComparedCrops(CROPS));
        expect(result.colorOf("c")).toBe(CROP_COLORS[2]);
        result.toggle("a");
        expect(result.colorOf("a")).toBeUndefined();
        expect(result.colorOf("c")).toBe(CROP_COLORS[2]);
        result.toggle("a");
        expect(result.colorOf("a")).toBe(CROP_COLORS[0]);
    });

    it("aplica una acción sugerida a todos sus cultivos y muestra el resultado", async () => {
        const result: BulkCommandResult = {
            sent: 2, skipped: 0, failed: 0, results: [
                {cropId: "a", cropName: "Lechugas", status: "SENT", commandId: "1", message: null},
                {cropId: "b", cropName: "Tomates", status: "SENT", commandId: "2", message: null},
            ],
        };
        const bulk = vi.spyOn(commandApi, "bulk").mockResolvedValue(result);
        render(() => <FleetActionsList crops={CROPS} actions={[{
            actuator: "WATER_PUMP", action: "ACTIVATE", durationSeconds: 30,
            cropIds: ["a", "b"], reason: "El sustrato está seco: riego automático.",
        }]}/>);

        expect(screen.getByText("Lechugas, Tomates")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", {name: "Aplicar a 2"}));

        expect(bulk).toHaveBeenCalledWith({
            actuatorType: "WATER_PUMP",
            action: "ACTIVATE",
            durationSeconds: 30,
            cropIds: ["a", "b"],
        });
        expect(await screen.findByText("2 enviados")).toBeInTheDocument();
    });
});
