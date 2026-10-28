import {A, useLocation} from "@solidjs/router";
import {
    Bell,
    Download,
    GraduationCap,
    LayoutDashboard,
    ListChecks,
    LogOut,
    SlidersHorizontal,
    Sprout,
    UserRound,
    WifiOff,
} from "lucide-solid";
import {For, type JSX, Show} from "solid-js";
import {useAuth} from "../../features/auth/AuthContext";
import {useInstallPrompt} from "../../features/pwa/pwa";
import {useOnlineStatus} from "../../hooks/useOnlineStatus";
import {useResource} from "../../hooks/useResource";
import {notificationApi} from "../../lib/api/services";
import {Logo} from "../brand/Logo";

const NAV = [
    {to: "/app", label: "Panel", icon: LayoutDashboard, end: true, mobile: true},
    {to: "/app/crops", label: "Cultivos", icon: Sprout, end: false, mobile: true},
    {to: "/app/control", label: "Control", icon: SlidersHorizontal, end: false, mobile: true},
    {to: "/app/actions", label: "Acciones", icon: ListChecks, end: false, mobile: true},
    {to: "/app/learning", label: "Aprendizaje", icon: GraduationCap, end: false, mobile: false},
    {to: "/app/notifications", label: "Alertas", icon: Bell, end: false, mobile: true},
];
// La barra inferior del móvil tiene cinco lugares; Aprendizaje se abre desde el asistente de cada cultivo.
const MOBILE_NAV = NAV.filter((item) => item.mobile);

function initials(name?: string, lastName?: string): string {
    return `${name?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "SP";
}

export function AppShell(props: { children?: JSX.Element }) {
    const auth = useAuth();
    const location = useLocation();
    const online = useOnlineStatus();
    const installPrompt = useInstallPrompt();
    const unread = useResource(() => notificationApi.unreadCount(), [], 60_000);
    const count = () => unread.data?.unread ?? 0;

    const isActive = (to: string, end?: boolean) =>
        end ? location.pathname === to : location.pathname === to || location.pathname.startsWith(`${to}/`);

    return (
        <div class="min-h-dvh md:grid md:grid-cols-[16rem_1fr]">
            <aside class="sticky top-0 hidden h-dvh flex-col bg-leaf-900 px-4 py-5 text-leaf-100 md:flex">
                <div aria-hidden="true"
                     class="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-leaf-950/80 to-transparent"/>
                <A href="/app" aria-label="Panel general" class="relative px-1"><Logo size={34} inverse/></A>
                <nav class="relative mt-9 flex flex-1 flex-col gap-1" aria-label="Aplicación">
                    <For each={NAV}>
                        {({to, label, icon: Icon, end}) => (
                            <A href={to} end={end}
                               class={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors
                ${isActive(to, end) ? "bg-leaf-700 text-white shadow-[inset_3px_0_0_var(--color-leaf-300)]"
                                   : "text-leaf-100/80 hover:bg-leaf-800 hover:text-white"}`}>
                                <Icon size={18}/>
                                {label}
                                <Show when={to === "/app/notifications" && count() > 0}>
                                    <span class="ml-auto rounded-full bg-sun-500 px-2 text-xs font-bold text-leaf-950">
                                        {count()}
                                    </span>
                                </Show>
                            </A>
                        )}
                    </For>
                </nav>
                <Show when={installPrompt.available}>
                    <button type="button" onClick={() => void installPrompt.install()}
                            class="relative mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-leaf-300 hover:bg-leaf-800">
                        <Download size={18}/> Instalar app
                    </button>
                </Show>
                <div class="relative border-t border-leaf-800 pt-4">
                    <A href="/app/profile" class={`flex items-center gap-3 rounded-xl p-2 transition-colors
            ${isActive("/app/profile") ? "bg-leaf-800" : "hover:bg-leaf-800"}`}>
                        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-500 text-sm font-bold text-leaf-950">
                            {initials(auth.user?.name, auth.user?.lastName)}
                        </span>
                        <span class="min-w-0">
                            <span class="block truncate text-sm font-semibold text-white">{auth.user?.name} {auth.user?.lastName}</span>
                            <span class="block truncate text-xs text-leaf-300">{auth.user?.email}</span>
                        </span>
                    </A>
                    <button type="button" onClick={() => auth.signOut()}
                            class="mt-2 flex items-center gap-2 px-2 text-sm font-semibold text-leaf-300 hover:text-white">
                        <LogOut size={16}/> Cerrar sesión
                    </button>
                </div>
            </aside>

            <div class="flex min-h-dvh flex-col bg-linear-to-b from-leaf-50 to-page to-40% pb-20 md:pb-0">
                <header class="sticky top-0 z-20 flex h-14 items-center justify-between bg-leaf-900 px-4 text-white md:hidden">
                    <A href="/app" aria-label="Panel general"><Logo size={28} inverse/></A>
                    <div class="flex items-center gap-1">
                        <Show when={installPrompt.available}>
                            <button type="button" onClick={() => void installPrompt.install()} aria-label="Instalar app"
                                    class="rounded-lg p-2 text-leaf-300 hover:bg-leaf-800"><Download size={20}/>
                            </button>
                        </Show>
                        <A href="/app/profile" aria-label="Mi perfil"
                           class="rounded-lg p-2 text-leaf-100 hover:bg-leaf-800">
                            <UserRound size={20}/>
                        </A>
                    </div>
                </header>
                <Show when={!online()}>
                    <div class="flex items-center justify-center gap-2 bg-sun-100 px-4 py-2 text-sm font-medium text-sun-600">
                        <WifiOff size={16}/> Sin conexión: los datos pueden no estar actualizados.
                    </div>
                </Show>
                <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">
                    {props.children}
                </main>
            </div>

            <nav class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 bg-leaf-900 pb-[env(safe-area-inset-bottom)] md:hidden"
                 aria-label="Aplicación">
                <For each={MOBILE_NAV}>
                    {({to, label, icon: Icon, end}) => (
                        <A href={to} end={end}
                           class={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold
              ${isActive(to, end) ? "text-white" : "text-leaf-300/80"}`}>
                            <span class={`flex h-7 w-12 items-center justify-center rounded-full transition-colors
                  ${isActive(to, end) ? "bg-leaf-700" : ""}`}>
                                <Icon size={19}/>
                            </span>
                            {label}
                            <Show when={to === "/app/notifications" && count() > 0}>
                                <span class="absolute right-[26%] top-1.5 h-2.5 w-2.5 rounded-full bg-sun-500 ring-2 ring-leaf-900"/>
                            </Show>
                        </A>
                    )}
                </For>
            </nav>
        </div>
    );
}
