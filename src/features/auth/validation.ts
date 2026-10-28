const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PERSON_NAME = /^\p{L}[\p{L} '-]*$/u;

export function validateEmail(value: string): string | undefined {
    if (!value.trim()) return "El correo es obligatorio";
    if (!EMAIL.test(value.trim())) return "El correo no es válido";
    return undefined;
}

export function validatePassword(value: string): string | undefined {
    if (value.length < 8) return "Usa al menos 8 caracteres";
    if (new TextEncoder().encode(value).length > 72) return "La contraseña es demasiado larga";
    if (!/[A-ZÁÉÍÓÚÑ]/.test(value) || !/[a-záéíóúñ]/.test(value) || !/\d/.test(value)) {
        return "Incluye una mayúscula, una minúscula y un número";
    }
    return undefined;
}

export function validateName(value: string, label: string, max: number): string | undefined {
    const trimmed = value.trim();
    if (trimmed.length < 2) return `El ${label} debe tener al menos 2 caracteres`;
    if (trimmed.length > max) return `El ${label} puede tener hasta ${max} caracteres`;
    if (!PERSON_NAME.test(trimmed)) return `El ${label} solo puede tener letras y espacios`;
    return undefined;
}

export function passwordStrength(value: string): { score: number; label: string } {
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    const labels = ["Muy débil", "Débil", "Aceptable", "Buena", "Fuerte", "Muy fuerte"];
    return {score, label: labels[score] ?? "Muy fuerte"};
}
