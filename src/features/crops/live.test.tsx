import {MemoryRouter, Route} from "@solidjs/router";
import {render, screen} from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import {createSignal} from "solid-js";
import {beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {commandApi, cropApi, cropChannelApi, virtualDeviceApi} from "../../lib/api/services";
import type {Actuator, ActuatorType, Command, Crop, Insight, VirtualDevice} from "../../lib/api/types";
import {ConnectionGuide} from "./components/ConnectionGuide";
import {ControlPanel} from "./components/ControlPanel";
import {CropNotifications} from "./components/CropNotifications";
import {InsightPanel} from "./components/InsightPanel";
import {SimulationPanel} from "./components/SimulationPanel";
import {CreateCropDialog} from "./components/CreateCropDialog";
import {CropHero} from "./components/CropHero";
import {CropScene, type CropSceneProps} from "./components/scene/CropScene";
import {liveStatus, runningActuators} from "./live";

vi.mock("../../lib/api/services", () => ({
    cropApi: {create: vi.fn()},
    commandApi: {send: vi.fn()},
    actuatorApi: {add: vi.fn(), remove: vi.fn()},
    cropChannelApi: {list: vi.fn(), update: vi.fn(), share: vi.fn(), removeRecipient: vi.fn()},
    virtualDeviceApi: {get: vi.fn(), configure: vi.fn(), pause: vi.fn(), places: vi.fn()},
}));

const NOW = Date.parse("2026-09-27T12:00:00Z");
const ALL: ActuatorType[] = ["WATER_PUMP", "UV_LIGHT", "FAN", "HUMIDIFIER", "NUTRIENT_DOSER", "PH_DOSER"];

const CROP: Crop = {
    id: "c1", name: "Lechugas", type: "LETTUCE", kind: "REAL", form: "NFT", automationEnabled: false,
    device: {online: true, lastSeenAt: null, keyRotatedAt: null}, health: null, createdAt: "2026-09-26T00:00:00Z",
    latestReading: {
        id: "r1", cropId: "c1", measuredAt: "2026-09-27T11:59:30Z", source: "MQTT",
        measures: {temperature: 21, soilMoisture: 64, brightness: 900},
    },
};

const actuator = (type: ActuatorType, active = false): Actuator =>
    ({id: `a-${type}`, cropId: "c1", type, active, lastChangedAt: null});

const command = (type: ActuatorType, overrides: Partial<Command>): Command => ({
    id: `k-${type}`, cropId: "c1", actuatorId: `a-${type}`, actuatorType: type, action: "ACTIVATE", durationSeconds: 15,
    status: "EXECUTED", source: "USER", reason: null, message: null, createdAt: "2026-09-27T11:59:50Z",
    sentAt: "2026-09-27T11:59:50Z", completedAt: "2026-09-27T11:59:51Z", ...overrides,
});

function scene(initial: Partial<CropSceneProps>) {
    const defaults: CropSceneProps = {
        form: "POT",
        type: "LETTUCE",
        installed: [],
        running: new Set(),
        isDay: true,
        vigor: "healthy",
        label: "Escena",
    };
    const [state, setState] = createSignal<CropSceneProps>({...defaults, ...initial});
    const view = render(() => <CropScene {...state()}/>);
    return {
        ...view,
        rerender: (next: Partial<CropSceneProps>) => setState({...defaults, ...next}),
    };
}

describe("cultivo en vivo", () => {
    it("dibuja cada forma con su sistema", () => {
        for (const form of ["POT", "NFT", "TOWER", "RAFT"] as const) {
            const {container, unmount} = scene({form});
            expect(container.querySelector(`[data-form="${form}"]`)).not.toBeNull();
            unmount();
        }
        const {container} = scene({form: "NFT"});
        expect(container.querySelectorAll("[data-plant='LETTUCE']")).toHaveLength(12);
    });

    it("dibuja solo los actuadores instalados y anima los encendidos", () => {
        const {container} = scene({
            installed: ALL,
            running: new Set<ActuatorType>(["WATER_PUMP", "FAN", "HUMIDIFIER"]),
        });
        for (const type of ALL) expect(container.querySelector(`[data-actuator="${type}"]`)).not.toBeNull();
        expect(container.querySelector('[data-actuator="WATER_PUMP"]')).toHaveAttribute("data-on", "true");
        expect(container.querySelector('[data-actuator="UV_LIGHT"]')).toHaveAttribute("data-on", "false");
        expect(container.querySelector('[data-actuator="FAN"] .scene-spin')).not.toBeNull();
        expect(container.querySelectorAll('[data-actuator="HUMIDIFIER"] .scene-mist')).toHaveLength(3);
        expect(container.querySelector('[data-actuator="WATER_PUMP"] .scene-flow')).not.toBeNull();

        const {container: bare} = scene({installed: ["WATER_PUMP"], running: new Set<ActuatorType>(["FAN"])});
        expect(bare.querySelector('[data-actuator="FAN"]')).toBeNull();
    });

    it("usa el clima del lugar o el interior, de día o de noche", () => {
        const {container, rerender} = scene({condition: "RAIN"});
        expect(container.querySelector('[data-backdrop="outdoor"]')).not.toBeNull();
        expect(container.querySelectorAll(".scene-rain line").length).toBeGreaterThan(10);
        expect(container.querySelector(".scene-sun")).toBeNull();
        rerender({form: "POT", type: "TOMATO", installed: [], running: new Set(), condition: "CLEAR", isDay: true,
            vigor: "critical", label: "Despejado"});
        expect(container.querySelector(".scene-sun")).not.toBeNull();
        expect(container.querySelector("[data-plant='TOMATO']")).toHaveAttribute("data-vigor", "critical");
        rerender({form: "POT", type: "TOMATO", installed: [], running: new Set(), isDay: false, vigor: "healthy",
            label: "Interior"});
        expect(container.querySelector('[data-backdrop="indoor"]')).not.toBeNull();
    });

    it("dibuja el lugar: bajo techo con su ventana, media sombra o sombra al aire libre", () => {
        const {container, rerender} = scene({setting: "INDOOR", exposure: "FULL_SUN", condition: "CLEAR"});
        expect(container.querySelector('[data-backdrop="indoor"]')).not.toBeNull();
        expect(container.querySelector("[data-sunbeam]")).not.toBeNull();
        rerender({form: "POT", type: "TOMATO", installed: [], running: new Set(), isDay: true, vigor: "healthy",
            setting: "INDOOR", exposure: "SHADE", label: "Sin luz"});
        expect(container.querySelector("[data-curtain]")).not.toBeNull();
        expect(container.querySelector("[data-sunbeam]")).toBeNull();
        rerender({form: "POT", type: "TOMATO", installed: [], running: new Set(), isDay: true, vigor: "healthy",
            setting: "OUTDOOR", exposure: "PARTIAL_SUN", label: "Media sombra"});
        expect(container.querySelector('[data-backdrop="outdoor"]')).not.toBeNull();
        expect(container.querySelector('[data-shade="PARTIAL_SUN"]')).not.toBeNull();
        rerender({form: "POT", type: "TOMATO", installed: [], running: new Set(), isDay: true, vigor: "healthy",
            setting: "OUTDOOR", exposure: "SHADE", label: "Sombra"});
        expect(container.querySelector('[data-shade="SHADE"]')).not.toBeNull();
    });

    it("sabe qué actuadores siguen encendidos", () => {
        const actuators = [actuator("UV_LIGHT", true), actuator("WATER_PUMP"), actuator("FAN"), actuator("HUMIDIFIER")];
        const commands = [
            command("WATER_PUMP", {}),
            command("FAN", {createdAt: "2026-09-27T11:00:00Z", completedAt: "2026-09-27T11:00:01Z"}),
        ];
        const simulated = [{actuator: "HUMIDIFIER" as const, until: "2026-09-27T12:03:00Z"}];
        expect([...runningActuators(actuators, commands, simulated, NOW)].sort())
            .toEqual(["HUMIDIFIER", "UV_LIGHT", "WATER_PUMP"]);
        expect(runningActuators(actuators, commands, [], NOW + 60_000).has("WATER_PUMP")).toBe(false);
        expect(runningActuators([], [], [{actuator: "FAN", until: null}], NOW).has("FAN")).toBe(true);
    });

    it("solo ilustra lo que está conectado", () => {
        expect(liveStatus(CROP)).toBe("live");
        expect(liveStatus({...CROP, device: {...CROP.device, online: false}})).toBe("offline");
        const virtual: Crop = {...CROP, kind: "VIRTUAL", device: {...CROP.device, online: false}};
        const simulation = {available: true, active: false, connected: false} as VirtualDevice;
        expect(liveStatus(virtual, simulation)).toBe("paused");
        expect(liveStatus(virtual, {...simulation, active: true, connected: true})).toBe("live");
        expect(liveStatus({...CROP, latestReading: null})).toBe("waiting");
    });

    it("dibuja la especie de cada cultivo en todas las formas", () => {
        const species = ["LETTUCE", "TOMATO", "STRAWBERRY", "BASIL", "SPINACH", "PEPPER"] as const;
        for (const type of species) {
            for (const form of ["POT", "NFT", "TOWER", "RAFT"] as const) {
                const {container, unmount} = scene({form, type});
                const plants = [...container.querySelectorAll("[data-plant]")].map((plant) => plant.getAttribute("data-plant"));
                expect(plants.length).toBeGreaterThan(0);
                expect(new Set(plants)).toEqual(new Set([type]));
                unmount();
            }
        }
    });

    it("un cultivo real desconectado no se ilustra y lleva a la guía", async () => {
        const onOpenTab = vi.fn();
        render(() => <CropHero crop={{...CROP, device: {...CROP.device, online: false}}}
                               actuators={[actuator("WATER_PUMP")]}
                               commands={[]} onOpenTab={onOpenTab}/>);
        expect(screen.getByText("Tu cultivo no está conectado")).toBeInTheDocument();
        expect(screen.queryByRole("img")).toBeNull();
        expect(screen.getByText("· apagado")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", {name: "Ver cómo conectarlo"}));
        expect(onOpenTab).toHaveBeenCalledWith("device");
    });

    it("la ilustración muestra el estado sin botones de acción y sin decir que es real", () => {
        const placed: Crop = {
            ...CROP, placement: {
                setting: "OUTDOOR", exposure: "PARTIAL_SUN",
                location: {name: "Medellín", latitude: 6.24, longitude: -75.58},
            },
        };
        render(() => <CropHero crop={placed} actuators={[actuator("UV_LIGHT", true), actuator("FAN")]} commands={[]}
                               weather={{
                                   temperature: 24,
                                   humidity: 60,
                                   cloudCover: 10,
                                   radiation: 700,
                                   precipitation: 0,
                                   pressure: 850,
                                   windSpeed: 3,
                                   isDay: true,
                                   code: 1,
                                   condition: "MOSTLY_CLEAR",
                                   label: "Mayormente despejado",
                                   observedAt: "",
                               }}
                               onOpenTab={vi.fn()}/>);
        expect(screen.getByRole("img", {name: /Lechuga en tubos NFT, al aire libre en media sombra en Medellín, mayormente despejado, de día; encendidos: luz ultravioleta/}))
            .toBeInTheDocument();
        expect(screen.getByText("Al aire libre en media sombra en Medellín")).toBeInTheDocument();
        expect(screen.getByText(/Afuera: mayormente despejado/)).toBeInTheDocument();
        expect(screen.getByText("· encendido")).toBeInTheDocument();
        expect(screen.getByText("· apagado")).toBeInTheDocument();
        expect(screen.queryByText(/Cultivo real/)).toBeNull();
        expect(screen.queryAllByRole("button")).toHaveLength(0);
    });

    it("sin lugar invita a indicarlo en Ajustes", async () => {
        const onOpenTab = vi.fn();
        render(() => <CropHero crop={CROP} actuators={[]} commands={[]} onOpenTab={onOpenTab}/>);
        expect(screen.getByText(/Lugar sin definir/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", {name: "Indicar dónde está"}));
        expect(onOpenTab).toHaveBeenCalledWith("settings");
    });

    it("un cultivo virtual en pausa lleva a su simulación", async () => {
        const onOpenTab = vi.fn();
        const paused = {
            available: true,
            active: false,
            connected: false,
            running: false,
            activeActuators: [],
        } as unknown as VirtualDevice;
        render(() => <CropHero crop={{...CROP, kind: "VIRTUAL"}} actuators={[]} commands={[]} simulation={paused}
                               onOpenTab={onOpenTab}/>);
        expect(screen.getByText("La simulación está en pausa")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", {name: "Ir a Simulación"}));
        expect(onOpenTab).toHaveBeenCalledWith("simulation");
    });
});

describe("crear un cultivo", () => {
    beforeAll(() => {
        HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
            this.setAttribute("open", "");
        };
        HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
            this.removeAttribute("open");
        };
    });
    beforeEach(() => vi.mocked(cropApi.create).mockReset());

    it("uno virtual arranca su simulación y no pide conexión", async () => {
        vi.mocked(cropApi.create).mockResolvedValue({crop: {...CROP, kind: "VIRTUAL"}});
        const onCreated = vi.fn();
        render(() => (
            <MemoryRouter>
                <Route path="*" component={() => <CreateCropDialog open onClose={vi.fn()} onCreated={onCreated}/>}/>
            </MemoryRouter>
        ));

        expect(screen.getByText(/El tipo no se puede cambiar después/)).toBeInTheDocument();
        expect(screen.getByRole("button", {name: "Siguiente"})).toBeDisabled();
        await userEvent.click(screen.getByRole("radio", {name: /Virtual/}));
        await userEvent.click(screen.getByRole("button", {name: "Siguiente"}));
        await userEvent.type(screen.getByLabelText("Nombre"), "Fresas del patio");
        await userEvent.click(screen.getByRole("radio", {name: "Torre vertical"}));
        expect(screen.getByRole("img", {name: /torre vertical/})).toBeInTheDocument();

        await userEvent.click(screen.getByRole("radio", {name: /Al aire libre/}));
        await userEvent.click(screen.getByRole("radio", {name: /Pleno sol/}));
        expect(screen.getByText(/La lechuga prefiere media sombra/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", {name: "Crear cultivo"}));

        expect(cropApi.create).toHaveBeenCalledWith({
            name: "Fresas del patio", type: "LETTUCE", kind: "VIRTUAL",
            form: "TOWER", placement: {setting: "OUTDOOR", exposure: "FULL_SUN"}, virtual: {mode: "AUTO"},
        });
        expect(onCreated).toHaveBeenCalled();
        expect(screen.queryByText(/Conecta tu dispositivo/)).toBeNull();
    });

    it("uno real muestra la clave y la guía del ESP32 y de Wokwi", async () => {
        vi.mocked(cropApi.create).mockResolvedValue({
            crop: CROP, device: {
                host: "mqtt.smartpot.app", port: 8883,
                tls: true, username: "c1", key: "clave-secreta-0001",
                topics: {telemetry: "t", commands: "c", commandAck: "a", status: "s"},
            },
        });
        render(() => (
            <MemoryRouter>
                <Route path="*" component={() => <CreateCropDialog open onClose={vi.fn()} onCreated={vi.fn()}/>}/>
            </MemoryRouter>
        ));

        await userEvent.click(screen.getByRole("radio", {name: /Real/}));
        await userEvent.click(screen.getByRole("button", {name: "Siguiente"}));
        await userEvent.type(screen.getByLabelText("Nombre"), "Lechugas");
        await userEvent.click(screen.getByRole("button", {name: "Crear cultivo"}));

        expect(await screen.findByText("Guarda la clave ahora")).toBeInTheDocument();
        expect(screen.getByText("clave-secreta-0001")).toBeInTheDocument();
        expect(screen.getByText("Arma el circuito")).toBeInTheDocument();
        expect(vi.mocked(cropApi.create).mock.calls[0]?.[0]).not.toHaveProperty("virtual");
    });
});

describe("control con switches", () => {
    beforeEach(() => vi.mocked(commandApi.send).mockReset().mockResolvedValue({} as Command));

    it("un actuador apagado solo se puede encender y uno encendido solo apagar", async () => {
        render(() => <ControlPanel crop={CROP} actuators={[actuator("WATER_PUMP"), actuator("UV_LIGHT", true)]}
                                   commands={[]}
                                   onAutomation={vi.fn()} onChanged={vi.fn()}/>);
        const pump = screen.getByRole("switch", {name: "Bomba de agua"});
        const light = screen.getByRole("switch", {name: "Luz ultravioleta"});
        expect(pump).toHaveAttribute("aria-checked", "false");
        expect(light).toHaveAttribute("aria-checked", "true");
        expect(screen.queryByRole("button", {name: "Apagar"})).toBeNull();

        await userEvent.selectOptions(screen.getByLabelText("Duración de Bomba de agua"), "30");
        await userEvent.click(pump);
        expect(commandApi.send).toHaveBeenLastCalledWith("c1", "a-WATER_PUMP", "ACTIVATE", 30);
        expect(pump).toBeDisabled();
        expect(screen.getByText(/Encendiendo… esperando al dispositivo/)).toBeInTheDocument();

        await userEvent.click(light);
        expect(commandApi.send).toHaveBeenLastCalledWith("c1", "a-UV_LIGHT", "DEACTIVATE", undefined);
    });

    it("una orden en curso bloquea el switch y sin conexión no se controla", () => {
        const {unmount} = render(() => <ControlPanel crop={CROP} actuators={[actuator("FAN")]}
                                                     commands={[command("FAN", {status: "SENT", completedAt: null})]}
                                                     onAutomation={vi.fn()} onChanged={vi.fn()}/>);
        expect(screen.getByRole("switch", {name: "Ventilador"})).toBeDisabled();
        expect(screen.getByRole("switch", {name: "Ventilador"})).toHaveAttribute("aria-checked", "true");
        unmount();
        render(() => <ControlPanel crop={{...CROP, device: {...CROP.device, online: false}}}
                                   actuators={[actuator("FAN")]}
                                   commands={[]} onAutomation={vi.fn()} onChanged={vi.fn()}/>);
        expect(screen.getByRole("switch", {name: "Ventilador"})).toBeDisabled();
    });

    it("un encendido por tiempo muestra cuánto le queda", () => {
        render(() => <ControlPanel crop={CROP} actuators={[{
            ...actuator("WATER_PUMP"), running: true,
            runningUntil: new Date(Date.now() + 12_000).toISOString(),
        }]} commands={[]} onAutomation={vi.fn()}
                                   onChanged={vi.fn()}/>);
        expect(screen.getByRole("switch", {name: "Bomba de agua"})).toHaveAttribute("aria-checked", "true");
        expect(screen.getByText(/se apaga en 1[12] s/)).toBeInTheDocument();
    });
});

describe("simulación", () => {
    const simulation = {
        cropId: "c1", available: true, active: true, running: true, connected: true, mode: "AUTO",
        intervalSeconds: 30, lastPublishedAt: new Date().toISOString(), activeActuators: [],
    } as unknown as VirtualDevice;
    const virtual: Crop = {...CROP, kind: "VIRTUAL"};

    it("separa el estado con pausar y reanudar de la configuración", async () => {
        vi.mocked(virtualDeviceApi.pause).mockResolvedValue(undefined);
        vi.mocked(virtualDeviceApi.configure).mockResolvedValue(simulation);
        const onPaused = vi.fn();
        const {unmount} = render(() => <SimulationPanel crop={virtual} simulation={simulation} profile={undefined}
                                                        onSaved={vi.fn()} onPaused={onPaused} onOpenTab={vi.fn()}/>);
        expect(screen.getByText("Simulación en marcha")).toBeInTheDocument();
        expect(screen.getByText("Cómo se simula")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", {name: "Pausar"}));
        expect(onPaused).toHaveBeenCalled();
        expect(virtualDeviceApi.configure).not.toHaveBeenCalled();
        unmount();

        render(() => <SimulationPanel crop={virtual} simulation={{...simulation, active: false}} profile={undefined}
                                      onSaved={vi.fn()} onPaused={vi.fn()} onOpenTab={vi.fn()}/>);
        expect(screen.getByText("Simulación en pausa")).toBeInTheDocument();
        await userEvent.click(screen.getByRole("radio", {name: /Manual/}));
        await userEvent.click(screen.getByRole("button", {name: "Reanudar"}));
        expect(virtualDeviceApi.configure).toHaveBeenCalledWith("c1", {mode: "AUTO", intervalSeconds: 30});
    });
});

describe("avisos del cultivo", () => {
    it("no muestra la sección de una aplicación sin vincular", async () => {
        vi.mocked(cropChannelApi.list).mockResolvedValue([{
            type: "TELEGRAM", name: "Telegram", available: true,
            linked: false, enabled: true, events: ["ALERT"], delivery: "INSTANT", digestHours: 6, recipients: [],
        }]);
        render(() => (
            <MemoryRouter>
                <Route path="*" component={() => <CropNotifications crop={CROP}/>}/>
            </MemoryRouter>
        ));
        expect(await screen.findByText(/Vincula una aplicación/)).toBeInTheDocument();
        expect(screen.queryByText("Avisos por Telegram")).toBeNull();
    });

    it("con Telegram vinculado elige qué avisar, el resumen y con quién compartir", async () => {
        vi.mocked(cropChannelApi.list).mockResolvedValue([{
            type: "TELEGRAM", name: "Telegram", available: true,
            linked: true, enabled: true, events: ["ALERT"], delivery: "INSTANT", digestHours: 6,
            recipients: [{id: "r1", displayName: "@ana", addedAt: null}],
        }]);
        vi.mocked(cropChannelApi.update).mockResolvedValue({} as never);
        render(() => (
            <MemoryRouter>
                <Route path="*" component={() => <CropNotifications crop={CROP}/>}/>
            </MemoryRouter>
        ));

        expect(await screen.findByText("Avisos por Telegram")).toBeInTheDocument();
        expect(screen.getByText("@ana")).toBeInTheDocument();
        await userEvent.click(screen.getByLabelText("Acciones del asistente"));
        await userEvent.click(screen.getByLabelText(/Un resumen cada/));
        await userEvent.selectOptions(screen.getByLabelText("Horas entre resúmenes"), "3");
        await userEvent.click(screen.getByLabelText(/Resumen diario/));
        await userEvent.click(screen.getByRole("button", {name: "Guardar avisos"}));

        expect(cropChannelApi.update).toHaveBeenCalledWith("c1", "TELEGRAM", {
            enabled: true, events: ["ALERT", "AI"],
            delivery: "DIGEST", digestHours: 3, dailySummaryAt: "07:00",
        });
    });
});

describe("consejo de lugar", () => {
    it("pide mover el cultivo cuando el lugar ya afecta su salud", async () => {
        const onOpenTab = vi.fn();
        const insight = {
            cropType: "LETTUCE", health: {index: 55, level: "FAIR", label: "Regular"}, diagnosis: [],
            conclusions: [], predictions: [], actions: [], summary: "Tu lechuga está regular.", evaluatedAt: "",
            placement: {
                level: "MOVE", title: "Le sobra sol", message: "Está al aire libre a pleno sol y el calor ya se nota.",
                lightNeed: "PARTIAL_SUN", idealSetting: "OUTDOOR", idealExposure: "PARTIAL_SUN",
            },
        } as unknown as Insight;
        render(() => <InsightPanel insight={insight} error={null} loading={false} actuators={[]} onRefresh={vi.fn()}
                                   onRunAction={vi.fn()} onOpenTab={onOpenTab}/>);
        expect(screen.getByText("Le sobra sol")).toBeInTheDocument();
        expect(screen.getByText(/Lugar ideal: al aire libre en media sombra/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole("button", {name: "Cambiar el lugar"}));
        expect(onOpenTab).toHaveBeenCalledWith("settings");
    });
});

describe("guía de conexión", () => {
    it("Wokwi usa su red y advierte sobre proyectos públicos", async () => {
        render(() => <ConnectionGuide credentials={{
            host: "mqtt.smartpot.app", port: 8883, tls: true, username: "c1",
            topics: {telemetry: "t", commands: "c", commandAck: "a", status: "s"},
        }}/>);
        expect(screen.getByText(/<NOMBRE_DE_TU_RED>/)).toBeInTheDocument();
        await userEvent.click(screen.getByRole("radio", {name: /Simulado en Wokwi/}));
        expect(screen.getByText(/"ssid": "Wokwi-GUEST"/)).toBeInTheDocument();
        expect(screen.getByText(/Deja tu copia del proyecto como privada/)).toBeInTheDocument();
    });

    it("incluye en config.py la CA pública del broker", async () => {
        const ca = "-----BEGIN CERTIFICATE-----\nMIIBCA\n-----END CERTIFICATE-----\n";
        const fetchCa = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(ca));
        render(() => <ConnectionGuide credentials={{
            host: "mqtt.smartpot.app", port: 8883, tls: true, username: "c1",
            topics: {telemetry: "t", commands: "c", commandAck: "a", status: "s"},
        }}/>);
        expect(await screen.findByText(/"CA_CRT": """-----BEGIN CERTIFICATE-----/)).toBeInTheDocument();
        expect(fetchCa).toHaveBeenCalledWith("/ca.crt");
        expect(screen.getByRole("link", {name: "ca.crt"})).toHaveAttribute("href", "/ca.crt");
        fetchCa.mockRestore();
    });
});
