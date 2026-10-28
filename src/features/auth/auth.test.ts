import {describe, expect, it} from "vitest";
import {clearSession, currentSessionToken, loadSession, saveSession} from "./session";
import {passwordStrength, validateEmail, validateName, validatePassword} from "./validation";

const AUTH = {
    token: "jwt",
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    user: {id: "u1", name: "Ana", lastName: "Demo", email: "ana@example.com", role: "USER", createdAt: ""},
};

describe("sesión", () => {
    it("con «mantener sesión» persiste en localStorage", () => {
        saveSession(AUTH, true);
        expect(window.localStorage.getItem("smartpot.session")).toContain("jwt");
        expect(currentSessionToken()).toBe("jwt");
        expect(loadSession()?.user.email).toBe("ana@example.com");
    });

    it("sin «mantener sesión» usa sessionStorage", () => {
        saveSession(AUTH, false);
        expect(window.localStorage.getItem("smartpot.session")).toBeNull();
        expect(window.sessionStorage.getItem("smartpot.session")).toContain("jwt");
    });

    it("descarta sesiones vencidas y limpia el token", () => {
        saveSession({...AUTH, expiresAt: new Date(Date.now() - 1000).toISOString()}, true);
        clearSession();
        expect(loadSession()).toBeNull();
        expect(currentSessionToken()).toBeNull();
    });
});

describe("validaciones", () => {
    it("replica la política de contraseñas de la API", () => {
        expect(validatePassword("corta1A")).toBeDefined();
        expect(validatePassword("sinmayuscula1")).toBeDefined();
        expect(validatePassword("Tomate2026")).toBeUndefined();
    });

    it("valida correo y nombres", () => {
        expect(validateEmail("ana@")).toBe("El correo no es válido");
        expect(validateEmail("ana@example.com")).toBeUndefined();
        expect(validateName("María José", "nombre", 40)).toBeUndefined();
        expect(validateName("R2D2", "nombre", 40)).toMatch(/solo puede tener letras/);
    });

    it("mide la fuerza de la contraseña", () => {
        expect(passwordStrength("abc").label).toBe("Muy débil");
        expect(passwordStrength("Tomate2026!Seguro").score).toBeGreaterThanOrEqual(4);
    });
});
