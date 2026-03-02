/**
 * Boss Fight Service — Rift Gate encounters with The Hollow.
 *
 * When a Drifter's debt reaches >= 7 (confrontation stage), they can
 * voluntarily challenge The Hollow. At debt >= 10 (forced stage), the
 * fight becomes mandatory.
 *
 * Victory halves the debt, restores HP, and awards bonus XP/gold.
 * Defeat costs 30% max HP while debt remains unchanged.
 */

import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { agents, users, gameEvents } from '../db/schema';
import {
  calculateHollowStrength,
  calculateBossFightWinChance,
  getHollowStage,
  type HollowStage,
} from '@tododo/shared';
import { getActiveEffects } from './gameEngine';

// ── Types ────────────────────────────────────────────────────────────

export interface BossFightResult {
  won: boolean;
  narrative: string;
  hollowStrength: number;
  winChance: number;
  hpChange: number;
  debtBefore: number;
  debtAfter: number;
  rewards?: { xp: number; gold: number };
  agentSnapshot: {
    level: number;
    hp: number;
    maxHp: number;
    xp: number;
    gold: number;
    debt: number;
  };
}

export interface HollowStatus {
  debt: number;
  hollowStage: HollowStage;
  hollowStrength: number;
  bossFightAvailable: boolean;
  bossFightForced: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────

async function getAgent(userId: string) {
  const rows = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, userId));

  if (rows.length === 0) {
    throw new Error('Agent not found');
  }

  return rows[0];
}

async function getUserApiKey(userId: string): Promise<string | null> {
  const rows = await db.select().from(users).where(eq(users.id, userId));
  if (rows.length === 0) return null;
  return rows[0].openrouterApiKey ?? null;
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

// ── Template Narratives ──────────────────────────────────────────────

function generateVictoryNarrative(
  level: number,
  streakDays: number,
  debtBefore: number,
  debtAfter: number,
): string {
  return `The Drifter stood against The Hollow, channeling ${streakDays} days of discipline. At Level ${level}, the accumulated resolve proved too strong for the darkness. The Hollow shattered. Debt reduced from ${debtBefore} to ${debtAfter}.`;
}

function generateDefeatNarrative(
  level: number,
  hpLoss: number,
): string {
  return `The Hollow's grip tightened. Despite Level ${level}'s power, the accumulated neglect was too strong. The darkness surged forward, overwhelming the Drifter's defenses. The Drifter stumbles, losing ${Math.abs(hpLoss)} HP.`;
}

// ── AI Narrative Generation ──────────────────────────────────────────

async function generateAINarrative(
  won: boolean,
  agentLevel: number,
  debt: number,
  debtAfter: number,
  hpChange: number,
  hollowStrength: number,
  apiKey: string,
): Promise<string | null> {
  try {
    const outcome = won
      ? `VICTORY: Debt reduced from ${debt} to ${debtAfter}. HP restored by ${hpChange}.`
      : `DEFEAT: Lost ${Math.abs(hpChange)} HP. Debt remains at ${debt}.`;

    const prompt = `You are the narrator of Tododo, a gamified productivity app set on a space station at the edge of an arcane nebula. Write a dramatic 2-3 sentence boss fight narrative.

The Drifter (Level ${agentLevel}) just fought The Hollow (strength ${hollowStrength}).
Result: ${outcome}

Write in dramatic third person past tense. Blend sci-fi and fantasy imagery. Do not use emojis.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://tododo.app',
        'X-Title': 'Tododo',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = data?.choices?.[0]?.message?.content;
    return content?.trim() ?? null;
  } catch {
    return null;
  }
}

// ── Main Boss Fight Function ─────────────────────────────────────────

/**
 * Initiate a boss fight against The Hollow.
 *
 * Requirements:
 * - Agent must have debt >= 7 for voluntary fight, or >= 10 for forced
 * - Agent must have HP > 0
 *
 * @param userId - The user's ID
 * @returns BossFightResult with full outcome details
 */
export async function initiateBossFight(userId: string): Promise<BossFightResult> {
  const agent = await getAgent(userId);

  const debt = agent.debt ?? 0;
  const hp = agent.hp ?? 100;
  const maxHp = agent.maxHp ?? 100;
  const level = agent.level ?? 1;
  const xp = agent.xp ?? 0;
  const gold = agent.gold ?? 0;
  const consecutiveFailDays = agent.consecutiveFailDays ?? 0;
  const streakDays = agent.streakDays ?? 0;

  // Validate: agent must be alive
  if (hp <= 0) {
    throw new Error('Agent is incapacitated');
  }

  // Validate: debt must be >= 7 for voluntary fight
  if (debt < 7) {
    throw new Error('Not enough threat to challenge The Hollow');
  }

  // Calculate Hollow's strength
  const hollowStrength = calculateHollowStrength(debt, consecutiveFailDays);

  // Get active effects for boss_win_chance_percent
  const effects = await getActiveEffects(agent.id);
  const bossWinBonus = effects.boss_win_chance_percent / 100;

  // Calculate win chance with skill bonus
  const baseWinChance = calculateBossFightWinChance(level, hp, maxHp, hollowStrength);
  const winChance = Math.min(0.9, baseWinChance + bossWinBonus);

  // Roll the fight
  const won = Math.random() < winChance;

  let hpChange: number;
  let debtAfter: number;
  let rewards: { xp: number; gold: number } | undefined;
  let newXp = xp;
  let newGold = gold;

  if (won) {
    // Victory: halve debt (round up), restore 20% max HP, award bonus XP/gold
    debtAfter = Math.ceil(debt / 2);
    hpChange = Math.floor(maxHp * 0.2);
    const bonusXp = 50 * debt;
    const bonusGold = 100 * debt;
    rewards = { xp: bonusXp, gold: bonusGold };
    newXp = xp + bonusXp;
    newGold = gold + bonusGold;

    // Update agent in DB
    await db
      .update(agents)
      .set({
        debt: debtAfter,
        hp: Math.min(maxHp, hp + hpChange),
        xp: newXp,
        gold: newGold,
      })
      .where(eq(agents.id, agent.id));
  } else {
    // Defeat: lose 30% max HP, debt stays
    hpChange = -Math.floor(maxHp * 0.3);
    debtAfter = debt;

    // Update agent in DB
    await db
      .update(agents)
      .set({
        hp: Math.max(0, hp + hpChange),
      })
      .where(eq(agents.id, agent.id));
  }

  // Log game event
  await logGameEvent(userId, 'boss_fight', {
    won,
    hollowStrength,
    winChance,
    hpChange,
    debtBefore: debt,
    debtAfter,
    rewards: rewards ?? null,
  });

  // Generate narrative
  let narrative: string;

  // Try AI narrative if API key available
  const apiKey = await getUserApiKey(userId);
  if (apiKey) {
    const aiNarrative = await generateAINarrative(
      won,
      level,
      debt,
      debtAfter,
      hpChange,
      hollowStrength,
      apiKey,
    );
    narrative = aiNarrative ?? (won
      ? generateVictoryNarrative(level, streakDays, debt, debtAfter)
      : generateDefeatNarrative(level, hpChange));
  } else {
    narrative = won
      ? generateVictoryNarrative(level, streakDays, debt, debtAfter)
      : generateDefeatNarrative(level, hpChange);
  }

  // Re-read agent for snapshot
  const updatedAgent = await getAgent(userId);

  return {
    won,
    narrative,
    hollowStrength,
    winChance,
    hpChange,
    debtBefore: debt,
    debtAfter,
    rewards,
    agentSnapshot: {
      level: updatedAgent.level ?? 1,
      hp: updatedAgent.hp ?? 100,
      maxHp: updatedAgent.maxHp ?? 100,
      xp: updatedAgent.xp ?? 0,
      gold: updatedAgent.gold ?? 0,
      debt: updatedAgent.debt ?? 0,
    },
  };
}

// ── Hollow Status ────────────────────────────────────────────────────

/**
 * Get the current Hollow status for a user.
 */
export async function getHollowStatus(userId: string): Promise<HollowStatus> {
  const agent = await getAgent(userId);

  const debt = agent.debt ?? 0;
  const consecutiveFailDays = agent.consecutiveFailDays ?? 0;
  const hollowStage = getHollowStage(debt);
  const hollowStrength = calculateHollowStrength(debt, consecutiveFailDays);

  return {
    debt,
    hollowStage,
    hollowStrength,
    bossFightAvailable: debt >= 7,
    bossFightForced: debt >= 10,
  };
}
