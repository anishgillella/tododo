import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { MISSION_DIFFICULTIES } from '@tododo/shared';
import type { MissionDifficulty } from '@tododo/shared';

/**
 * Spawn today's recurring mission instances from templates.
 * Idempotent — won't create duplicates for the same day.
 */
export async function spawnRecurringMissions(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // Get all recurring templates for this user
  const templates = await db.all<{
    id: string;
    title: string;
    description: string | null;
    difficulty: number;
    category_id: string | null;
    xp_reward: number;
    gold_reward: number;
  }>(sql`
    SELECT id, title, description, difficulty, category_id, xp_reward, gold_reward
    FROM missions
    WHERE user_id = ${userId}
      AND is_recurring = 1
      AND is_habit = 0
      AND status = 'active'
  `);

  for (const template of templates) {
    // Check if an instance already exists for today
    const existing = await db.all(sql`
      SELECT id FROM missions
      WHERE recurring_source_id = ${template.id}
        AND due_date = ${today}
        AND user_id = ${userId}
      LIMIT 1
    `);

    if (existing.length > 0) continue;

    const difficulty = (template.difficulty ?? 2) as MissionDifficulty;
    const diffInfo = MISSION_DIFFICULTIES[difficulty];

    await db.run(sql`
      INSERT INTO missions (id, user_id, title, description, difficulty, status, xp_reward, gold_reward, category_id, is_recurring, recurring_source_id, carry_over_count, due_date, created_at)
      VALUES (${nanoid()}, ${userId}, ${template.title}, ${template.description}, ${difficulty}, ${'active'}, ${diffInfo?.baseXp ?? template.xp_reward}, ${diffInfo?.baseGoldMin ?? template.gold_reward}, ${template.category_id}, 0, ${template.id}, 0, ${today}, ${now})
    `);
  }
}
