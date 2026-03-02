import { create } from 'zustand';

export type OverlayRoute =
  | '/command-deck'
  | '/tavern'
  | '/training-grounds'
  | '/forge'
  | '/rift-gate'
  | '/daily-recap'
  | '/bestiary'
  | '/achievements'
  | '/settings'
  | null;

interface VillageStore {
  activeOverlay: OverlayRoute;
  cameraTarget: [number, number, number] | null;
  is3DMode: boolean;
  combatActive: boolean;
  showHowToPlay: boolean;
  currentBuildingColor: string | null;
  openOverlay: (route: OverlayRoute, target?: [number, number, number]) => void;
  closeOverlay: () => void;
  setIs3DMode: (value: boolean) => void;
  setCombatActive: (value: boolean) => void;
  setShowHowToPlay: (value: boolean) => void;
  setCurrentBuildingColor: (color: string | null) => void;
}

export const useVillageStore = create<VillageStore>((set) => ({
  activeOverlay: null,
  cameraTarget: null,
  is3DMode: true,
  combatActive: false,
  showHowToPlay: false,
  currentBuildingColor: null,
  openOverlay: (route, target) =>
    set({ activeOverlay: route, cameraTarget: target ?? null }),
  closeOverlay: () => set({ activeOverlay: null, cameraTarget: null, currentBuildingColor: null }),
  setIs3DMode: (value) => set({ is3DMode: value }),
  setCombatActive: (value) => set({ combatActive: value }),
  setShowHowToPlay: (value) => set({ showHowToPlay: value }),
  setCurrentBuildingColor: (color) => set({ currentBuildingColor: color }),
}));
