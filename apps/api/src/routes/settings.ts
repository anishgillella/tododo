import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { users } from '../db/schema';

const app = new Hono();

const DEFAULT_USER_ID = 'default';

// GET /api/settings — return user settings
app.get('/', async (c) => {
  const userRows = await db.select().from(users).where(eq(users.id, DEFAULT_USER_ID));

  if (userRows.length === 0) {
    return c.json({
      settings: {
        username: 'Adventurer',
        difficultyMode: 'drifter',
        hasApiKey: false,
      },
    });
  }

  const user = userRows[0];
  return c.json({
    settings: {
      username: user.username,
      difficultyMode: user.difficultyMode ?? 'drifter',
      hasApiKey: !!user.openrouterApiKey,
    },
  });
});

// PUT /api/settings — update user settings
app.put('/', async (c) => {
  const body = await c.req.json<{
    username?: string;
    difficultyMode?: string;
    openrouterApiKey?: string;
  }>();

  // Ensure default user exists
  const existingUsers = await db.select().from(users).where(eq(users.id, DEFAULT_USER_ID));
  if (existingUsers.length === 0) {
    await db.insert(users).values({
      id: DEFAULT_USER_ID,
      username: body.username ?? 'Adventurer',
      difficultyMode: body.difficultyMode ?? 'drifter',
      openrouterApiKey: body.openrouterApiKey ?? null,
      createdAt: new Date().toISOString(),
    });
  } else {
    const updates: Record<string, unknown> = {};

    if (body.username !== undefined) updates.username = body.username.trim();
    if (body.difficultyMode !== undefined) {
      if (!['explorer', 'drifter', 'ironclad'].includes(body.difficultyMode)) {
        return c.json({ error: 'Invalid difficulty mode. Must be explorer, drifter, or ironclad.' }, 400);
      }
      updates.difficultyMode = body.difficultyMode;
    }
    if (body.openrouterApiKey !== undefined) {
      updates.openrouterApiKey = body.openrouterApiKey || null;
    }

    if (Object.keys(updates).length > 0) {
      await db.update(users).set(updates).where(eq(users.id, DEFAULT_USER_ID));
    }
  }

  // Return updated settings
  const userRows = await db.select().from(users).where(eq(users.id, DEFAULT_USER_ID));
  const user = userRows[0];

  return c.json({
    settings: {
      username: user.username,
      difficultyMode: user.difficultyMode ?? 'drifter',
      hasApiKey: !!user.openrouterApiKey,
    },
  });
});

export default app;
