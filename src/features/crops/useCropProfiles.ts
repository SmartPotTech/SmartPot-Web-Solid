import {createSignal, onCleanup, onMount} from "solid-js";
import {cropApi} from "../../lib/api/services";
import type {CropProfile, CropType} from "../../lib/api/types";

let cache: Promise<CropProfile[]> | null = null;

/** Los perfiles casi nunca cambian: se piden una vez por sesión y se comparten. */
export function useCropProfiles(): Partial<Record<CropType, CropProfile>> {
    const [profiles, setProfiles] = createSignal<Partial<Record<CropType, CropProfile>>>({});

    onMount(() => {
        let active = true;
        cache ??= cropApi.profiles().catch((error) => {
            cache = null;
            throw error;
        });
        cache
            .then((list) => {
                if (active) setProfiles(Object.fromEntries(list.map((profile) => [profile.type, profile])));
            })
            .catch(() => undefined);
        onCleanup(() => {
            active = false;
        });
    });

    return new Proxy({} as Partial<Record<CropType, CropProfile>>, {
        get(_, prop: string) {
            return profiles()[prop as CropType];
        },
        ownKeys() {
            return Reflect.ownKeys(profiles());
        },
        getOwnPropertyDescriptor(_, prop: string) {
            const current = profiles();
            if (prop in current) {
                return {configurable: true, enumerable: true, value: current[prop as CropType]};
            }
            return undefined;
        },
    });
}
