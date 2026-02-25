import {
  calculateFailureDamage,
  shouldStreakHold,
  decayStreak,
  getStreakTier,
  getHollowStage,
  type MissionDifficulty,
  type StreakTier,
  type DifficultyMode,
  type HollowStage,
} from '@tododo/shared';

// ── Types ────────────────────────────────────────────────────────────

/** Minimal agent shape needed by the consequences calculator */
export interface AgentRow {
  hp: number | null;
  maxHp: number | null;
  debt: number | null;
  streakDays: number | null;
  streakTier: string | null;
  streakShields: number | null;
  consecutiveFailDays: number | null;
}

/** Minimal mission shape needed by the consequences calculator */
export interface MissionRow {
  id: string;
  difficulty: number | null;
  carryOverCount: number | null;
  title: string;
}

export interface ConsequenceResult {
  hpDamage: number;
  debtChange: number;
  streakResult: {
    held: boolean;
    newDays: number;
    newTier: StreakTier;
    shieldUsed: boolean;
  };
  hollowStageChange?: {
    from: HollowStage;
    to: HollowStage;
  };
  events: string[];
}

// ── Main Function ────────────────────────────────────────────────────

/**
 * Calculate all end-of-day consequences based on agent state,
 * completed count, failed missions, and difficulty mode.
 *
 * This is a pure function with no side effects — it only computes
 * what should happen, leaving DB updates to the scheduler.
 */
export function calculateEndOfDayConsequences(
  agent: AgentRow,
  completedCount: number,
  failedMissions: MissionRow[],
  difficultyMode: DifficultyMode,
): ConsequenceResult {
  const events: string[] = [];
  const totalMissions = completedCount + failedMissions.length;

  // ── HP Damage ────────────────────────────────────────────────────
  let hpDamage = 0;
  for (const mission of failedMissions) {
    const difficulty = (mission.difficulty ?? 2) as MissionDifficulty;
    const carryOverCount = mission.carryOverCount ?? 0;
    const damage = calculateFailureDamage(difficulty, carryOverCount, difficultyMode);
    hpDamage += damage;
    events.push(`mission_failed:${mission.id}`);
  }

  // ── Debt ─────────────────────────────────────────────────────────
  const debtChange = failedMissions.length;

  // ── Streak ───────────────────────────────────────────────────────
  const currentStreakDays = agent.streakDays ?? 0;
  const currentShields = agent.streakShields ?? 0;
  let newStreakDays: number;
  let streakHeld: boolean;
  let shieldUsed = false;

  if (shouldStreakHold(completedCount, totalMissions)) {
    // Streak holds (>= 80% completion or no missions)
    streakHeld = true;
    // Increment streak — a successful day adds to the streak
    newStreakDays = totalMissions > 0 ? currentStreakDays + 1 : currentStreakDays;
  } else {
    // Below threshold — check if a shield can save the streak
    if (currentShields > 0 && currentStreakDays > 0) {
      // Use a shield to preserve the streak
      shieldUsed = true;
      streakHeld = true;
      newStreakDays = currentStreakDays;
      events.push('streak_shield_used');
    } else {
      // Streak decays based on difficulty mode
      streakHeld = false;
      newStreakDays = decayStreak(currentStreakDays, difficultyMode);
      events.push('streak_broken');
    }
  }

  const newStreakTier = getStreakTier(newStreakDays);

  // ── Hollow Stage Change ──────────────────────────────────────────
  const oldDebt = agent.debt ?? 0;
  const newDebt = oldDebt + debtChange;
  const oldStage = getHollowStage(oldDebt);
  const newStage = getHollowStage(newDebt);

  let hollowStageChange: ConsequenceResult['hollowStageChange'];
  if (oldStage !== newStage) {
    hollowStageChange = { from: oldStage, to: newStage };
    events.push(`hollow_escalated:${newStage}`);
  }

  // ── Narrative Events ─────────────────────────────────────────────
  if (hpDamage > 0) {
    events.push(`hp_damage:${hpDamage}`);
  }
  if (debtChange > 0) {
    events.push(`debt_increased:${debtChange}`);
  }
  if (totalMissions > 0 && failedMissions.length === 0) {
    events.push('perfect_day');
  }

  return {
    hpDamage,
    debtChange,
    streakResult: {
      held: streakHeld,
      newDays: newStreakDays,
      newTier: newStreakTier,
      shieldUsed,
    },
    hollowStageChange,
    events,
  };
}
