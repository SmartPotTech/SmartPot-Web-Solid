import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {ignores: ["dist", "coverage", "public/sw.js"]},
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2022,
            globals: globals.browser,
        },
    },
    {
        files: ["scripts/**/*.mjs", "server.ts"],
        languageOptions: {
            globals: {
                ...globals.node,
                Bun: "readonly",
            },
        },
    },
);
