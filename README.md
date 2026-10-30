# SmartPot-Web-Solid

## Estado del Proyecto

[![Bun CI](https://github.com/SmartPotTech/SmartPot-Web-Solid/actions/workflows/bun.yml/badge.svg)](https://github.com/SmartPotTech/SmartPot-Web-Solid/actions/workflows/bun.yml)
[![CodeQL Advanced](https://github.com/SmartPotTech/SmartPot-Web-Solid/actions/workflows/codeql.yml/badge.svg)](https://github.com/SmartPotTech/SmartPot-Web-Solid/actions/workflows/codeql.yml)
[![Publish Docker Images](https://github.com/SmartPotTech/SmartPot-Web-Solid/actions/workflows/packaging.yml/badge.svg)](https://github.com/SmartPotTech/SmartPot-Web-Solid/actions/workflows/packaging.yml)

## Descripción

SmartPot-Web-Solid es la nueva generación de la **aplicación web progresiva (PWA)** de SmartPot, reescrita sobre
**SolidJS**, **TypeScript** y **Vite** para reemplazar la capa de React con reactividad de grano fino sin Virtual DOM,
gráficos SVG nativos sin bibliotecas externas pesadas, revalidación condicional por `ETag` (`If-None-Match` / `304 Not
Modified`) y sincronización instantánea de sesión entre pestañas.

Conserva **idéntica** toda la experiencia funcional y gráfica de la aplicación publicada en
[smartpot.app](https://smartpot.app), se instala en Android, iOS y escritorio, y permite:

- Ver todos los cultivos juntos en el **panel general**: salud de cada uno, comparación de una variable entre cultivos (
  6 h, 24 h o 7 días), tabla con la última lectura frente al rango ideal y el análisis del asistente sobre toda la
  cuenta (problemas compartidos del entorno, grupos con condiciones parecidas y acciones en bloque).
- Usar el **control general** para activar el modo automático o enviar la misma orden (regar, ventilar, luz) a varios
  cultivos a la vez.
- Revisar las **acciones**: las que sugiere el asistente para varios cultivos y el historial de todas las órdenes,
  filtrado por estado y origen.
- Crear cultivos **reales** (un ESP32 con el firmware, físico o simulado en Wokwi, con su guía de conexión) o
  **virtuales** (los simula SmartPot), de seis especies y cuatro formas: maceta, tubos NFT, torre vertical o balsa
  flotante, y decir dónde está: bajo techo o al aire libre, cuánto sol recibe y en qué ciudad. El tipo no cambia
  después; el lugar se edita en Ajustes.
- Ver cada cultivo **ilustrado** sobre todas sus secciones: su forma y su especie (lechuga, tomate, fresa…) con el color
  de su salud, en su lugar (una ventana con el cielo de afuera, una malla de media sombra o un árbol) con el clima real
  y cada actuador encendido o apagado. La ilustración no tiene botones: las órdenes se dan en Control. Si no está
  conectado, no se ilustra.
- Ver las lecturas en tiempo real, comparadas con el rango ideal de la especie, e historiales de 6 h, 24 h o 7 días
  exportables a CSV.
- Consultar al **asistente de IA** de cada cultivo: índice de salud y de qué variables depende, diagnóstico,
  conclusiones del sistema experto, predicciones de los modelos, pronóstico de las próximas horas, lo **aprendido de
  cultivos reales** (estado de operación, lectura habitual o no, riego o calor probables en la próxima hora y sustrato
  esperado), el consejo de lugar según la luz que pide la especie y acciones sugeridas.
- Ver en **Aprendizaje** cómo mejora el asistente con cada lectura: calidad de los datos, comparación de modelos con su
  puntaje frente a la línea base, estados típicos de cada especie y detector de lecturas poco habituales.
- Controlar la **simulación** de un cultivo virtual en dos partes, como Dispositivo: arriba el estado con Pausar y
  Reanudar; abajo cómo se simula (clima real del lugar, medidores manuales o el día y la noche de la especie) con
  «Aplicar cambios».
- Vincular **Telegram** en Perfil › Aplicaciones (en gris, con su detalle técnico, si el servidor no lo tiene) y elegir
  en Ajustes qué avisa cada cultivo: al instante o en resúmenes, un resumen diario y los chats con los que se comparte.
- Encender y apagar con un **switch** la bomba, la luz ultravioleta, el ventilador, el humidificador y los
  dosificadores, con su duración y su cuenta regresiva, y activar el **modo automático** del agente.
- Conectar un cultivo real con un `config.py` que ya trae la red, la clave y la CA del broker.
- Recibir alertas del cultivo, del dispositivo y del asistente.

La página de inicio es pública e indexable; la aplicación vive bajo `/app` y no se indexa.

## Mejoras de Arquitectura, Rendimiento y Seguridad frente a la versión en React

- **Reactividad de grano fino sin Virtual DOM (`solid-js`).** Las señales (`createSignal`, `createMemo`, `createEffect`)
  actualizan únicamente los nodos del DOM o atributos SVG que cambian en cada sondeo de telemetría o cuenta regresiva de
  actuadores, sin reconciliar árboles de componentes.
- **Gráficos SVG nativos sin Recharts.** `ReadingsChart` y `MetricComparison` renderizan áreas, bandas de rango ideal,
  ejes, leyendas y *tooltips* interactivos directamente en SVG reactivo, reduciendo el paquete comprimido total de la
  aplicación por debajo de 100 kB gzip.
- **Revalidación condicional `ETag` (`If-None-Match` / `304 Not Modified`).** El cliente HTTP guarda en memoria las
  respuestas `GET` junto con el `ETag` débil emitido por `SmartPot-API-Go` y envía `If-None-Match` en los sondeos
  periódicos; cuando el recurso no cambió, la API responde `304` sin transferir cuerpo y la PWA reutiliza la copia en
  memoria. Cualquier mutación (`POST`, `PUT`, `PATCH`, `DELETE`) o cambio de sesión limpia la caché al instante.
- **Sincronización de sesión entre pestañas.** `AuthProvider` escucha eventos `storage` de `window` y eventos internos de
  sesión para propagar el inicio o cierre de sesión y la actualización del perfil en todas las pestañas abiertas.
- **Contenedor Nginx endurecido.** Añade `Cross-Origin-Resource-Policy: same-origin` y `gzip_vary on` junto a la CSP
  estricta, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` y `Permissions-Policy`.

## Tecnologías

SolidJS 1.9 · `@solidjs/router` · TypeScript 6 · Vite 8 · Tailwind CSS 4 · `lucide-solid` · Vitest ·
`@solidjs/testing-library` · Bun 1.4.

## Estructura del Proyecto

```text
SmartPot-Web-Solid/
├── public/
│   ├── icons/                  # Íconos SVG fuente y PNG de la PWA
│   ├── manifest.webmanifest    # Instalación como app
│   ├── sw.js                   # Service worker: app shell en caché, API siempre en red
│   ├── robots.txt, sitemap.xml # SEO
│   ├── og-image.svg / .png     # Imagen para redes sociales
│   └── config.js               # URL de la API en desarrollo (el contenedor lo reescribe)
├── src/
│   ├── app/                    # Enrutador (@solidjs/router), carga diferida y páginas generales
│   ├── components/             # Marca, layouts y sistema de diseño en SolidJS
│   ├── config/env.ts           # URL de la API en tiempo de ejecución
│   ├── features/
│   │   ├── auth/               # Sesión reactiva sincronizada entre pestañas, ingreso, registro y recuperación
│   │   ├── overview/           # Panel general: ranking, comparativas SVG nativas y análisis de flota de la IA
│   │   ├── control/            # Control general: modo automático y órdenes en bloque
│   │   ├── actions/            # Acciones sugeridas e historial de todos los cultivos
│   │   ├── crops/              # Creación real o virtual, ilustración SVG, resumen, asistente, control, historial, dispositivo, simulación y ajustes
│   │   ├── learning/           # Aprendizaje de la IA: calidad, comparación de modelos, estados y atípicos
│   │   ├── landing/            # Página pública y preguntas frecuentes
│   │   ├── notifications/      # Alertas
│   │   ├── profile/            # Perfil, canales de notificación (Telegram), contraseña y borrado de cuenta
│   │   └── pwa/                # Registro del service worker e instalación
│   ├── hooks/                  # Metadatos por página, recursos con refresco por visibilidad y estado de red
│   ├── lib/                    # Cliente de la API con caché ETag, tipos, catálogos y formato en español
│   ├── styles/index.css        # Paleta SmartPot como tokens de Tailwind
│   └── workers/                # Web Workers para cómputo intensivo de telemetría fuera del hilo principal
├── nginx/                      # Servidor de producción en contenedor: CSP, CORP, caché y configuración
├── scripts/
│   ├── compress-assets.mjs     # Pre-compresión estática de activos (Gzip nivel 9 y Brotli calidad 11)
│   └── generate-icons.mjs      # PNG de la PWA a partir de los SVG
├── server.ts                   # Servidor Bun nativo de alto rendimiento (balanceo SO_REUSEPORT, proxy y spa)
├── bun.lock                    # Árbol de dependencias determinista y versionable de Bun
└── Dockerfile                  # Compilación multi-stage con Bun Alpine y servicio Nginx unprivileged
```

## Identidad Visual

| Token                                | Color                                         | Uso                                                               |
|--------------------------------------|-----------------------------------------------|-------------------------------------------------------------------|
| `leaf-900`                           | `#0B3D2B`                                     | Barra lateral, navegación, encabezados y color del tema de la PWA |
| `leaf-700`                           | `#067A52`                                     | Acciones principales                                              |
| `leaf-500`                           | `#00B074`                                     | Verde de marca                                                    |
| `water-500`                          | `#2D9CDB`                                     | Agua, información y señal del logo                                |
| `sun-500`                            | `#F2B632`                                     | Luz y advertencias                                                |
| `clay-500`                           | `#D9734E`                                     | Maceta de la ilustración y temperatura                            |
| `danger-500`                         | `#D64545`                                     | Errores                                                           |
| `ink` / `muted` / `line` / `surface` | `#17261F` / `#5B6B63` / `#D5E3DC` / `#F2F7F4` | Texto, bordes y superficies                                       |

Tipografías: **Outfit** para títulos e **Inter** para el cuerpo, servidas desde la propia app (sin CDNs).

Las comparativas entre cultivos usan una paleta categórica de 8 colores en orden fijo (tonos de la marca más un violeta
solo para gráficos), validada para daltonismo y contraste entre vecinos. Cada cultivo conserva su color mientras siga en
la comparación, y los gráficos van acompañados de leyenda y de la tabla de últimas lecturas.

## SEO y PWA

- `index.html` trae descripción, palabras clave, URL canónica, Open Graph, Twitter Card y datos estructurados JSON-LD (
  `Organization`, `WebSite`, `SoftwareApplication` y `FAQPage`), además de contenido estático que leen los rastreadores
  sin JavaScript.
- Cada página ajusta su título y `robots`: la landing, el ingreso y el registro se indexan; `/app` no.
- El manifiesto declara íconos normales y adaptables, accesos directos y el color `#0B3D2B`. El botón «Instalar app»
  aparece cuando el navegador lo permite; en iPhone se explica «Compartir → Agregar a inicio».
- El service worker guarda el app shell y los recursos con hash; la API y `/config.js` nunca se guardan en caché.

## Seguridad

- CSP estricta (`script-src 'self'`, `style-src 'self'`, `connect-src` limitado a la API), `X-Frame-Options: DENY`,
  `nosniff`, `Cross-Origin-Resource-Policy: same-origin`, `Referrer-Policy` y `Permissions-Policy` (solo la
  geolocalización del propio sitio, para ubicar un cultivo virtual en modo clima; nunca se envía sin que la persona toque
  «Usar mi ubicación»).
- El token JWT se guarda en `localStorage` solo si el usuario marca «Mantener sesión iniciada»; si no, en
  `sessionStorage`. Un 401 cierra la sesión y sincroniza todas las pestañas abiertas.
- La clave del dispositivo se muestra una sola vez, al crear un cultivo real o al rotarla.

## Guía de Instalación

### Requisitos Previos

- Bun 1.2+ o 1.4+ instalado en el entorno (`curl -fsSL https://bun.sh/install | bash` o `powershell -c "irm bun.sh/install.ps1 | iex"`)
- La API de SmartPot en `http://localhost:8091` (el entorno completo está
  en [SmartPotTech/.github](https://github.com/SmartPotTech/.github))

### Desarrollo

```bash
git clone https://github.com/SmartPotTech/SmartPot-Web-Solid.git
cd SmartPot-Web-Solid
bun install
bun run dev
```

### Servidor Local con Bun

Para levantar el servidor de alto rendimiento con Bun (despacho pre-comprimido, proxy reverso y cabeceras de seguridad):

```bash
bun run build
bun run start
```

### Calidad

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

Las 66 pruebas de Vitest y `@solidjs/testing-library` cubren el cliente HTTP, la revalidación condicional por `ETag`
(`304 Not Modified`) y sus errores en español, la sesión, las validaciones, el ingreso, los componentes del cultivo, el
panel del asistente, lo aprendido y la comparación de modelos, los canales de Telegram, la ilustración del cultivo
(formas, especies, actuadores, clima y conexión), la creación real o virtual, la guía de conexión y los requisitos de
SEO y PWA.

### Imagen Docker

```bash
docker build -t smartpot-web-solid .
docker run --rm -p 5173:8080 -e API_URL=http://localhost:8091 \
  --read-only --tmpfs /tmp --tmpfs /etc/nginx/conf.d:uid=101,gid=101 smartpot-web-solid
```

`API_URL` se inyecta al arrancar en `/config.js` y en la CSP, así la misma imagen sirve para cualquier entorno. Imagen
publicada: `ghcr.io/smartpottech/smartpot-web-solid:latest`.

### Íconos

Tras cambiar los SVG de `public/icons` o `public/og-image.svg`:

```bash
bun run icons
```

## Documentación

Su documentación propia está en [`docs/`](docs/SmartPot_Web_Solid_Documentation.md) (también en
[DOCX](docs/SmartPot_Web_Solid_Documentation.docx) y [PDF](docs/SmartPot_Web_Solid_Documentation.pdf)), con sus diagramas
en [`docs/diagrams`](docs/diagrams): el general del componente y los de creación de un cultivo, su ilustración reactiva y
sesión con caché `ETag`. La [documentación de migración](https://github.com/SmartPotTech/.github/blob/main/docs/SmartPot_Migration.md)
explica cómo convive dentro del entorno `demo-beta` junto a `SmartPot-API-Go`, `SmartPot-DB-Postgre`,
`SmartPot-Cache-Valkey` y `SmartPot-Broker-EMQX`.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
