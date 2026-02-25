import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { agents, users } from '../db/schema';
import { xpForLevel, type StreakTier } from '@tododo/shared';

const app = new Hono();

const DEFAULT_USER_ID = 'default';

// GET /api/agent — return agent stats (create default agent + user if not exists)
app.get('/', async (c) => {
  // Ensure default user exists
  const existingUsers = await db.select().from(users).where(eq(users.id, DEFAULT_USER_ID));
  if (existingUsers.length === 0) {
    await db.insert(users).values({
      id: DEFAULT_USER_ID,
      username: 'Adventurer',
      createdAt: new Date().toISOString(),
    });
  }

  // Get or create agent
  let agentRows = await db.select().from(agents).where(eq(agents.userId, DEFAULT_USER_ID));

  if (agentRows.length === 0) {
    const agentId = nanoid();
    await db.insert(agents).values({
      id: agentId,
      userId: DEFAULT_USER_ID,
    });
    agentRows = await db.select().from(agents).where(eq(agents.userId, DEFAULT_USER_ID));
  }

  const agent = agentRows[0];
  const xpToNext = xpForLevel(agent.level ?? 1);

  return c.json({
    agent: {
      ...agent,
      xpToNext,
      streakTier: (agent.streakTier ?? 'none') as StreakTier,
    },
  });
});

export default app;
