import { create } from 'zustand';

export type OverlayRoute =
  | '/command-deck'
  | '/tavern'
  | '/training-grounds'
  | '/forge'
  | '/rift-gate'
  | '/daily-recap'
  | '/settings'
  | null;

interface VillageStore {
  activeOverlay: OverlayRoute;
  cameraTarget: [number, number, number] | null;
  is3DMode: boolean;
  combatActive: boolean;
  openOverlay: (route: OverlayRoute, target?: [number, number, number]) => void;
  closeOverlay: () => void;
  setIs3DMode: (value: boolean) => void;
  setCombatActive: (value: boolean) => void;
}

export const useVillageStore = create<VillageStore>((set) => ({
  activeOverlay: null,
  cameraTarget: null,
  is3DMode: true,
  combatActive: false,
  openOverlay: (route, target) =>
    set({ activeOverlay: route, cameraTarget: target ?? null }),
  closeOverlay: () => set({ activeOverlay: null, cameraTarget: null }),
  setIs3DMode: (value) => set({ is3DMode: value }),
  setCombatActive: (value) => set({ combatActive: value }),
}));
