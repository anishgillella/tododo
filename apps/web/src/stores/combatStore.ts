import { create } from 'zustand';

interface CombatantStats {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
}

interface CombatTurnResult {
  actor: 'player' | 'enemy';
  action: string;
  damage?: number;
  healing?: number;
  isCrit?: boolean;
  isStunned?: boolean;
  isDefending?: boolean;
  message: string;
}

interface CombatState {
  sessionId: string;
  turn: number;
  phase: 'player_turn' | 'enemy_turn' | 'victory' | 'defeat' | 'fled';
  player: CombatantStats;
  enemy: CombatantStats & { creatureId: string };
  playerDefending: boolean;
  enemyDefending: boolean;
  playerStunnedTurns: number;
  enemyStunnedTurns: number;
  cooldowns: Record<string, number>;
  enemyCooldowns: Record<string, number>;
  turnLog: CombatTurnResult[];
  rewards?: { xp: number; gold: number; loot?: string };
}

interface CombatStore {
  activeSession: CombatState | null;
  combatType: 'encounter' | 'boss' | null;
  startCombat: (state: CombatState, type: 'encounter' | 'boss') => void;
  updateState: (state: CombatState) => void;
  endCombat: () => void;
}

export const useCombatStore = create<CombatStore>((set) => ({
  activeSession: null,
  combatType: null,
  startCombat: (state, type) => set({ activeSession: state, combatType: type }),
  updateState: (state) => set({ activeSession: state }),
  endCombat: () => set({ activeSession: null, combatType: null }),
}));
