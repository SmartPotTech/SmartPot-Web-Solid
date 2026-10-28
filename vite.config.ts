import tailwindcss from "@tailwindcss/vite";
import solidPlugin from "vite-plugin-solid";
import {defineConfig} from "vitest/config";

export default defineConfig({
    plugins: [solidPlugin({hot: !process.env.VITEST}), tailwindcss()],
    build: {
        target: "es2022",
        sourcemap: false,
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
