import type { DifficultyMode, MissionDifficulty, StreakTier } from './types';

// === Default Categories ===
export const DEFAULT_CATEGORIES: {
  name: string;
  emoji: string;
  color: string;
  sortOrder: number;
}[] = [
  { name: 'Work', emoji: '💼', color: '#3B82F6', sortOrder: 0 },
  { name: 'Health', emoji: '💪', color: '#10B981', sortOrder: 1 },
  { name: 'Personal', emoji: '🏠', color: '#8B5CF6', sortOrder: 2 },
  { name: 'Learning', emoji: '📚', color: '#F59E0B', sortOrder: 3 },
  { name: 'Creative', emoji: '🎨', color: '#EC4899', sortOrder: 4 },
  { name: 'Errands', emoji: '🏃', color: '#6366F1', sortOrder: 5 },
];

// === Difficulty Mode Multipliers ===
export const DIFFICULTY_MODES: Record<DifficultyMode, {
  label: string;
  hpDamageMultiplier: number;
  debtRateMultiplier: number;
  streakDecayTarget: number; // percentage streak decays to on break
  description: string;
}> = {
  explorer: {
    label: 'Explorer',
    hpDamageMultiplier: 0.5,
    debtRateMultiplier: 0.5,
    streakDecayTarget: 0.5,
    description: 'Casual, forgiving — for busy people',
  },
  drifter: {
    label: 'Drifter',
    hpDamageMultiplier: 1.0,
    debtRateMultiplier: 1.0,
    streakDecayTarget: 0.75,
    description: 'Balanced — the default experience',
  },
  ironclad: {
    label: 'Ironclad',
    hpDamageMultiplier: 1.5,
    debtRateMultiplier: 1.5,
    streakDecayTarget: 0,
    description: 'Hardcore — streaks reset on break',
  },
};

// === Task Difficulty ===
export const MISSION_DIFFICULTIES: Record<MissionDifficulty, {
  label: string;
  example: string;
  baseXp: number;
  baseGoldMin: number;
  baseGoldMax: number;
  timeEstimate: string;
}> = {
  1: { label: 'Quick', example: 'Reply to email', baseXp: 15, baseGoldMin: 5, baseGoldMax: 8, timeEstimate: '< 10 min' },
  2: { label: 'Standard', example: 'Grocery shopping', baseXp: 30, baseGoldMin: 10, baseGoldMax: 16, timeEstimate: '10-30 min' },
  3: { label: 'Focused', example: 'Write a report', baseXp: 45, baseGoldMin: 15, baseGoldMax: 24, timeEstimate: '30-90 min' },
  4: { label: 'Hard', example: 'Major milestone', baseXp: 60, baseGoldMin: 20, baseGoldMax: 32, timeEstimate: '1-3 hours' },
  5: { label: 'Epic', example: 'Full day commitment', baseXp: 75, baseGoldMin: 25, baseGoldMax: 40, timeEstimate: 'Half day+' },
};

// === Streak Tiers ===
export const STREAK_TIERS: Record<StreakTier, {
  label: string;
  minDays: number;
  xpMultiplier: number;
}> = {
  none: { label: 'No Streak', minDays: 0, xpMultiplier: 1.0 },
  spark: { label: 'Spark', minDays: 1, xpMultiplier: 1.1 },
  flame: { label: 'Flame', minDays: 3, xpMultiplier: 1.2 },
  blaze: { label: 'Blaze', minDays: 7, xpMultiplier: 1.3 },
  inferno: { label: 'Inferno', minDays: 14, xpMultiplier: 1.5 },
  eternal_fire: { label: 'Eternal Fire', minDays: 30, xpMultiplier: 1.75 },
};

// === Combo Bonuses ===
export const COMBO_BONUSES: Record<number, number> = {
  2: 5,
  3: 15,
  4: 30,
  5: 50, // 5+ also triggers Overdrive (2x gold for 1 hour)
};

// === Game Constants ===
export const MAX_LEVEL = 100;
export const BASE_HP = 100;
export const BASE_ENERGY = 100;
export const CRIT_CHANCE = 0.05; // 5%
export const CRIT_MULTIPLIER = 2;
export const LOOT_DROP_CHANCE = 0.08; // 8%
export const JACKPOT_CHANCE = 0.05; // 5% daily chance for 3x gold
export const JACKPOT_GOLD_MULTIPLIER = 3;
export const STREAK_THRESHOLD = 0.8; // 80% completion to maintain streak
export const MAX_STREAK_SHIELDS = 3;
export const OVERDRIVE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// === Hollow Escalation ===
export const HOLLOW_STAGES = {
  dormant: { minDebt: 0, maxDebt: 0 },
  whispers: { minDebt: 1, maxDebt: 3 },
  presence: { minDebt: 4, maxDebt: 6 },
  confrontation: { minDebt: 7, maxDebt: 9 },
  forced: { minDebt: 10, maxDebt: Infinity },
};

// === Personality Trait Shifts ===
export const TRAIT_SHIFT_COMPLETE = 0.02; // +discipline, +courage on task complete
export const TRAIT_SHIFT_FAIL = -0.01; // -discipline on task fail
export const TRAIT_MIN = 0;
export const TRAIT_MAX = 1;

// === Boss Fight ===
export const BOSS_WIN_CHANCE_MIN = 0.4;
export const BOSS_WIN_CHANCE_MAX = 0.8;
export const BOSS_DEFEAT_HP_LOSS = 0.3; // 30% of max HP
export const BOSS_VICTORY_DEBT_REDUCTION = 0.5; // halves debt
