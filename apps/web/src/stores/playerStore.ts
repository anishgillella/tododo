import { create } from 'zustand';

interface PlayerStore {
  position: [number, number, number];
  targetPosition: [number, number, number] | null;
  rotation: number;
  isMoving: boolean;
  nearbyBuilding: string | null;
  nearbyNpc: string | null;
  setPosition: (pos: [number, number, number]) => void;
  setTargetPosition: (pos: [number, number, number] | null) => void;
  setRotation: (r: number) => void;
  setIsMoving: (v: boolean) => void;
  setNearbyBuilding: (name: string | null) => void;
  setNearbyNpc: (name: string | null) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  position: [0, 0, 3],
  targetPosition: null,
  rotation: 0,
  isMoving: false,
  nearbyBuilding: null,
  nearbyNpc: null,
  setPosition: (position) => set({ position }),
  setTargetPosition: (targetPosition) => set({ targetPosition }),
  setRotation: (rotation) => set({ rotation }),
  setIsMoving: (isMoving) => set({ isMoving }),
  setNearbyBuilding: (nearbyBuilding) => set({ nearbyBuilding }),
  setNearbyNpc: (nearbyNpc) => set({ nearbyNpc }),
}));
