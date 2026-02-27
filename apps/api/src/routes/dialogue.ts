import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { users, agents, missions, dialogueHistory, gameEvents } from '../db/schema';
import { generateDialogue } from '../services/ai';
import {
  formatGameStateForPrompt,
  FALLBACK_RESPONSES,
  type GameStateForPrompt,
} from '../prompts/characters';
import { incrementMessageCount, shouldSummarize, getMemory, summarizeAndStore } from '../services/memoryService';

const app = new Hono();

const DEFAULT_USER_ID = 'default';
const VALID_CHARACTERS = ['axiom', 'kael', 'mira', 'hollow', 'drifter'];

const NO_API_KEY_RESPONSES: Record<string, string> = {
  axiom: 'My communication array requires an API key to function. Navigate to Settings and configure your OpenRouter key. I will wait. Impatiently.',
  kael: 'Yo, your comms are busted. Go set up an API key in Settings so I can properly roast you.',
  mira: 'Dear Drifter, I cannot reach you through the silence. Please visit your Settings and provide an OpenRouter API key so that we may speak.',
  hollow: 'You cannot hear me... yet. Set your API key in Settings. I will be waiting in the dark.',
  drifter: 'The Drifter reached for the communicator, but found only static. An API key was needed to bridge the gap.',
};

// ── POST /api/dialogue — Send a message to an NPC ────────────────────

app.post('/', async (c) => {
  const body = await c.req.json<{ character?: string; message?: string }>();

  const character = body.character?.toLowerCase();
  const message = body.message?.trim();

  if (!character || !VALID_CHARACTERS.includes(character)) {
    return c.json(
      { error: `Invalid character. Must be one of: ${VALID_CHARACTERS.join(', ')}` },
      400,
    );
  }

  if (!message) {
    return c.json({ error: 'Message is required' }, 400);
  }

  // Get user and check for API key
  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, DEFAULT_USER_ID));

  const user = userRows[0];
  const apiKey = user?.openrouterApiKey;

  // If no API key, return a hardcoded "set your key" response (not an error)
  if (!apiKey) {
    const fallbackResponse = NO_API_KEY_RESPONSES[character] ?? NO_API_KEY_RESPONSES.axiom;

    // Still save to history so the conversation flow is preserved
    const now = new Date().toISOString();
    await db.insert(dialogueHistory).values({
      id: nanoid(),
      userId: DEFAULT_USER_ID,
      character,
      role: 'user',
      content: message,
      createdAt: now,
    });
    await db.insert(dialogueHistory).values({
      id: nanoid(),
      userId: DEFAULT_USER_ID,
      character,
      role: 'assistant',
      content: fallbackResponse,
      createdAt: now,
    });

    return c.json({
      character,
      response: fallbackResponse,
      mood: 'waiting',
      needsApiKey: true,
    });
  }

  // Get agent stats
  const agentRows = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, DEFAULT_USER_ID));
  const agent = agentRows[0] ?? {};

  // Get active missions
  const activeMissions = await db
    .select()
    .from(missions)
    .where(and(eq(missions.userId, DEFAULT_USER_ID), eq(missions.status, 'active')));

  // Get recent events (last 5)
  const recentEventRows = await db
    .select()
    .from(gameEvents)
    .where(eq(gameEvents.userId, DEFAULT_USER_ID))
    .orderBy(desc(gameEvents.createdAt))
    .limit(5);

  const recentEvents = recentEventRows.map((e) => e.type ?? 'unknown');

  // Get recent dialogue history for this character
  const historyRows = await db
    .select()
    .from(dialogueHistory)
    .where(
      and(
        eq(dialogueHistory.userId, DEFAULT_USER_ID),
        eq(dialogueHistory.character, character),
      ),
    )
    .orderBy(desc(dialogueHistory.createdAt))
    .limit(10);

  // Reverse so oldest is first (for conversation flow)
  const recentHistory = historyRows
    .reverse()
    .map((h) => ({
      role: h.role ?? 'user',
      content: h.content ?? '',
    }));

  // Build game state for prompt
  const gameState: GameStateForPrompt = {
    level: (agent as any).level ?? 1,
    hp: (agent as any).hp ?? 100,
    maxHp: (agent as any).maxHp ?? 100,
    xp: (agent as any).xp ?? 0,
    gold: (agent as any).gold ?? 0,
    streakDays: (agent as any).streakDays ?? 0,
    streakTier: (agent as any).streakTier ?? 'none',
    debt: (agent as any).debt ?? 0,
    comboCount: (agent as any).comboCount ?? 0,
    discipline: (agent as any).discipline ?? 0.5,
    courage: (agent as any).courage ?? 0.5,
    wisdom: (agent as any).wisdom ?? 0.5,
    charisma: (agent as any).charisma ?? 0.5,
    activeMissions: activeMissions.map((m) => ({
      title: m.title,
      difficulty: m.difficulty ?? 2,
    })),
    recentEvents,
  };

  // Fetch NPC memory for this character
  const memory = await getMemory(DEFAULT_USER_ID, character);

  // Generate AI response
  const response = await generateDialogue(
    character,
    message,
    gameState,
    apiKey,
    recentHistory,
    memory ?? undefined,
  );

  // Save user message and assistant response to dialogue history
  const now = new Date().toISOString();
  await db.insert(dialogueHistory).values({
    id: nanoid(),
    userId: DEFAULT_USER_ID,
    character,
    role: 'user',
    content: message,
    gameContext: JSON.stringify(gameState),
    createdAt: now,
  });
  await db.insert(dialogueHistory).values({
    id: nanoid(),
    userId: DEFAULT_USER_ID,
    character,
    role: 'assistant',
    content: response,
    createdAt: now,
  });

  // Increment message count and check if summarization needed
  // Count both user + assistant as 1 "exchange"
  const msgCount = await incrementMessageCount(DEFAULT_USER_ID, character);
  if (shouldSummarize(msgCount)) {
    // Run summarization in background (don't block response)
    summarizeAndStore(DEFAULT_USER_ID, character, apiKey).catch((err) =>
      console.error('[dialogue] Background summarization error:', err),
    );
  }

  return c.json({
    character,
    response,
  });
});

// ── GET /api/dialogue/history — Get dialogue history ─────────────────

app.get('/history', async (c) => {
  const character = c.req.query('character')?.toLowerCase();
  const limitParam = c.req.query('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;

  if (character && !VALID_CHARACTERS.includes(character)) {
    return c.json(
      { error: `Invalid character. Must be one of: ${VALID_CHARACTERS.join(', ')}` },
      400,
    );
  }

  let query;
  if (character) {
    query = db
      .select()
      .from(dialogueHistory)
      .where(
        and(
          eq(dialogueHistory.userId, DEFAULT_USER_ID),
          eq(dialogueHistory.character, character),
        ),
      )
      .orderBy(desc(dialogueHistory.createdAt))
      .limit(limit);
  } else {
    query = db
      .select()
      .from(dialogueHistory)
      .where(eq(dialogueHistory.userId, DEFAULT_USER_ID))
      .orderBy(desc(dialogueHistory.createdAt))
      .limit(limit);
  }

  const rows = await query;

  return c.json({
    history: rows.map((row) => ({
      id: row.id,
      character: row.character,
      role: row.role,
      content: row.content,
      createdAt: row.createdAt,
    })),
  });
});

export default app;
