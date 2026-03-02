import { create } from 'zustand';

interface LevelUpRewards {
  hpGained: number;
  attackGained: number;
  defenseGained: number;
}

interface CompletionData {
  missionId: string;
  xpGained: number;
  goldGained: number;
  wasCrit: boolean;
  comboBonus: number;
  leveledUp: boolean;
  newLevel?: number;
  levelUpRewards?: LevelUpRewards;
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface MissionStore {
  lastCompletion: CompletionData | null;
  setLastCompletion: (data: CompletionData) => void;
  clearLastCompletion: () => void;

  selectedDate: string;
  setSelectedDate: (date: string) => void;
  goToToday: () => void;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  lastCompletion: null,
  setLastCompletion: (data) => set({ lastCompletion: data }),
  clearLastCompletion: () => set({ lastCompletion: null }),

  selectedDate: getToday(),
  setSelectedDate: (date) => set({ selectedDate: date }),
  goToToday: () => set({ selectedDate: getToday() }),
  goToPreviousDay: () => set({ selectedDate: addDays(get().selectedDate, -1) }),
  goToNextDay: () => set({ selectedDate: addDays(get().selectedDate, 1) }),
}));
