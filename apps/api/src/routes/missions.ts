import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { missions, agents } from '../db/schema';
import {
  MISSION_DIFFICULTIES,
  type MissionDifficulty,
} from '@tododo/shared';
import { completeMission } from '../services/gameEngine';

const app = new Hono();

// Hardcoded user for Phase 1 — will be replaced with auth later
const DEFAULT_USER_ID = 'default';

// GET /api/missions — list all active missions for the user
app.get('/', async (c) => {
  const userMissions = await db
    .select()
    .from(missions)
    .where(and(eq(missions.userId, DEFAULT_USER_ID), eq(missions.status, 'active')));

  return c.json({ missions: userMissions });
});

// POST /api/missions — create a new mission
app.post('/', async (c) => {
  const body = await c.req.json<{
    title: string;
    description?: string;
    difficulty?: number;
    dueDate?: string;
  }>();

  if (!body.title || body.title.trim().length === 0) {
    return c.json({ error: 'Title is required' }, 400);
  }

  const difficulty = (body.difficulty ?? 2) as MissionDifficulty;
  if (![1, 2, 3, 4, 5].includes(difficulty)) {
    return c.json({ error: 'Difficulty must be 1-5' }, 400);
  }

  const diffInfo = MISSION_DIFFICULTIES[difficulty];
  const xpReward = diffInfo.baseXp;
  const goldReward = diffInfo.baseGoldMin;

  const id = nanoid();
  const now = new Date().toISOString();

  const newMission = {
    id,
    userId: DEFAULT_USER_ID,
    title: body.title.trim(),
    description: body.description?.trim() || null,
    difficulty,
    status: 'active' as const,
    xpReward,
    goldReward,
    narrativeFlavor: null,
    carryOverCount: 0,
    dueDate: body.dueDate || null,
    createdAt: now,
    completedAt: null,
  };

  await db.insert(missions).values(newMission);

  return c.json({ mission: newMission }, 201);
});

// PUT /api/missions/:id — update a mission
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<{
    title?: string;
    description?: string;
    difficulty?: number;
    status?: string;
    dueDate?: string;
  }>();

  // Verify the mission exists and belongs to this user
  const existing = await db
    .select()
    .from(missions)
    .where(and(eq(missions.id, id), eq(missions.userId, DEFAULT_USER_ID)));

  if (existing.length === 0) {
    return c.json({ error: 'Mission not found' }, 404);
  }

  const updates: Record<string, unknown> = {};

  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description.trim();
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate;
  if (body.status !== undefined) updates.status = body.status;

  if (body.difficulty !== undefined) {
    const difficulty = body.difficulty as MissionDifficulty;
    if (![1, 2, 3, 4, 5].includes(difficulty)) {
      return c.json({ error: 'Difficulty must be 1-5' }, 400);
    }
    const diffInfo = MISSION_DIFFICULTIES[difficulty];
    updates.difficulty = difficulty;
    updates.xpReward = diffInfo.baseXp;
    updates.goldReward = diffInfo.baseGoldMin;
  }

  await db.update(missions).set(updates).where(eq(missions.id, id));

  const updated = await db.select().from(missions).where(eq(missions.id, id));

  return c.json({ mission: updated[0] });
});

// DELETE /api/missions/:id — delete a mission
app.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const existing = await db
    .select()
    .from(missions)
    .where(and(eq(missions.id, id), eq(missions.userId, DEFAULT_USER_ID)));

  if (existing.length === 0) {
    return c.json({ error: 'Mission not found' }, 404);
  }

  await db.delete(missions).where(eq(missions.id, id));

  return c.json({ success: true });
});

// POST /api/missions/:id/complete — mark a mission as completed
// Delegates to gameEngine.completeMission for full game logic
app.post('/:id/complete', async (c) => {
  const id = c.req.param('id');

  try {
    const result = await completeMission(id, DEFAULT_USER_ID);

    // Return response with the same shape as Phase 1 plus new fields
    return c.json({
      mission: result.mission,
      xpGained: result.xpGained,
      goldGained: result.goldGained,
      wasCrit: result.wasCrit,
      comboBonus: result.comboBonus,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
      lootDrop: result.lootDrop,
      overdriveTriggered: result.overdriveTriggered,
      streakUpdate: result.streakUpdate,
      events: result.events,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Mission not found') {
      return c.json({ error: message }, 404);
    }
    if (message === 'Mission is not active') {
      return c.json({ error: message }, 400);
    }
    return c.json({ error: message }, 500);
  }
});

export default app;
