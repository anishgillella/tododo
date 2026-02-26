// === Enums ===
export type DifficultyMode = 'explorer' | 'drifter' | 'ironclad';
export type MissionStatus = 'active' | 'completed' | 'failed' | 'carried_over';
export type MissionDifficulty = 1 | 2 | 3 | 4 | 5;
export type ItemType = 'consumable' | 'equipment' | 'cosmetic';
export type StreakTier = 'none' | 'spark' | 'flame' | 'blaze' | 'inferno' | 'eternal_fire';
export type NpcCharacter = 'axiom' | 'kael' | 'mira' | 'hollow' | 'drifter';
export type HollowStage = 'dormant' | 'whispers' | 'presence' | 'confrontation' | 'forced';
export type GameEventType =
  | 'mission_complete'
  | 'mission_fail'
  | 'level_up'
  | 'streak_change'
  | 'hollow_encounter'
  | 'boss_fight'
  | 'item_acquired'
  | 'skill_purchased'
  | 'day_end';

// === Category ===
export interface Category {
  id: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CreateCategoryInput {
  name: string;
  emoji?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  emoji?: string;
  color?: string;
  sortOrder?: number;
}

// === Core Models ===
export interface User {
  id: string;
  username: string;
  openrouterApiKey?: string;
  difficultyMode: DifficultyMode;
  createdAt: string;
}

export interface Agent {
  id: string;
  userId: string;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  reputation: number;
  gold: number;
  // Personality traits (0-1 scale)
  discipline: number;
  courage: number;
  wisdom: number;
  charisma: number;
  // Streak
  streakDays: number;
  streakTier: StreakTier;
  streakShields: number;
  lastCompletionDate?: string;
  // Debt / Hollow
  debt: number;
  consecutiveFailDays: number;
  // Combos
  comboCount: number;
  overdrivUntil?: string;
}

export interface Mission {
  id: string;
  userId: string;
  title: string;
  description?: string;
  difficulty: MissionDifficulty;
  status: MissionStatus;
  xpReward: number;
  goldReward: number;
  narrativeFlavor?: string;
  categoryId?: string;
  isRecurring: boolean;
  recurringSourceId?: string;
  carryOverCount: number;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
}

export interface DailyRecap {
  id: string;
  userId: string;
  date: string;
  missionsCompleted: number;
  missionsFailed: number;
  xpEarned: number;
  goldEarned: number;
  hpChange: number;
  narrative?: string;
  axiomCommentary?: string;
  kaelReaction?: string;
  statsSnapshot: string; // JSON string of agent stats
  createdAt: string;
}

export interface DialogueEntry {
  id: string;
  userId: string;
  character: NpcCharacter;
  role: 'user' | 'assistant';
  content: string;
  gameContext?: string; // JSON snapshot
  createdAt: string;
}

export interface AgentSkill {
  id: string;
  agentId: string;
  skillId: string;
  name: string;
  category: 'discipline' | 'courage' | 'wisdom' | 'luck';
  level: number;
  effectJson: string;
  purchasedAt: string;
}

export interface InventoryItem {
  id: string;
  agentId: string;
  itemId: string;
  name: string;
  type: ItemType;
  quantity: number;
  effectJson?: string;
}

export interface GameEvent {
  id: string;
  userId: string;
  type: GameEventType;
  data: string; // JSON
  createdAt: string;
}

// === API Types ===
export interface CreateMissionInput {
  title: string;
  description?: string;
  difficulty: MissionDifficulty;
  categoryId?: string;
  isRecurring?: boolean;
  dueDate?: string;
}

export interface UpdateMissionInput {
  title?: string;
  description?: string;
  difficulty?: MissionDifficulty;
  status?: MissionStatus;
  categoryId?: string;
  dueDate?: string;
}

export interface CompleteMissionResult {
  mission: Mission;
  xpGained: number;
  goldGained: number;
  wasCrit: boolean;
  lootDrop?: string;
  comboBonus: number;
  leveledUp: boolean;
  newLevel?: number;
  streakUpdate?: {
    days: number;
    tier: StreakTier;
    multiplier: number;
  };
}

export interface GameState {
  agent: Agent;
  activeMissions: Mission[];
  hollowStage: HollowStage;
  isJackpotDay: boolean;
  dailyStats: {
    completed: number;
    failed: number;
    total: number;
  };
}

export interface DialogueRequest {
  character: NpcCharacter;
  message: string;
}

export interface DialogueResponse {
  character: NpcCharacter;
  message: string;
  mood?: string;
}

export interface BossFightResult {
  won: boolean;
  narrative: string;
  hpChange: number;
  debtChange: number;
  rewards?: {
    xp: number;
    gold: number;
    item?: string;
  };
}
