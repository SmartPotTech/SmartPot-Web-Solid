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

export interface LTTBPoint {
    x: number;
    y: number;
}

export function downsampleLTTB(data: LTTBPoint[], threshold: number): LTTBPoint[] {
    if (threshold >= data.length || threshold <= 2) {
        return data;
    }

    const sampled: LTTBPoint[] = [];
    let sampledIndex = 0;

    const every = (data.length - 2) / (threshold - 2);

    let a = 0;
    let maxAreaPoint: LTTBPoint = data[a]!;
    let nextA = 0;

    sampled[sampledIndex++] = data[a]!;

    for (let i = 0; i < threshold - 2; i++) {
        let avgX = 0;
        let avgY = 0;
        let avgRangeStart = Math.floor((i + 1) * every) + 1;
        let avgRangeEnd = Math.floor((i + 2) * every) + 1;
        avgRangeEnd = avgRangeEnd < data.length ? avgRangeEnd : data.length;

        const avgRangeLength = avgRangeEnd - avgRangeStart;

        for (; avgRangeStart < avgRangeEnd; avgRangeStart++) {
            avgX += data[avgRangeStart]!.x;
            avgY += data[avgRangeStart]!.y;
        }
        avgX /= avgRangeLength;
        avgY /= avgRangeLength;

        let rangeOffs = Math.floor(i * every) + 1;
        const rangeTo = Math.floor((i + 1) * every) + 1;

        const pointAX = data[a]!.x;
        const pointAY = data[a]!.y;

        let maxArea = -1;

        for (; rangeOffs < rangeTo; rangeOffs++) {
            const area = Math.abs(
                (pointAX - avgX) * (data[rangeOffs]!.y - pointAY) -
                (pointAX - data[rangeOffs]!.x) * (avgY - pointAY)
            ) * 0.5;

            if (area > maxArea) {
                maxArea = area;
                maxAreaPoint = data[rangeOffs]!;
                nextA = rangeOffs;
            }
        }

        sampled[sampledIndex++] = maxAreaPoint;
        a = nextA;
    }

    sampled[sampledIndex++] = data[data.length - 1]!;
    return sampled;
}

export type WorkerMessage =
    | { action: "CALCULATE_STATS"; readings: TelemetryReading[] }
    | { action: "DOWNSAMPLE_LTTB"; points: LTTBPoint[]; threshold: number };

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const data = event.data;

    if (data.action === "DOWNSAMPLE_LTTB") {
        const sampled = downsampleLTTB(data.points, data.threshold);
        self.postMessage({
            success: true,
            action: "DOWNSAMPLE_LTTB",
            sampled,
        });
        return;
    }

    if (data.action === "CALCULATE_STATS") {
        const readings = data.readings;
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
