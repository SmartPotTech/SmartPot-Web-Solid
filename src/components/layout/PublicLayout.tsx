import {A} from "@solidjs/router";
import {GitFork} from "lucide-solid";
import {type JSX, Show} from "solid-js";
import {useAuth} from "../../features/auth/AuthContext";
import {Logo} from "../brand/Logo";

export function PublicLayout(props: { children?: JSX.Element }) {
    const auth = useAuth();
    return (
        <div class="flex min-h-dvh flex-col">
            <header class="sticky top-0 z-30 border-b border-line/70 bg-white/85 backdrop-blur">
                <nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4" aria-label="Principal">
                    <A href="/" aria-label="SmartPot, inicio"><Logo size={34}/></A>
                    <div class="flex items-center gap-2 text-sm font-semibold">
                        <a href="/#funciones"
                           class="hidden rounded-lg px-3 py-2 text-muted hover:text-leaf-800 md:block">Funciones</a>
                        <a href="/#ia" class="hidden rounded-lg px-3 py-2 text-muted hover:text-leaf-800 md:block">Inteligencia
                            artificial</a>
                        <a href="/#preguntas"
                           class="hidden rounded-lg px-3 py-2 text-muted hover:text-leaf-800 md:block">Preguntas</a>
                        <Show when={auth.token} fallback={
                            <>
                                <A href="/login"
                                   class="rounded-xl px-3 py-2 text-leaf-800 hover:bg-leaf-50">Ingresar</A>
                                <A href="/register"
                                   class="rounded-xl bg-leaf-700 px-4 py-2 text-white hover:bg-leaf-800">Crear
                                    cuenta</A>
                            </>
                        }>
                            <A href="/app" class="rounded-xl bg-leaf-700 px-4 py-2 text-white hover:bg-leaf-800">Ir
                                a mi panel</A>
                        </Show>
                    </div>
                </nav>
            </header>
            <main class="flex-1">
                {props.children}
            </main>
            <footer class="border-t border-line bg-leaf-950 text-leaf-100">
                <div class="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
                    <div>
                        <Logo size={30} inverse/>
                        <p class="mt-3 text-sm text-leaf-300/80">
                            Monitoreo y automatización de cultivos hidropónicos con IoT e inteligencia artificial.
                        </p>
                    </div>
                    <div class="text-sm">
                        <p class="font-semibold text-white">Producto</p>
                        <ul class="mt-2 space-y-1.5 text-leaf-300/80">
                            <li><a href="/#funciones" class="hover:text-white">Funciones</a></li>
                            <li><a href="/#como-funciona" class="hover:text-white">Cómo funciona</a></li>
                            <li><A href="/register" class="hover:text-white">Crear cuenta</A></li>
                        </ul>
                    </div>
                    <div class="text-sm">
                        <p class="font-semibold text-white">Proyecto abierto</p>
                        <a href="https://github.com/SmartPotTech" target="_blank" rel="noopener noreferrer"
                           class="mt-2 inline-flex items-center gap-2 text-leaf-300/80 hover:text-white">
                            <GitFork size={16}/> SmartPotTech en GitHub
                        </a>
                        <p class="mt-2 text-leaf-300/60">Licencia MIT · Hecho en Colombia</p>
                    </div>
                </div>
                <p class="border-t border-white/10 py-4 text-center text-xs text-leaf-300/60">
                    © {new Date().getFullYear()} SmartPot Tech
                </p>
            </footer>
        </div>
    );
}
