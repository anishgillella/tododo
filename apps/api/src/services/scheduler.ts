import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { missions, agents, gameEvents, users, dailyRecaps } from '../db/schema';
import {
  getHollowStage,
  getStreakTier,
  xpForLevel,
  type DifficultyMode,
  type StreakTier,
  type HollowStage,
  TRAIT_SHIFT_FAIL,
  TRAIT_MIN,
  TRAIT_MAX,
} from '@tododo/shared';
import {
  calculateEndOfDayConsequences,
  type ConsequenceResult,
} from './consequences';

// ── Types ────────────────────────────────────────────────────────────

export interface AgentSnapshot {
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  gold: number;
  streakDays: number;
  streakTier: string;
  debt: number;
  discipline: number;
  courage: number;
}

export interface EndOfDayReport {
  date: string;
  missionsCompleted: number;
  missionsFailed: number;
  consequences: ConsequenceResult;
  narrative?: string;
  axiomCommentary?: string;
  kaelReaction?: string;
  agentSnapshot: AgentSnapshot;
}

// ── Helpers ──────────────────────────────────────────────────────────

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function clampTrait(value: number): number {
  return Math.min(TRAIT_MAX, Math.max(TRAIT_MIN, value));
}

async function getOrCreateAgent(userId: string) {
  const agentRows = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, userId));

  if (agentRows.length === 0) {
    // Ensure user exists
    const existingUsers = await db.select().from(users).where(eq(users.id, userId));
    if (existingUsers.length === 0) {
      await db.insert(users).values({
        id: userId,
        username: 'Adventurer',
        createdAt: new Date().toISOString(),
      });
    }
    const agentId = nanoid();
    await db.insert(agents).values({ id: agentId, userId });
    const newRows = await db.select().from(agents).where(eq(agents.userId, userId));
    return newRows[0];
  }

  return agentRows[0];
}

async function getUserMode(userId: string): Promise<DifficultyMode> {
  const userRows = await db.select().from(users).where(eq(users.id, userId));
  if (userRows.length === 0) return 'drifter';
  return (userRows[0].difficultyMode ?? 'drifter') as DifficultyMode;
}

async function logGameEvent(userId: string, type: string, data: Record<string, unknown>) {
  await db.insert(gameEvents).values({
    id: nanoid(),
    userId,
    type,
    data: JSON.stringify(data),
    createdAt: new Date().toISOString(),
  });
}

function generateTemplateNarrative(
  completed: number,
  failed: number,
  consequences: ConsequenceResult,
): string {
  const total = completed + failed;

  if (total === 0) {
    return 'The day passed quietly. No missions were undertaken. The silence lingers.';
  }

  if (failed === 0) {
    return `A triumphant day! All ${completed} mission${completed !== 1 ? 's' : ''} completed. Your discipline holds strong.`;
  }

  if (completed === 0) {
    return `A dark day. All ${failed} mission${failed !== 1 ? 's' : ''} remain unfinished. The Hollow stirs.`;
  }

  const rate = Math.round((completed / total) * 100);
  let narrative = `You completed ${completed} of ${total} missions (${rate}%).`;

  if (consequences.streakResult.shieldUsed) {
    narrative += ' A streak shield absorbed the blow, preserving your momentum.';
  } else if (!consequences.streakResult.held) {
    narrative += ' Your streak faltered under the weight of unfinished tasks.';
  }

  if (consequences.hollowStageChange) {
    narrative += ` The Hollow grows stronger, shifting from ${consequences.hollowStageChange.from} to ${consequences.hollowStageChange.to}.`;
  }

  return narrative;
}

function generateTemplateAxiomCommentary(
  completed: number,
  failed: number,
  consequences: ConsequenceResult,
): string {
  const total = completed + failed;

  if (total === 0) {
    return 'Inaction is itself a choice, and one with consequences.';
  }
  if (failed === 0) {
    return 'Exemplary performance. Consistency is the hallmark of a true agent.';
  }
  if (completed === 0) {
    return 'This is... concerning. You must rally your focus before it is too late.';
  }
  if (consequences.streakResult.held) {
    return 'Adequate. You held the line, but there is room for improvement.';
  }
  return 'The numbers do not lie. Review your approach and recalibrate.';
}

function generateTemplateKaelReaction(
  completed: number,
  failed: number,
  consequences: ConsequenceResult,
): string {
  const total = completed + failed;

  if (total === 0) {
    return '*shrugs* Quiet day, huh?';
  }
  if (failed === 0) {
    return 'Not bad! You actually pulled it off. Color me impressed.';
  }
  if (completed === 0) {
    return 'Oof. Total wipeout. Maybe tomorrow will be different... or not.';
  }
  if (consequences.streakResult.shieldUsed) {
    return 'Lucky you had that shield! Might want to be more careful though.';
  }
  return `${completed} out of ${total}? Could be worse, could be better. Classic.`;
}

// ── Main End-of-Day Runner ───────────────────────────────────────────

/**
 * Run the end-of-day sequence for a user.
 *
 * 1. Gather today's missions (completed vs active/failed)
 * 2. Calculate consequences using the pure consequences function
 * 3. Apply consequences to agent (HP, debt, streak, traits)
 * 4. Mark failed missions as carried_over with incremented count
 * 5. Generate narrative (template-based for MVP)
 * 6. Save daily recap to DB
 * 7. Log game events
 * 8. Return full report
 */
export async function runEndOfDay(userId: string): Promise<EndOfDayReport> {
  const agent = await getOrCreateAgent(userId);
  const mode = await getUserMode(userId);
  const today = todayDateString();

  // ── Gather missions ──────────────────────────────────────────────
  const allMissions = await db
    .select()
    .from(missions)
    .where(eq(missions.userId, userId));

  const activeMissions = allMissions.filter((m) => m.status === 'active');
  const completedToday = allMissions.filter(
    (m) => m.status === 'completed' && m.completedAt && m.completedAt.slice(0, 10) === today,
  );

  const completedCount = completedToday.length;
  const failedMissions = activeMissions.map((m) => ({
    id: m.id,
    difficulty: m.difficulty,
    carryOverCount: m.carryOverCount,
    title: m.title,
  }));

  // ── Calculate consequences ───────────────────────────────────────
  const consequences = calculateEndOfDayConsequences(
    agent,
    completedCount,
    failedMissions,
    mode,
  );

  // ── Apply HP damage ──────────────────────────────────────────────
  const currentHp = agent.hp ?? 100;
  const newHp = Math.max(0, currentHp - consequences.hpDamage);

  // ── Apply debt ───────────────────────────────────────────────────
  const newDebt = (agent.debt ?? 0) + consequences.debtChange;

  // ── Apply streak ─────────────────────────────────────────────────
  const newStreakDays = consequences.streakResult.newDays;
  const newStreakTier = consequences.streakResult.newTier;
  const newShields = consequences.streakResult.shieldUsed
    ? Math.max(0, (agent.streakShields ?? 0) - 1)
    : (agent.streakShields ?? 0);

  // ── Apply personality trait decay for failures ───────────────────
  let newDiscipline = agent.discipline ?? 0.5;
  if (failedMissions.length > 0) {
    newDiscipline = clampTrait(newDiscipline + TRAIT_SHIFT_FAIL * failedMissions.length);
  }

  // ── Consecutive fail days ────────────────────────────────────────
  const newConsecutiveFailDays =
    failedMissions.length > 0 ? (agent.consecutiveFailDays ?? 0) + 1 : 0;

  // ── Update agent in DB ───────────────────────────────────────────
  await db
    .update(agents)
    .set({
      hp: newHp,
      streakDays: newStreakDays,
      streakTier: newStreakTier,
      streakShields: newShields,
      debt: newDebt,
      consecutiveFailDays: newConsecutiveFailDays,
      comboCount: 0, // reset at end of day
      discipline: newDiscipline,
    })
    .where(eq(agents.id, agent.id));

  // ── Mark failed missions as carried_over ─────────────────────────
  for (const m of activeMissions) {
    const carryOver = (m.carryOverCount ?? 0);
    await db
      .update(missions)
      .set({
        status: 'carried_over',
        carryOverCount: carryOver + 1,
      })
      .where(eq(missions.id, m.id));
  }

  // ── Generate narrative ───────────────────────────────────────────
  const narrative = generateTemplateNarrative(completedCount, failedMissions.length, consequences);
  const axiomCommentary = generateTemplateAxiomCommentary(completedCount, failedMissions.length, consequences);
  const kaelReaction = generateTemplateKaelReaction(completedCount, failedMissions.length, consequences);

  // ── Build agent snapshot ─────────────────────────────────────────
  const agentSnapshot: AgentSnapshot = {
    level: agent.level ?? 1,
    xp: agent.xp ?? 0,
    hp: newHp,
    maxHp: agent.maxHp ?? 100,
    gold: agent.gold ?? 0,
    streakDays: newStreakDays,
    streakTier: newStreakTier,
    debt: newDebt,
    discipline: newDiscipline,
    courage: agent.courage ?? 0.5,
  };

  // ── Calculate XP and gold earned today ───────────────────────────
  const xpEarned = completedToday.reduce((sum, m) => sum + (m.xpReward ?? 0), 0);
  const goldEarned = completedToday.reduce((sum, m) => sum + (m.goldReward ?? 0), 0);

  // ── Save daily recap ─────────────────────────────────────────────
  await db.insert(dailyRecaps).values({
    id: nanoid(),
    userId,
    date: today,
    missionsCompleted: completedCount,
    missionsFailed: failedMissions.length,
    xpEarned,
    goldEarned,
    hpChange: -consequences.hpDamage,
    narrative,
    axiomCommentary,
    kaelReaction,
    statsSnapshot: JSON.stringify(agentSnapshot),
    createdAt: new Date().toISOString(),
  });

  // ── Log game events ──────────────────────────────────────────────
  await logGameEvent(userId, 'day_end', {
    date: today,
    missionsCompleted: completedCount,
    missionsFailed: failedMissions.length,
    hpDamage: consequences.hpDamage,
    debtChange: consequences.debtChange,
    streakHeld: consequences.streakResult.held,
    newStreakDays,
    events: consequences.events,
  });

  // ── Return report ────────────────────────────────────────────────
  return {
    date: today,
    missionsCompleted: completedCount,
    missionsFailed: failedMissions.length,
    consequences,
    narrative,
    axiomCommentary,
    kaelReaction,
    agentSnapshot,
  };
}

// ── Recap queries ────────────────────────────────────────────────────

/** Get a single daily recap by date (defaults to today) */
export async function getRecap(userId: string, date?: string) {
  const targetDate = date ?? todayDateString();
  const rows = await db
    .select()
    .from(dailyRecaps)
    .where(and(eq(dailyRecaps.userId, userId), eq(dailyRecaps.date, targetDate)));

  if (rows.length === 0) return null;

  const recap = rows[0];
  return {
    ...recap,
    statsSnapshot: recap.statsSnapshot ? JSON.parse(recap.statsSnapshot) : null,
  };
}

/** List recent recaps for a user, most recent first */
export async function listRecaps(userId: string, limit: number = 10) {
  const rows = await db
    .select()
    .from(dailyRecaps)
    .where(eq(dailyRecaps.userId, userId))
    .orderBy(desc(dailyRecaps.date))
    .limit(limit);

  return rows.map((recap) => ({
    ...recap,
    statsSnapshot: recap.statsSnapshot ? JSON.parse(recap.statsSnapshot) : null,
  }));
}
