import type {DeviceCredentials} from "../../lib/api/types";

/** Dónde corre el firmware: un ESP32 físico en tu red o el ESP32 simulado de Wokwi. */
export type FirmwareTarget = "esp32" | "wokwi";

export const FIRMWARE_REPO = "https://github.com/SmartPotTech/SmartPot-IoT";
export const WOKWI_PROJECT = "https://wokwi.com/projects/408863167711709185";

/** Ruta pública de la CA que firma el certificado del broker. */
export const BROKER_CA_PATH = "/ca.crt";

/** config.py del firmware: la red WiFi, el bloque SMARTPOT del cultivo y la CA del broker en BROKER. */
export function firmwareConfig(
    credentials: DeviceCredentials,
    target: FirmwareTarget = "esp32",
    caCertificate?: string,
): string {
    const wifi = target === "wokwi"
        ? `WIFI = {\n    "ssid": "Wokwi-GUEST",\n    "password": "",\n}`
        : `WIFI = {\n    "ssid": "<NOMBRE_DE_TU_RED>",\n    "password": "<CLAVE_DE_TU_RED>",\n}`;
    const ca = credentials.tls ? (caCertificate?.trim() || "<CA_DE_SMARTPOT>") : "";
    return `${wifi}

SMARTPOT = {
    "crop_id": "${credentials.username}",
    "device_key": "${credentials.key ?? "<CLAVE_DEL_DISPOSITIVO>"}",
    "host": "${credentials.host}",
    "port": ${credentials.port},
    "tls": ${credentials.tls ? "True" : "False"},
    "interval_seconds": 30,
}

BROKER = {
    "CA_CRT": """${ca}"""
}`;
}
