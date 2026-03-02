/**
 * Achievement Service — Checks and awards achievements based on player stats.
 */

import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { agents, missions, achievements, inventory, agentSkills, bestiary, gameEvents } from '../db/schema';
import { ACHIEVEMENTS, type AchievementDef } from '@tododo/shared';

export interface AwardedAchievement {
  achievementId: string;
  name: string;
  tier: string;
  rewards: { xp: number; gold: number; title?: string };
}

/** Check all achievements and award any newly met ones */
export async function checkAndAwardAchievements(userId: string): Promise<AwardedAchievement[]> {
  const agentRows = await db.select().from(agents).where(eq(agents.userId, userId));
  if (agentRows.length === 0) return [];
  const agent = agentRows[0];

  // Get already unlocked achievement IDs
  const unlocked = await db.select().from(achievements).where(eq(achievements.userId, userId));
  const unlockedIds = new Set(unlocked.map((a) => a.achievementId));

  // Gather stats
  const stats = await gatherStats(userId, agent);

  const awarded: AwardedAchievement[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue;
    if (!checkCondition(achievement, stats)) continue;

    // Award achievement
    await db.insert(achievements).values({
      id: nanoid(),
      userId,
      achievementId: achievement.id,
      unlockedAt: new Date().toISOString(),
    });

    // Apply rewards
    await db
      .update(agents)
      .set({
        xp: (agent.xp ?? 0) + achievement.rewards.xp,
        gold: (agent.gold ?? 0) + achievement.rewards.gold,
      })
      .where(eq(agents.id, agent.id));

    // Log game event
    await db.insert(gameEvents).values({
      id: nanoid(),
      userId,
      type: 'achievement_unlocked',
      data: JSON.stringify({ achievementId: achievement.id, rewards: achievement.rewards }),
      createdAt: new Date().toISOString(),
    });

    awarded.push({
      achievementId: achievement.id,
      name: achievement.name,
      tier: achievement.tier,
      rewards: achievement.rewards,
    });
  }

  return awarded;
}

interface PlayerStats {
  tasksCompleted: number;
  streakDays: number;
  level: number;
  comboCount: number;
  combatWins: number;
  bossDefeated: number;
  itemsOwned: number;
  skillsLearned: number;
  creatureDefeats: Record<string, number>;
}

async function gatherStats(
  userId: string,
  agent: Record<string, unknown>,
): Promise<PlayerStats> {
  // Count completed missions
  const completedMissions = await db
    .select()
    .from(missions)
    .where(and(eq(missions.userId, userId), eq(missions.status, 'completed')));

  // Count unique inventory items
  const items = await db
    .select()
    .from(inventory)
    .where(eq(inventory.agentId, agent.id as string));

  // Count skills
  const skills = await db
    .select()
    .from(agentSkills)
    .where(eq(agentSkills.agentId, agent.id as string));

  // Count combat wins from bestiary
  const bestiaryEntries = await db
    .select()
    .from(bestiary)
    .where(eq(bestiary.userId, userId));

  let combatWins = 0;
  const creatureDefeats: Record<string, number> = {};
  for (const entry of bestiaryEntries) {
    const defeats = entry.timesDefeated ?? 0;
    combatWins += defeats;
    if (entry.creatureId) {
      creatureDefeats[entry.creatureId] = defeats;
    }
  }

  // Count boss defeats
  const bossEntry = bestiaryEntries.find((e) => e.creatureId === 'the_hollow');
  const bossDefeated = bossEntry?.timesDefeated ?? 0;

  return {
    tasksCompleted: completedMissions.length,
    streakDays: (agent.streakDays as number) ?? 0,
    level: (agent.level as number) ?? 1,
    comboCount: (agent.comboCount as number) ?? 0,
    combatWins,
    bossDefeated,
    itemsOwned: items.length,
    skillsLearned: skills.length,
    creatureDefeats,
  };
}

function checkCondition(achievement: AchievementDef, stats: PlayerStats): boolean {
  const { type, value, creatureId } = achievement.condition;

  switch (type) {
    case 'tasks_completed':
      return stats.tasksCompleted >= value;
    case 'streak_days':
      return stats.streakDays >= value;
    case 'level_reached':
      return stats.level >= value;
    case 'combo_reached':
      return stats.comboCount >= value;
    case 'combat_wins':
      return stats.combatWins >= value;
    case 'boss_defeated':
      return stats.bossDefeated >= value;
    case 'creature_defeated':
      return (stats.creatureDefeats[creatureId ?? ''] ?? 0) >= value;
    case 'items_owned':
      return stats.itemsOwned >= value;
    case 'skills_learned':
      return stats.skillsLearned >= value;
    default:
      return false;
  }
}

/** Get all achievements for a user */
export async function getAchievements(userId: string) {
  return db.select().from(achievements).where(eq(achievements.userId, userId));
}
