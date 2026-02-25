import { create } from 'zustand';

interface CompletionData {
  missionId: string;
  xpGained: number;
  goldGained: number;
  wasCrit: boolean;
  comboBonus: number;
  leveledUp: boolean;
  newLevel?: number;
}

interface MissionStore {
  lastCompletion: CompletionData | null;
  setLastCompletion: (data: CompletionData) => void;
  clearLastCompletion: () => void;
}

export const useMissionStore = create<MissionStore>((set) => ({
  lastCompletion: null,
  setLastCompletion: (data) => set({ lastCompletion: data }),
  clearLastCompletion: () => set({ lastCompletion: null }),
}));
