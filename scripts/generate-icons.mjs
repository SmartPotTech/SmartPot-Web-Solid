// Genera los PNG de la PWA y la imagen para redes a partir de los SVG de public/.
import {readFileSync, writeFileSync} from "node:fs";
import {Resvg} from "@resvg/resvg-js";

const targets = [
    ["public/icons/app-icon.svg", "public/icons/icon-192.png", 192],
    ["public/icons/app-icon.svg", "public/icons/icon-512.png", 512],
    ["public/icons/app-icon.svg", "public/icons/favicon-32.png", 32],
    ["public/icons/app-icon-maskable.svg", "public/icons/icon-maskable-192.png", 192],
    ["public/icons/app-icon-maskable.svg", "public/icons/icon-maskable-512.png", 512],
    ["public/icons/app-icon-maskable.svg", "public/icons/apple-touch-icon.png", 180],
    ["public/og-image.svg", "public/og-image.png", 1200],
];

for (const [source, target, width] of targets) {
    const resvg = new Resvg(readFileSync(source), {
        fitTo: {mode: "width", value: width},
        font: {loadSystemFonts: true, defaultFontFamily: "Segoe UI"},
    });
    writeFileSync(target, resvg.render().asPng());
    console.log(`✔ ${target} (${width}px)`);
}
