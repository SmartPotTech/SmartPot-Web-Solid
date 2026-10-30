/**
 * Web Worker en segundo plano para cálculo estadístico y procesamiento intensivo
 * de telemetría y series temporales de SmartPot, liberando el hilo principal de la UI.
 */

export interface TelemetryReading {
    temperature: number;
    humidity: number;
    brightness: number;
    ph: number;
    tds: number;
    atmosphere?: number;
    soilMoisture?: number;
    measuredAt?: string;
}

export interface TelemetryStats {
    count: number;
    averages: {
        temperature: number;
        humidity: number;
        brightness: number;
        ph: number;
        tds: number;
        soilMoisture?: number;
    };
    min: {
        temperature: number;
        humidity: number;
        ph: number;
        tds: number;
    };
    max: {
        temperature: number;
        humidity: number;
        ph: number;
        tds: number;
    };
    trend: "STABLE" | "WARMING" | "COOLING" | "DRYING";
}

self.onmessage = (event: MessageEvent<{ action: "CALCULATE_STATS"; readings: TelemetryReading[] }>) => {
    const { action, readings } = event.data;

    if (action === "CALCULATE_STATS") {
        if (!readings || readings.length === 0) {
            self.postMessage({
                success: true,
                stats: null,
            });
            return;
        }

        const count = readings.length;
        let sumTemp = 0;
        let sumHum = 0;
        let sumBright = 0;
        let sumPh = 0;
        let sumTds = 0;
        let sumSoil = 0;
        let hasSoil = false;

        const firstReading = readings[0];
        if (!firstReading) {
            self.postMessage({ success: true, stats: null });
            return;
        }

        let minTemp = firstReading.temperature;
        let maxTemp = firstReading.temperature;
        let minHum = firstReading.humidity;
        let maxHum = firstReading.humidity;
        let minPh = firstReading.ph;
        let maxPh = firstReading.ph;
        let minTds = firstReading.tds;
        let maxTds = firstReading.tds;

        for (const r of readings) {
            sumTemp += r.temperature;
            sumHum += r.humidity;
            sumBright += r.brightness;
            sumPh += r.ph;
            sumTds += r.tds;

            if (r.soilMoisture !== undefined) {
                sumSoil += r.soilMoisture;
                hasSoil = true;
            }

            if (r.temperature < minTemp) minTemp = r.temperature;
            if (r.temperature > maxTemp) maxTemp = r.temperature;
            if (r.humidity < minHum) minHum = r.humidity;
            if (r.humidity > maxHum) maxHum = r.humidity;
            if (r.ph < minPh) minPh = r.ph;
            if (r.ph > maxPh) maxPh = r.ph;
            if (r.tds < minTds) minTds = r.tds;
            if (r.tds > maxTds) maxTds = r.tds;
        }

        // Estimación de tendencia en base a lecturas recientes vs iniciales
        let trend: TelemetryStats["trend"] = "STABLE";
        if (readings.length >= 4) {
            const initialTemp = (readings[0]?.temperature ?? 0);
            const recentTemp = (readings[readings.length - 1]?.temperature ?? 0);
            const initialHum = (readings[0]?.humidity ?? 0);
            const recentHum = (readings[readings.length - 1]?.humidity ?? 0);

            if (recentTemp - initialTemp > 2.0) {
                trend = "WARMING";
            } else if (initialTemp - recentTemp > 2.0) {
                trend = "COOLING";
            } else if (initialHum - recentHum > 5.0) {
                trend = "DRYING";
            }
        }

        const stats: TelemetryStats = {
            count,
            averages: {
                temperature: Number((sumTemp / count).toFixed(1)),
                humidity: Number((sumHum / count).toFixed(1)),
                brightness: Math.round(sumBright / count),
                ph: Number((sumPh / count).toFixed(2)),
                tds: Math.round(sumTds / count),
                soilMoisture: hasSoil ? Number((sumSoil / count).toFixed(1)) : undefined,
            },
            min: {
                temperature: minTemp,
                humidity: minHum,
                ph: minPh,
                tds: minTds,
            },
            max: {
                temperature: maxTemp,
                humidity: maxHum,
                ph: maxPh,
                tds: maxTds,
            },
            trend,
        };

        self.postMessage({
            success: true,
            stats,
        });
    }
};
