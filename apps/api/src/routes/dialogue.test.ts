import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import { unlinkSync, existsSync } from 'fs';

// DB_PATH is set via vitest.config.ts env before module evaluation

let app: Hono;
let initializeDatabase: () => Promise<void>;
let db: any;
let dialogueHistory: any;
let users: any;

const TEST_DB = './test-tododo.db';

// Mock fetch globally so dialogue route never calls OpenRouter
const originalFetch = globalThis.fetch;

beforeAll(async () => {
  // Clean up any leftover test database
  if (existsSync(TEST_DB)) {
    unlinkSync(TEST_DB);
  }

  // Mock fetch before importing the dialogue router (which imports ai.ts)
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        choices: [
          {
            message: {
              content: 'Mocked AI response for testing.',
            },
          },
        ],
      }),
  });

  // Dynamic imports so DB_PATH env is read at the right time
  const dbModule = await import('../db/index');
  const schemaModule = await import('../db/schema');
  initializeDatabase = dbModule.initializeDatabase;
  db = dbModule.db;
  dialogueHistory = schemaModule.dialogueHistory;
  users = schemaModule.users;

  await initializeDatabase();

  // Build a mini Hono app that mounts only the dialogue router
  const dialogueRouter = (await import('./dialogue')).default;
  app = new Hono();
  app.route('/api/dialogue', dialogueRouter);
});

afterAll(() => {
  // Restore original fetch
  globalThis.fetch = originalFetch;

  // Clean up test database file
  try {
    if (existsSync(TEST_DB)) {
      unlinkSync(TEST_DB);
    }
  } catch {
    // ignore cleanup errors
  }
});

// Helper to clear dialogue history between tests
async function clearDialogueHistory() {
  const { sql } = await import('drizzle-orm');
  await db.run(sql`DELETE FROM dialogue_history`);
}

// Helper to set the user's API key
async function setApiKey(apiKey: string | null) {
  const { eq } = await import('drizzle-orm');
  await db.update(users).set({ openrouterApiKey: apiKey }).where(eq(users.id, 'default'));
}

// ===================================================================
// POST /api/dialogue
// ===================================================================
describe('POST /api/dialogue', () => {
  afterEach(async () => {
    await clearDialogueHistory();
    await setApiKey(null); // Reset to no key
  });

  it('returns a hardcoded fallback response when no API key is set', async () => {
    const res = await app.request('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: 'axiom', message: 'Hello AXIOM' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.character).toBe('axiom');
    expect(json.response).toBeDefined();
    expect(json.response.length).toBeGreaterThan(0);
    expect(json.needsApiKey).toBe(true);
  });

  it('returns a response from AI when API key is set', async () => {
    await setApiKey('test-openrouter-key');

    const res = await app.request('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: 'kael', message: 'Hey Kael!' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.character).toBe('kael');
    expect(json.response).toBeDefined();
    expect(json.response.length).toBeGreaterThan(0);
  });

  it('returns 400 for invalid character', async () => {
    const res = await app.request('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: 'gandalf', message: 'Hello' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid character');
  });

  it('returns 400 for empty message', async () => {
    const res = await app.request('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: 'axiom', message: '' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Message is required');
  });

  it('saves user message and response to dialogue history', async () => {
    await setApiKey('test-openrouter-key');

    await app.request('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: 'mira', message: 'Greetings Mira' }),
    });

    // Check history was saved
    const historyRes = await app.request('/api/dialogue/history?character=mira');
    const historyJson = await historyRes.json();

    expect(historyJson.history.length).toBe(2); // user + assistant
    const userMsg = historyJson.history.find((h: any) => h.role === 'user');
    const assistantMsg = historyJson.history.find((h: any) => h.role === 'assistant');

    expect(userMsg).toBeDefined();
    expect(userMsg.content).toBe('Greetings Mira');
    expect(userMsg.character).toBe('mira');

    expect(assistantMsg).toBeDefined();
    expect(assistantMsg.content.length).toBeGreaterThan(0);
    expect(assistantMsg.character).toBe('mira');
  });
});

// ===================================================================
// GET /api/dialogue/history
// ===================================================================
describe('GET /api/dialogue/history', () => {
  afterEach(async () => {
    await clearDialogueHistory();
    await setApiKey(null);
  });

  it('returns empty array initially', async () => {
    const res = await app.request('/api/dialogue/history');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.history).toBeDefined();
    expect(json.history).toHaveLength(0);
  });

  it('returns history filtered by character', async () => {
    await setApiKey('test-key');

    // Send messages to two different characters
    await app.request('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: 'axiom', message: 'Hello AXIOM' }),
    });
    await app.request('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: 'kael', message: 'Hello Kael' }),
    });

    // Get only axiom history
    const res = await app.request('/api/dialogue/history?character=axiom');
    const json = await res.json();

    expect(json.history.length).toBe(2); // user + assistant for axiom only
    json.history.forEach((entry: any) => {
      expect(entry.character).toBe('axiom');
    });
  });

  it('returns all history when no character filter is provided', async () => {
    await setApiKey('test-key');

    await app.request('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: 'axiom', message: 'Hello AXIOM' }),
    });
    await app.request('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: 'kael', message: 'Hello Kael' }),
    });

    const res = await app.request('/api/dialogue/history');
    const json = await res.json();

    // 2 characters x 2 messages each = 4 entries
    expect(json.history.length).toBe(4);
  });

  it('respects the limit parameter', async () => {
    await setApiKey('test-key');

    // Create several dialogue entries
    await app.request('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: 'axiom', message: 'Message 1' }),
    });
    await app.request('/api/dialogue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character: 'axiom', message: 'Message 2' }),
    });

    const res = await app.request('/api/dialogue/history?character=axiom&limit=2');
    const json = await res.json();

    // limit=2 should return at most 2 entries
    expect(json.history.length).toBeLessThanOrEqual(2);
  });

  it('returns 400 for invalid character in history query', async () => {
    const res = await app.request('/api/dialogue/history?character=invalid_npc');

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Invalid character');
  });
});
