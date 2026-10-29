import tailwindcss from "@tailwindcss/vite";
import solidPlugin from "vite-plugin-solid";
import {defineConfig} from "vitest/config";

export default defineConfig({
    plugins: [solidPlugin({hot: !process.env.VITEST}), tailwindcss()],
    build: {
        target: "es2022",
        sourcemap: false,
        minify: "esbuild",
        cssMinify: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules/solid-js") || id.includes("node_modules/@solidjs")) {
                        return "solid-core";
                    }
                    if (id.includes("node_modules/lucide-solid")) {
                        return "lucide-icons";
                    }
                    if (id.includes("node_modules/@fontsource")) {
                        return "fonts";
                    }
                },
            },
        },
    },
    resolve: {
        conditions: ["development", "browser"],
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./src/test/setup.ts"],
        css: false,
    },
});
