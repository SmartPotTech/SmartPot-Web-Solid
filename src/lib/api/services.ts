import {request} from "./client";
import type {
    Actuator,
    ActuatorType,
    AppNotification,
    AuthResponse,
    BulkCommandResult,
    ChannelLink,
    ChannelOption,
    ChannelType,
    Command,
    CommandAction,
    Crop,
    CropChannel,
    CropChannelUpdate,
    CropCreated,
    CropCreateRequest,
    CropProfile,
    CropUpdateRequest,
    DeviceCredentials,
    Fleet,
    Insight,
    LearningStatus,
    LinkCode,
    Measures,
    MetricKey,
    MetricSeries,
    NotificationType,
    Overview,
    Place,
    Reading,
    ReadingSummary,
    User,
    VirtualDevice,
    VirtualDeviceRequest,
    Weather,
} from "./types";

const V1 = "/api/v1";

export const authApi = {
    login: (email: string, password: string) =>
        request<AuthResponse>(`${V1}/auth/login`, {method: "POST", body: {email, password}, auth: false}),
    register: (data: { name: string; lastName: string; email: string; password: string }) =>
        request<AuthResponse>(`${V1}/auth/register`, {method: "POST", body: data, auth: false}),
    forgotPassword: (email: string) =>
        request<void>(`${V1}/auth/password/forgot`, {method: "POST", body: {email}, auth: false}),
    resetPassword: (token: string, password: string) =>
        request<void>(`${V1}/auth/password/reset`, {method: "POST", body: {token, password}, auth: false}),
};

export const userApi = {
    me: () => request<User>(`${V1}/users/me`),
    update: (data: { name: string; lastName: string }) => request<User>(`${V1}/users/me`, {method: "PUT", body: data}),
    changePassword: (currentPassword: string, newPassword: string) =>
        request<void>(`${V1}/users/me/password`, {method: "PUT", body: {currentPassword, newPassword}}),
    remove: () => request<void>(`${V1}/users/me`, {method: "DELETE"}),
};

export const cropApi = {
    list: () => request<Crop[]>(`${V1}/crops`),
    get: (id: string) => request<Crop>(`${V1}/crops/${id}`),
    create: (data: CropCreateRequest) => request<CropCreated>(`${V1}/crops`, {method: "POST", body: data}),
    update: (id: string, data: CropUpdateRequest) => request<Crop>(`${V1}/crops/${id}`, {method: "PUT", body: data}),
    /** Clima actual del lugar del cultivo; undefined si no tiene lugar o no está disponible. */
    weather: (id: string) => request<Weather | undefined>(`${V1}/crops/${id}/weather`),
    remove: (id: string) => request<void>(`${V1}/crops/${id}`, {method: "DELETE"}),
    setAutomation: (id: string, enabled: boolean) =>
        request<Crop>(`${V1}/crops/${id}/automation`, {method: "PUT", body: {enabled}}),
    /** Sin ids, se aplica a todos los cultivos de la cuenta. */
    setAutomationBulk: (enabled: boolean, cropIds?: string[]) =>
        request<Crop[]>(`${V1}/crops/automation`, {method: "PUT", body: {enabled, cropIds: cropIds ?? null}}),
    device: (id: string) => request<DeviceCredentials>(`${V1}/crops/${id}/device`),
    rotateKey: (id: string) => request<DeviceCredentials>(`${V1}/crops/${id}/device/key`, {method: "POST"}),
    profiles: () => request<CropProfile[]>(`${V1}/crop-profiles`, {auth: false}),
};

export const readingApi = {
    list: (cropId: string, from?: Date, limit?: number) => {
        const params = new URLSearchParams();
        if (from) params.set("from", from.toISOString());
        if (limit) params.set("limit", String(limit));
        return request<Reading[]>(`${V1}/crops/${cropId}/readings?${params}`);
    },
    summary: (cropId: string, hours: number) =>
        request<ReadingSummary>(`${V1}/crops/${cropId}/readings/summary?hours=${hours}`),
    create: (cropId: string, measures: Measures) =>
        request<Reading>(`${V1}/crops/${cropId}/readings`, {method: "POST", body: measures}),
    exportCsv: (cropId: string, from: Date) =>
        request<string>(`${V1}/crops/${cropId}/readings/export?from=${encodeURIComponent(from.toISOString())}`,
            {accept: "text"}),
};

export const actuatorApi = {
    list: (cropId: string) => request<Actuator[]>(`${V1}/crops/${cropId}/actuators`),
    add: (cropId: string, type: ActuatorType) =>
        request<Actuator>(`${V1}/crops/${cropId}/actuators`, {method: "POST", body: {type}}),
    remove: (cropId: string, actuatorId: string) =>
        request<void>(`${V1}/crops/${cropId}/actuators/${actuatorId}`, {method: "DELETE"}),
};

export const commandApi = {
    list: (cropId: string, limit = 20) => request<Command[]>(`${V1}/crops/${cropId}/commands?limit=${limit}`),
    send: (cropId: string, actuatorId: string, action: CommandAction, durationSeconds?: number | null) =>
        request<Command>(`${V1}/crops/${cropId}/commands`, {
            method: "POST",
            body: {actuatorId, action, durationSeconds: durationSeconds ?? null},
        }),
    listAll: (limit = 50) => request<Command[]>(`${V1}/commands?limit=${limit}`),
    bulk: (body: {
        actuatorType: ActuatorType;
        action: CommandAction;
        durationSeconds?: number | null;
        cropIds?: string[]
    }) =>
        request<BulkCommandResult>(`${V1}/commands/bulk`, {
            method: "POST",
            body: {...body, durationSeconds: body.durationSeconds ?? null, cropIds: body.cropIds ?? null},
        }),
};

export const overviewApi = {
    get: () => request<Overview>(`${V1}/overview`),
    series: (metric: MetricKey, hours: number) =>
        request<MetricSeries>(`${V1}/overview/series?metric=${metric}&hours=${hours}`),
    fleet: () => request<Fleet>(`${V1}/overview/fleet`),
};

export const insightApi = {
    get: (cropId: string) => request<Insight>(`${V1}/crops/${cropId}/insights`),
    learning: () => request<LearningStatus>(`${V1}/ai/learning`),
};

export const channelApi = {
    list: () => request<ChannelOption[]>(`${V1}/channels`),
    link: (type: "telegram") => request<LinkCode>(`${V1}/channels/${type}/link`, {method: "POST"}),
    update: (linkId: string, body: { enabled?: boolean; events?: NotificationType[] }) =>
        request<ChannelLink>(`${V1}/channels/links/${linkId}`, {method: "PUT", body}),
    test: (linkId: string) => request<void>(`${V1}/channels/links/${linkId}/test`, {method: "POST"}),
    unlink: (linkId: string) => request<void>(`${V1}/channels/links/${linkId}`, {method: "DELETE"}),
};

export const cropChannelApi = {
    list: (cropId: string) => request<CropChannel[]>(`${V1}/crops/${cropId}/channels`),
    update: (cropId: string, type: ChannelType, body: CropChannelUpdate) =>
        request<CropChannel>(`${V1}/crops/${cropId}/channels/${type.toLowerCase()}`, {method: "PUT", body}),
    share: (cropId: string, type: ChannelType) =>
        request<LinkCode>(`${V1}/crops/${cropId}/channels/${type.toLowerCase()}/recipients`, {method: "POST"}),
    removeRecipient: (cropId: string, type: ChannelType, recipientId: string) =>
        request<void>(`${V1}/crops/${cropId}/channels/${type.toLowerCase()}/recipients/${recipientId}`, {method: "DELETE"}),
};

export const virtualDeviceApi = {
    get: (cropId: string) => request<VirtualDevice>(`${V1}/crops/${cropId}/virtual-device`),
    configure: (cropId: string, body: VirtualDeviceRequest) =>
        request<VirtualDevice>(`${V1}/crops/${cropId}/virtual-device`, {method: "PUT", body}),
    /** Deja de publicar lecturas y conserva la configuración; configure la reanuda. */
    pause: (cropId: string) => request<void>(`${V1}/crops/${cropId}/virtual-device`, {method: "DELETE"}),
    places: (query: string) => request<Place[]>(`${V1}/virtual-devices/places?q=${encodeURIComponent(query)}`),
};

export const notificationApi = {
    list: (unreadOnly = false) => request<AppNotification[]>(`${V1}/notifications?unreadOnly=${unreadOnly}&limit=50`),
    unreadCount: () => request<{ unread: number }>(`${V1}/notifications/unread-count`),
    markRead: (id: string) => request<AppNotification>(`${V1}/notifications/${id}/read`, {method: "PUT"}),
    markAllRead: () => request<void>(`${V1}/notifications/read-all`, {method: "PUT"}),
    remove: (id: string) => request<void>(`${V1}/notifications/${id}`, {method: "DELETE"}),
};
