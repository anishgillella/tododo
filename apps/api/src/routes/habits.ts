import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { MISSION_DIFFICULTIES } from '@tododo/shared';
import type { MissionDifficulty } from '@tododo/shared';
import { spawnDailyHabits, completeHabit } from '../services/habitService';
import { completeMission } from '../services/gameEngine';

const app = new Hono();
const DEFAULT_USER_ID = 'default';

// ── GET / — List all habit templates + today's instances ─────────────

app.get('/', async (c) => {
  // Spawn today's habits first
  await spawnDailyHabits(DEFAULT_USER_ID);

  const today = new Date().toISOString().slice(0, 10);

  // Get all habit templates
  const templates = await db.all<{
    id: string;
    title: string;
    description: string | null;
    difficulty: number;
    category_id: string | null;
    habit_streak: number;
    last_habit_completion: string | null;
    created_at: string;
  }>(sql`
    SELECT id, title, description, difficulty, category_id, habit_streak, last_habit_completion, created_at
    FROM missions
    WHERE user_id = ${DEFAULT_USER_ID}
      AND is_habit = 1
      AND recurring_source_id IS NULL
      AND status = 'active'
    ORDER BY created_at ASC
  `);

  // Get today's instances
  const instances = await db.all<{
    id: string;
    recurring_source_id: string;
    status: string;
  }>(sql`
    SELECT id, recurring_source_id, status
    FROM missions
    WHERE user_id = ${DEFAULT_USER_ID}
      AND is_habit = 1
      AND recurring_source_id IS NOT NULL
      AND due_date = ${today}
  `);

  const instanceMap = new Map(instances.map((i) => [i.recurring_source_id, i]));

  const habits = templates.map((t) => {
    const instance = instanceMap.get(t.id);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      difficulty: t.difficulty,
      categoryId: t.category_id,
      habitStreak: t.habit_streak ?? 0,
      lastHabitCompletion: t.last_habit_completion,
      createdAt: t.created_at,
      todayInstanceId: instance?.id ?? null,
      completedToday: instance?.status === 'completed',
    };
  });

  return c.json({ habits });
});

// ── POST / — Create a new habit ──────────────────────────────────────

app.post('/', async (c) => {
  const body = await c.req.json<{ title?: string; difficulty?: number; description?: string; categoryId?: string }>();

  const title = body.title?.trim();
  if (!title) return c.json({ error: 'Title is required' }, 400);

  const difficulty = (body.difficulty ?? 2) as MissionDifficulty;
  const diffInfo = MISSION_DIFFICULTIES[difficulty];
  if (!diffInfo) return c.json({ error: 'Invalid difficulty (1-5)' }, 400);

  const now = new Date().toISOString();
  const id = nanoid();

  await db.run(sql`
    INSERT INTO missions (id, user_id, title, description, difficulty, status, xp_reward, gold_reward, category_id, is_habit, habit_streak, is_recurring, carry_over_count, created_at)
    VALUES (${id}, ${DEFAULT_USER_ID}, ${title}, ${body.description ?? null}, ${difficulty}, ${'active'}, ${diffInfo.baseXp}, ${diffInfo.baseGoldMin}, ${body.categoryId ?? null}, 1, 0, 0, 0, ${now})
  `);

  // Spawn today's instance immediately
  await spawnDailyHabits(DEFAULT_USER_ID);

  return c.json({
    habit: {
      id,
      title,
      description: body.description ?? null,
      difficulty,
      habitStreak: 0,
      createdAt: now,
    },
  }, 201);
});

// ── POST /:id/complete — Complete today's habit instance ─────────────

app.post('/:id/complete', async (c) => {
  const habitTemplateId = c.req.param('id');
  const today = new Date().toISOString().slice(0, 10);

  // Find today's instance for this habit
  const instances = await db.all<{ id: string }>(sql`
    SELECT id FROM missions
    WHERE recurring_source_id = ${habitTemplateId}
      AND due_date = ${today}
      AND user_id = ${DEFAULT_USER_ID}
      AND is_habit = 1
    LIMIT 1
  `);

  const instance = instances[0];
  if (!instance) return c.json({ error: 'No habit instance for today' }, 404);

  // Complete via game engine for XP/gold rewards
  const result = await completeMission(instance.id, DEFAULT_USER_ID);

  // Update habit streak
  const { streak } = await completeHabit(instance.id, DEFAULT_USER_ID);

  return c.json({
    ...result,
    habitStreak: streak,
  });
});

// ── DELETE /:id — Delete a habit template + all instances ────────────

app.delete('/:id', async (c) => {
  const id = c.req.param('id');

  // Delete all instances
  await db.run(sql`
    DELETE FROM missions
    WHERE recurring_source_id = ${id} AND user_id = ${DEFAULT_USER_ID}
  `);

  // Delete the template
  await db.run(sql`
    DELETE FROM missions
    WHERE id = ${id} AND user_id = ${DEFAULT_USER_ID} AND is_habit = 1
  `);

  return c.json({ success: true });
});

export default app;
