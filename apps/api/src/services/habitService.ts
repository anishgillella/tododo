import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { MISSION_DIFFICULTIES } from '@tododo/shared';
import type { MissionDifficulty } from '@tododo/shared';

/**
 * Spawn today's habit instances. Each habit template gets one active instance per day.
 * Idempotent — won't create duplicates for the same day.
 */
export async function spawnDailyHabits(userId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // Get all habit templates
  const templates = await db.all<{
    id: string;
    title: string;
    description: string | null;
    difficulty: number;
    category_id: string | null;
    xp_reward: number;
    gold_reward: number;
    habit_streak: number;
  }>(sql`
    SELECT id, title, description, difficulty, category_id, xp_reward, gold_reward, habit_streak
    FROM missions
    WHERE user_id = ${userId}
      AND is_habit = 1
      AND status = 'active'
      AND recurring_source_id IS NULL
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
      INSERT INTO missions (id, user_id, title, description, difficulty, status, xp_reward, gold_reward, category_id, is_habit, habit_streak, recurring_source_id, carry_over_count, due_date, created_at)
      VALUES (${nanoid()}, ${userId}, ${template.title}, ${template.description}, ${difficulty}, ${'active'}, ${diffInfo?.baseXp ?? template.xp_reward}, ${diffInfo?.baseGoldMin ?? template.gold_reward}, ${template.category_id}, 1, ${template.habit_streak}, ${template.id}, 0, ${today}, ${now})
    `);
  }
}

/**
 * Complete a habit instance — updates streak on the template.
 */
export async function completeHabit(habitInstanceId: string, userId: string): Promise<{ streak: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  // Get the instance
  const instances = await db.all<{
    id: string;
    recurring_source_id: string | null;
    status: string;
  }>(sql`
    SELECT id, recurring_source_id, status FROM missions
    WHERE id = ${habitInstanceId} AND user_id = ${userId} AND is_habit = 1
    LIMIT 1
  `);

  const instance = instances[0];
  if (!instance) throw new Error('Habit instance not found');
  if (instance.status === 'completed') throw new Error('Habit already completed');

  const templateId = instance.recurring_source_id;
  if (!templateId) throw new Error('Habit has no source template');

  // Mark instance as completed
  await db.run(sql`
    UPDATE missions SET status = 'completed', completed_at = ${now}
    WHERE id = ${habitInstanceId}
  `);

  // Get template to check last completion date
  const templates = await db.all<{
    habit_streak: number;
    last_habit_completion: string | null;
  }>(sql`
    SELECT habit_streak, last_habit_completion FROM missions
    WHERE id = ${templateId} LIMIT 1
  `);

  const template = templates[0];
  if (!template) throw new Error('Habit template not found');

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const lastCompletion = template.last_habit_completion;

  // Increment streak if completed yesterday or never completed, otherwise reset to 1
  let newStreak: number;
  if (!lastCompletion || lastCompletion === yesterday) {
    newStreak = (template.habit_streak ?? 0) + 1;
  } else if (lastCompletion === today) {
    // Already completed today (edge case)
    newStreak = template.habit_streak ?? 1;
  } else {
    newStreak = 1; // streak broken
  }

  // Update template streak
  await db.run(sql`
    UPDATE missions
    SET habit_streak = ${newStreak}, last_habit_completion = ${today}
    WHERE id = ${templateId}
  `);

  return { streak: newStreak };
}
