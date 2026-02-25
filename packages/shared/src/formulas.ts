import {
  MISSION_DIFFICULTIES,
  STREAK_TIERS,
  COMBO_BONUSES,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  LOOT_DROP_CHANCE,
  JACKPOT_GOLD_MULTIPLIER,
  HOLLOW_STAGES,
  BOSS_WIN_CHANCE_MIN,
  BOSS_WIN_CHANCE_MAX,
  BOSS_DEFEAT_HP_LOSS,
  BOSS_VICTORY_DEBT_REDUCTION,
  STREAK_THRESHOLD,
  MAX_LEVEL,
} from './constants';
import type { MissionDifficulty, StreakTier, HollowStage, DifficultyMode } from './types';
import { DIFFICULTY_MODES } from './constants';

/** XP required to reach a given level: 50 * 1.12^(level-1) */
export function xpForLevel(level: number): number {
  return Math.floor(50 * Math.pow(1.12, level - 1));
}

/** Get the streak tier for a given number of streak days */
export function getStreakTier(days: number): StreakTier {
  if (days >= 30) return 'eternal_fire';
  if (days >= 14) return 'inferno';
  if (days >= 7) return 'blaze';
  if (days >= 3) return 'flame';
  if (days >= 1) return 'spark';
  return 'none';
}

/** Get streak XP multiplier */
export function getStreakMultiplier(tier: StreakTier): number {
  return STREAK_TIERS[tier].xpMultiplier;
}

/** Calculate mission XP reward */
export function calculateMissionXp(
  difficulty: MissionDifficulty,
  streakTier: StreakTier,
  skillBonus: number = 0,
): { xp: number; wasCrit: boolean } {
  const base = MISSION_DIFFICULTIES[difficulty].baseXp;
  const streakMult = getStreakMultiplier(streakTier);
  const skillMult = 1 + skillBonus;
  const wasCrit = Math.random() < CRIT_CHANCE;
  const critMult = wasCrit ? CRIT_MULTIPLIER : 1;
  const xp = Math.floor(base * streakMult * skillMult * critMult);
  return { xp, wasCrit };
}

/** Calculate mission gold reward */
export function calculateMissionGold(
  difficulty: MissionDifficulty,
  isJackpotDay: boolean,
  isOverdrive: boolean,
): number {
  const info = MISSION_DIFFICULTIES[difficulty];
  const base = info.baseGoldMin + Math.floor(Math.random() * (info.baseGoldMax - info.baseGoldMin + 1));
  let gold = base;
  if (isJackpotDay) gold *= JACKPOT_GOLD_MULTIPLIER;
  if (isOverdrive) gold *= 2;
  return Math.floor(gold);
}

/** Check if loot drops */
export function rollLootDrop(): boolean {
  return Math.random() < LOOT_DROP_CHANCE;
}

/** Get combo bonus XP for consecutive completions */
export function getComboBonus(comboCount: number): number {
  if (comboCount >= 5) return COMBO_BONUSES[5];
  return COMBO_BONUSES[comboCount] ?? 0;
}

/** Calculate failure damage */
export function calculateFailureDamage(
  difficulty: MissionDifficulty,
  carryOverCount: number,
  mode: DifficultyMode,
): number {
  const modeMult = DIFFICULTY_MODES[mode].hpDamageMultiplier;
  return Math.floor((difficulty * 5 + carryOverCount * 3) * modeMult);
}

/** Calculate The Hollow's strength */
export function calculateHollowStrength(debt: number, consecutiveFailDays: number): number {
  return debt * 10 * (1 + consecutiveFailDays * 0.2);
}

/** Get Hollow stage from debt level */
export function getHollowStage(debt: number): HollowStage {
  if (debt >= 10) return 'forced';
  if (debt >= 7) return 'confrontation';
  if (debt >= 4) return 'presence';
  if (debt >= 1) return 'whispers';
  return 'dormant';
}

/** Calculate boss fight win chance based on agent power vs hollow power */
export function calculateBossFightWinChance(
  agentLevel: number,
  agentHp: number,
  maxHp: number,
  hollowStrength: number,
): number {
  const agentPower = agentLevel * 10 + (agentHp / maxHp) * 50;
  const ratio = agentPower / (agentPower + hollowStrength);
  return Math.min(BOSS_WIN_CHANCE_MAX, Math.max(BOSS_WIN_CHANCE_MIN, ratio));
}

/** Run a boss fight — returns win/loss and stat changes */
export function resolveBossFight(
  agentLevel: number,
  agentHp: number,
  maxHp: number,
  debt: number,
  consecutiveFailDays: number,
): { won: boolean; hpChange: number; debtChange: number } {
  const hollowStrength = calculateHollowStrength(debt, consecutiveFailDays);
  const winChance = calculateBossFightWinChance(agentLevel, agentHp, maxHp, hollowStrength);
  const won = Math.random() < winChance;

  if (won) {
    const hpRestore = Math.floor(maxHp * 0.2);
    const debtReduction = -Math.ceil(debt * BOSS_VICTORY_DEBT_REDUCTION);
    return { won: true, hpChange: hpRestore, debtChange: debtReduction };
  } else {
    const hpLoss = -Math.floor(maxHp * BOSS_DEFEAT_HP_LOSS);
    return { won: false, hpChange: hpLoss, debtChange: 0 };
  }
}

/** Check if streak should hold (80% threshold) */
export function shouldStreakHold(completed: number, total: number): boolean {
  if (total === 0) return true;
  return completed / total >= STREAK_THRESHOLD;
}

/** Apply streak decay based on difficulty mode */
export function decayStreak(currentDays: number, mode: DifficultyMode): number {
  const target = DIFFICULTY_MODES[mode].streakDecayTarget;
  return Math.floor(currentDays * target);
}

/** Check if agent can level up, returns new level and remaining XP */
export function processLevelUp(currentLevel: number, currentXp: number): {
  newLevel: number;
  remainingXp: number;
  leveledUp: boolean;
} {
  let level = currentLevel;
  let xp = currentXp;
  let leveledUp = false;

  while (level < MAX_LEVEL && xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
    leveledUp = true;
  }

  return { newLevel: level, remainingXp: xp, leveledUp };
}
