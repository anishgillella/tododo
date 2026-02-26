import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { missions, categories } from '../db/schema';
import {
  MISSION_DIFFICULTIES,
  type MissionDifficulty,
} from '@tododo/shared';
import { completeMission } from '../services/gameEngine';
import { classifyTask, parseTasks } from '../services/agent';
import { spawnRecurringMissions } from '../services/recurringService';
import { validate, CreateMissionSchema, UpdateMissionSchema, ParseTextSchema, BatchCreateMissionSchema, ValidationError } from '../validators';

const app = new Hono();

// Hardcoded user for Phase 1 — will be replaced with auth later
const DEFAULT_USER_ID = 'default';

// Helper to get user's API key
async function getApiKey(): Promise<string | undefined> {
  const rows = await db.all<{ openrouter_api_key: string | null }>(sql`
    SELECT openrouter_api_key FROM users WHERE id = ${DEFAULT_USER_ID} LIMIT 1
  `);
  return rows[0]?.openrouter_api_key ?? undefined;
}

// Helper to get user's categories
async function getUserCategories() {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, DEFAULT_USER_ID))
    .orderBy(categories.sortOrder);
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId ?? DEFAULT_USER_ID,
    name: r.name,
    emoji: r.emoji ?? '📋',
    color: r.color ?? '#6B7280',
    isDefault: !!r.isDefault,
    sortOrder: r.sortOrder ?? 0,
    createdAt: r.createdAt ?? '',
  }));
}

// Helper to enrich a mission with category info
async function enrichWithCategory(mission: any) {
  if (!mission.categoryId) return { ...mission, categoryName: null, categoryEmoji: null, categoryColor: null };
  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.id, mission.categoryId));
  const cat = cats[0];
  return {
    ...mission,
    categoryName: cat?.name ?? null,
    categoryEmoji: cat?.emoji ?? null,
    categoryColor: cat?.color ?? null,
  };
}

// GET /api/missions — list all active missions (spawn recurring first, filter templates)
app.get('/', async (c) => {
  // Spawn recurring missions for today
  await spawnRecurringMissions(DEFAULT_USER_ID);

  // Return active non-template missions
  const userMissions = await db
    .select()
    .from(missions)
    .where(
      and(
        eq(missions.userId, DEFAULT_USER_ID),
        eq(missions.status, 'active'),
      ),
    );

  // Filter out recurring templates, enrich with category info
  const filtered = userMissions.filter((m) => !m.isRecurring);
  const enriched = await Promise.all(filtered.map(enrichWithCategory));

  return c.json({ missions: enriched });
});

// GET /api/missions/recurring — list recurring templates
app.get('/recurring', async (c) => {
  const templates = await db
    .select()
    .from(missions)
    .where(
      and(
        eq(missions.userId, DEFAULT_USER_ID),
        eq(missions.status, 'active'),
        eq(missions.isRecurring, true),
      ),
    );

  const enriched = await Promise.all(templates.map(enrichWithCategory));
  return c.json({ templates: enriched });
});

// POST /api/missions/parse — parse natural-language text into structured tasks (preview only)
app.post('/parse', async (c) => {
  try {
    const body = await c.req.json();
    const { text } = validate(ParseTextSchema, body);

    const cats = await getUserCategories();
    const apiKey = await getApiKey();
    const parsed = await parseTasks(text, cats, apiKey);

    return c.json({ parsed });
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

// POST /api/missions/batch — create multiple missions at once
app.post('/batch', async (c) => {
  try {
    const body = await c.req.json();
    const { missions: missionInputs } = validate(BatchCreateMissionSchema, body);

    const cats = await getUserCategories();
    const apiKey = await getApiKey();
    const created: any[] = [];

    for (const data of missionInputs) {
      const difficulty = (data.difficulty ?? 2) as MissionDifficulty;
      const diffInfo = MISSION_DIFFICULTIES[difficulty];
      const xpReward = diffInfo.baseXp;
      const goldReward = diffInfo.baseGoldMin;
      const id = nanoid();
      const now = new Date().toISOString();
      const today = now.slice(0, 10);

      // Auto-classify if no categoryId
      let categoryId = data.categoryId ?? null;
      if (!categoryId && cats.length > 0) {
        categoryId = await classifyTask(data.title, data.description, cats, apiKey);
      }

      if (data.isRecurring) {
        const templateId = nanoid();
        await db.insert(missions).values({
          id: templateId,
          userId: DEFAULT_USER_ID,
          title: data.title.trim(),
          description: data.description?.trim() || null,
          difficulty,
          status: 'active',
          xpReward,
          goldReward,
          narrativeFlavor: null,
          categoryId,
          isRecurring: true,
          recurringSourceId: null,
          carryOverCount: 0,
          dueDate: null,
          createdAt: now,
          completedAt: null,
        });

        await db.insert(missions).values({
          id,
          userId: DEFAULT_USER_ID,
          title: data.title.trim(),
          description: data.description?.trim() || null,
          difficulty,
          status: 'active',
          xpReward,
          goldReward,
          narrativeFlavor: null,
          categoryId,
          isRecurring: false,
          recurringSourceId: templateId,
          carryOverCount: 0,
          dueDate: today,
          createdAt: now,
          completedAt: null,
        });
      } else {
        await db.insert(missions).values({
          id,
          userId: DEFAULT_USER_ID,
          title: data.title.trim(),
          description: data.description?.trim() || null,
          difficulty,
          status: 'active',
          xpReward,
          goldReward,
          narrativeFlavor: null,
          categoryId,
          isRecurring: false,
          recurringSourceId: null,
          carryOverCount: 0,
          dueDate: data.dueDate || null,
          createdAt: now,
          completedAt: null,
        });
      }

      const row = await db.select().from(missions).where(eq(missions.id, id));
      const enriched = await enrichWithCategory(row[0]);
      created.push(enriched);
    }

    return c.json({ created, count: created.length }, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

// POST /api/missions — create a new mission
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const data = validate(CreateMissionSchema, body);

    const difficulty = (data.difficulty ?? 2) as MissionDifficulty;
    const diffInfo = MISSION_DIFFICULTIES[difficulty];
    const xpReward = diffInfo.baseXp;
    const goldReward = diffInfo.baseGoldMin;

    const id = nanoid();
    const now = new Date().toISOString();
    const today = now.slice(0, 10);

    // Auto-classify if no categoryId provided
    let categoryId = data.categoryId ?? null;
    if (!categoryId) {
      const cats = await getUserCategories();
      if (cats.length > 0) {
        const apiKey = await getApiKey();
        categoryId = await classifyTask(data.title, data.description, cats, apiKey);
      }
    }

    if (data.isRecurring) {
      // Create as recurring template
      const templateId = nanoid();
      await db.insert(missions).values({
        id: templateId,
        userId: DEFAULT_USER_ID,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        difficulty,
        status: 'active',
        xpReward,
        goldReward,
        narrativeFlavor: null,
        categoryId,
        isRecurring: true,
        recurringSourceId: null,
        carryOverCount: 0,
        dueDate: null,
        createdAt: now,
        completedAt: null,
      });

      // Also create today's instance
      await db.insert(missions).values({
        id,
        userId: DEFAULT_USER_ID,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        difficulty,
        status: 'active',
        xpReward,
        goldReward,
        narrativeFlavor: null,
        categoryId,
        isRecurring: false,
        recurringSourceId: templateId,
        carryOverCount: 0,
        dueDate: today,
        createdAt: now,
        completedAt: null,
      });
    } else {
      await db.insert(missions).values({
        id,
        userId: DEFAULT_USER_ID,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        difficulty,
        status: 'active',
        xpReward,
        goldReward,
        narrativeFlavor: null,
        categoryId,
        isRecurring: false,
        recurringSourceId: null,
        carryOverCount: 0,
        dueDate: data.dueDate || null,
        createdAt: now,
        completedAt: null,
      });
    }

    const created = await db.select().from(missions).where(eq(missions.id, id));
    const enriched = await enrichWithCategory(created[0]);

    return c.json({ mission: enriched }, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

// POST /api/missions/recurring — create a recurring template
app.post('/recurring', async (c) => {
  try {
    const body = await c.req.json();
    const data = validate(CreateMissionSchema, { ...body, isRecurring: true });

    const difficulty = (data.difficulty ?? 2) as MissionDifficulty;
    const diffInfo = MISSION_DIFFICULTIES[difficulty];
    const id = nanoid();
    const now = new Date().toISOString();

    let categoryId = data.categoryId ?? null;
    if (!categoryId) {
      const cats = await getUserCategories();
      if (cats.length > 0) {
        const apiKey = await getApiKey();
        categoryId = await classifyTask(data.title, data.description, cats, apiKey);
      }
    }

    await db.insert(missions).values({
      id,
      userId: DEFAULT_USER_ID,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      difficulty,
      status: 'active',
      xpReward: diffInfo.baseXp,
      goldReward: diffInfo.baseGoldMin,
      narrativeFlavor: null,
      categoryId,
      isRecurring: true,
      recurringSourceId: null,
      carryOverCount: 0,
      dueDate: null,
      createdAt: now,
      completedAt: null,
    });

    const created = await db.select().from(missions).where(eq(missions.id, id));
    const enriched = await enrichWithCategory(created[0]);

    return c.json({ template: enriched }, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

// DELETE /api/missions/recurring/:id — delete a recurring template
app.delete('/recurring/:id', async (c) => {
  const id = c.req.param('id');

  const existing = await db
    .select()
    .from(missions)
    .where(
      and(
        eq(missions.id, id),
        eq(missions.userId, DEFAULT_USER_ID),
        eq(missions.isRecurring, true),
      ),
    );

  if (existing.length === 0) {
    return c.json({ error: 'Recurring template not found' }, 404);
  }

  await db.delete(missions).where(eq(missions.id, id));
  // Delete active instances spawned from this template
  await db.run(sql`
    DELETE FROM missions WHERE recurring_source_id = ${id} AND status = 'active'
  `);

  return c.json({ success: true });
});

// PUT /api/missions/:id — update a mission
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = validate(UpdateMissionSchema, body);

    // Verify the mission exists and belongs to this user
    const existing = await db
      .select()
      .from(missions)
      .where(and(eq(missions.id, id), eq(missions.userId, DEFAULT_USER_ID)));

    if (existing.length === 0) {
      return c.json({ error: 'Mission not found' }, 404);
    }

    const updates: Record<string, unknown> = {};

    if (data.title !== undefined) updates.title = data.title.trim();
    if (data.description !== undefined) updates.description = data.description.trim();
    if (data.dueDate !== undefined) updates.dueDate = data.dueDate;
    if (data.status !== undefined) updates.status = data.status;
    if (data.categoryId !== undefined) updates.categoryId = data.categoryId;

    if (data.difficulty !== undefined) {
      const difficulty = data.difficulty as MissionDifficulty;
      const diffInfo = MISSION_DIFFICULTIES[difficulty];
      updates.difficulty = difficulty;
      updates.xpReward = diffInfo.baseXp;
      updates.goldReward = diffInfo.baseGoldMin;
    }

    await db.update(missions).set(updates).where(eq(missions.id, id));

    const updated = await db.select().from(missions).where(eq(missions.id, id));
    const enriched = await enrichWithCategory(updated[0]);

    return c.json({ mission: enriched });
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
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
