import {createSignal} from "solid-js";
import {CROP_COLORS, MAX_COMPARED} from "../../lib/catalog";
import type {Crop} from "../../lib/api/types";

/**
 * Cultivos incluidos en la comparación, cada uno con un color que conserva mientras siga
 * seleccionado: quitar o agregar otro no repinta a los demás.
 */
export function useComparedCrops(cropsInput: Crop[] | (() => Crop[])) {
    const getCrops = () => (typeof cropsInput === "function" ? cropsInput() : cropsInput);
    const [slots, setSlots] = createSignal<Record<string, number> | null>(null);
    const current = () =>
        slots() ?? Object.fromEntries(getCrops().slice(0, MAX_COMPARED).map((crop, index) => [crop.id, index]));

    function toggle(cropId: string) {
        const next = {...current()};
        if (cropId in next) {
            delete next[cropId];
        } else {
            const used = new Set(Object.values(next));
            const free = CROP_COLORS.findIndex((_, index) => !used.has(index));
            if (free < 0) return;
            next[cropId] = free;
        }
        setSlots(next);
    }

    return {
        get selected() {
            const cur = current();
            return getCrops().filter((crop) => crop.id in cur);
        },
        colorOf: (cropId: string) => {
            const slot = current()[cropId];
            return slot === undefined ? undefined : CROP_COLORS[slot];
        },
        get isFull() {
            return Object.keys(current()).length >= MAX_COMPARED;
        },
        toggle,
    };
}
