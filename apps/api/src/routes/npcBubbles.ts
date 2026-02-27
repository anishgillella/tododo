import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { users, agents, missions, gameEvents } from '../db/schema';

const app = new Hono();
const DEFAULT_USER_ID = 'default';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const BUBBLE_MODEL = 'openai/gpt-4o-mini';

// Simple in-memory cache — key is "userId", value is { bubbles, timestamp }
const cache = new Map<string, { bubbles: Record<string, string>; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 min

const CHARACTERS = ['axiom', 'kael', 'mira', 'hollow'];

const FALLBACK_BUBBLES: Record<string, string> = {
  axiom: 'Wards stable. For now.',
  kael: 'I bet I can clear more quests than you today.',
  mira: 'The hearth burns warm tonight, dear Drifter.',
  hollow: 'I am always here... waiting.',
};

app.get('/', async (c) => {
  // Check cache
  const cached = cache.get(DEFAULT_USER_ID);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return c.json({ bubbles: cached.bubbles });
  }

  // Get API key
  const userRows = await db.select().from(users).where(eq(users.id, DEFAULT_USER_ID));
  const apiKey = userRows[0]?.openrouterApiKey;

  if (!apiKey) {
    return c.json({ bubbles: FALLBACK_BUBBLES });
  }

  // Get game state summary
  const agentRows = await db.select().from(agents).where(eq(agents.userId, DEFAULT_USER_ID));
  const agent = agentRows[0];

  const activeMissions = await db.all<{ title: string }>(sql`
    SELECT title FROM missions WHERE user_id = ${DEFAULT_USER_ID} AND status = 'active' AND is_habit = 0 LIMIT 5
  `);

  const recentEvents = await db
    .select()
    .from(gameEvents)
    .where(eq(gameEvents.userId, DEFAULT_USER_ID))
    .orderBy(desc(gameEvents.createdAt))
    .limit(3);

  const context = `Level ${agent?.level ?? 1}, HP ${agent?.hp ?? 100}/${agent?.maxHp ?? 100}, Gold ${agent?.gold ?? 0}, Streak ${agent?.streakDays ?? 0} days, Debt ${agent?.debt ?? 0}. Active quests: ${activeMissions.map((m) => m.title).join(', ') || 'none'}. Recent events: ${recentEvents.map((e) => e.type).join(', ') || 'none'}.`;

  try {
    const prompt = `You generate short one-liner speech bubbles for 4 NPCs in the fantasy village Drifthollow. Each bubble should be 1 sentence, in-character, referencing the player's current state when relevant.

Characters:
- axiom: Sarcastic arcane sentinel AI. Dry wit, short sentences.
- kael: Cocky rival Drifter. Competitive, boastful.
- mira: Warm tavern keeper. Encouraging, philosophical.
- hollow: The villain. Cold, menacing, feeds on broken promises.

Player state: ${context}

Respond as JSON (no markdown): {"axiom":"...","kael":"...","mira":"...","hollow":"..."}`;

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://tododo.app',
        'X-Title': 'Tododo',
      },
      body: JSON.stringify({
        model: BUBBLE_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      return c.json({ bubbles: FALLBACK_BUBBLES });
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return c.json({ bubbles: FALLBACK_BUBBLES });
    }

    try {
      const parsed = JSON.parse(content) as Record<string, string>;
      const bubbles: Record<string, string> = {};
      for (const char of CHARACTERS) {
        bubbles[char] = parsed[char] || FALLBACK_BUBBLES[char];
      }

      // Cache result
      cache.set(DEFAULT_USER_ID, { bubbles, timestamp: Date.now() });

      return c.json({ bubbles });
    } catch {
      return c.json({ bubbles: FALLBACK_BUBBLES });
    }
  } catch {
    return c.json({ bubbles: FALLBACK_BUBBLES });
  }
});

export default app;
