import {MemoryRouter, Route} from "@solidjs/router";
import {render, screen, within} from "@solidjs/testing-library";
import {describe, expect, it} from "vitest";
import type {Learning, ModelCard} from "../../lib/api/types";
import {LearningCard} from "../crops/components/LearningCard";
import {ModelSummary} from "./LearningPage";

const LEARNED: Learning = {
    source: "LEARNED",
    readings: 5210,
    trainedAt: new Date().toISOString(),
    message: "Aprendido de 5.210 lecturas reales de lechuga: 3 de 3 modelos supervisados entrenados.",
    predictions: [{
        name: "needs_water", label: "¿Se secará el sustrato en la próxima hora?", probability: 0.86,
        model: "Bosque aleatorio", metric: "F1 macro", score: 0.91,
    }],
    moisture: {expectedIn1h: 58.4, model: "Gradient boosting", mae: 1.2},
    state: {
        label: "Temperatura alta en la tarde",
        description: "Lo más alejado del ideal: temperatura alta.",
        share: 0.31,
    },
    anomaly: {score: 0.82, unusual: true},
};

describe("aprendizaje continuo", () => {
    it("LearningCard muestra el estado, la humedad esperada y la predicción aprendida", () => {
        render(() => (
            <MemoryRouter>
                <Route path="*" component={() => <LearningCard learning={LEARNED}/>}/>
            </MemoryRouter>
        ));

        expect(screen.getByText("Temperatura alta en la tarde")).toBeInTheDocument();
        expect(screen.getByText("58 %")).toBeInTheDocument();
        expect(screen.getByText("Poco habitual")).toBeInTheDocument();
        expect(screen.getByText("86 %")).toBeInTheDocument();
        expect(screen.getByText(/F1 macro 0.91/)).toBeInTheDocument();
        expect(screen.getByRole("link", {name: "Ver cómo aprende el asistente"})).toHaveAttribute("href", "/app/learning");
    });

    it("LearningCard explica que aún está aprendiendo", () => {
        render(() => (
            <MemoryRouter>
                <Route path="*" component={() => (
                    <LearningCard learning={{
                        source: "BASE", readings: 40,
                        message: "Aún aprendo de las macetas de lechuga: hay 40 lecturas reales.",
                    }}/>
                )}/>
            </MemoryRouter>
        ));
        expect(screen.getByText("Aprendiendo")).toBeInTheDocument();
        expect(screen.queryByText("Estado de operación")).not.toBeInTheDocument();
    });

    it("ModelSummary ordena los candidatos y resalta el elegido", () => {
        const card: ModelCard = {
            task: "moisture_1h", label: "Humedad del sustrato dentro de una hora", status: "TRAINED",
            metric: "Error medio (%)", model: "Bosque aleatorio", score: 2.27, std: 0.4, holdout: 1.2, baseline: 4.51,
            samples: 2133, version: 2, candidates: [
                {model: "Línea base", score: 5.38, std: 0.9},
                {model: "Bosque aleatorio", score: 2.27, std: 0.4},
                {model: "Regresión ridge", score: 5.54, std: 1.1},
            ],
        };
        render(() => <ModelSummary model={card}/>);

        const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
        expect(rows.map((row) => row.firstChild?.textContent)).toEqual(["Bosque aleatorio", "Línea base", "Regresión ridge"]);
        expect(rows[0]).toHaveClass("font-semibold");
        expect(screen.getByText(/1.20 en las lecturas más recientes \(línea base 4.51\)/)).toBeInTheDocument();
    });

    it("ModelSummary muestra por qué una tarea sigue pendiente", () => {
        render(() => <ModelSummary model={{
            task: "overheat", label: "¿Pasará la temperatura del máximo?", status: "PENDING",
            metric: "F1 macro", reason: "Aún no hay suficientes casos positivos (3 de 10).", samples: 900, positives: 3,
            version: 0, candidates: [],
        }}/>);
        expect(screen.getByText("Pendiente")).toBeInTheDocument();
        expect(screen.getByText(/suficientes casos positivos/)).toBeInTheDocument();
    });
});
