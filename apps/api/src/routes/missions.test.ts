import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { unlinkSync, existsSync } from 'fs';

// DB_PATH is set via vitest.config.ts env before module evaluation

let app: Hono;
let initializeDatabase: () => Promise<void>;
let db: any;
let missions: any;
let agents: any;

const TEST_DB = './test-tododo.db';

beforeAll(async () => {
  // Clean up any leftover test database
  if (existsSync(TEST_DB)) {
    unlinkSync(TEST_DB);
  }

  // Dynamic imports so DB_PATH env is read at the right time
  const dbModule = await import('../db/index');
  const schemaModule = await import('../db/schema');
  initializeDatabase = dbModule.initializeDatabase;
  db = dbModule.db;
  missions = schemaModule.missions;
  agents = schemaModule.agents;

  await initializeDatabase();

  // Build a mini Hono app that mounts only the missions router
  const missionsRouter = (await import('./missions')).default;
  app = new Hono();
  app.route('/api/missions', missionsRouter);
});

afterAll(() => {
  // Clean up test database file
  try {
    if (existsSync(TEST_DB)) {
      unlinkSync(TEST_DB);
    }
  } catch {
    // ignore cleanup errors
  }
});

// Helper to clear missions table between tests
async function clearMissions() {
  const { sql } = await import('drizzle-orm');
  await db.run(sql`DELETE FROM missions`);
}

// Helper to reset agent combo count
async function resetAgent() {
  const { eq } = await import('drizzle-orm');
  await db
    .update(agents)
    .set({ comboCount: 0, xp: 0, gold: 0, level: 1 })
    .where(eq(agents.userId, 'default'));
}

// Helper to create a mission via the API
async function createMission(data: {
  title: string;
  description?: string;
  difficulty?: number;
  dueDate?: string;
}) {
  const res = await app.request('/api/missions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res;
}

// ===================================================================
// POST /api/missions — Create Mission
// ===================================================================
describe('POST /api/missions', () => {
  afterEach(async () => {
    await clearMissions();
  });

  it('creates a mission with valid data and returns 201', async () => {
    const res = await createMission({
      title: 'Buy groceries',
      description: 'Milk, eggs, bread',
      difficulty: 2,
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.mission).toBeDefined();
    expect(json.mission.title).toBe('Buy groceries');
    expect(json.mission.description).toBe('Milk, eggs, bread');
    expect(json.mission.difficulty).toBe(2);
    expect(json.mission.status).toBe('active');
    expect(json.mission.xpReward).toBe(30); // Standard difficulty baseXp
    expect(json.mission.goldReward).toBe(10); // Standard difficulty baseGoldMin
    expect(json.mission.id).toBeDefined();
    expect(json.mission.createdAt).toBeDefined();
  });

  it('creates a mission with default difficulty when none specified', async () => {
    const res = await createMission({ title: 'Default difficulty task' });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.mission.difficulty).toBe(2);
  });

  it('creates a mission with difficulty 1 (Quick)', async () => {
    const res = await createMission({ title: 'Quick task', difficulty: 1 });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.mission.difficulty).toBe(1);
    expect(json.mission.xpReward).toBe(15);
    expect(json.mission.goldReward).toBe(5);
  });

  it('creates a mission with difficulty 5 (Epic)', async () => {
    const res = await createMission({ title: 'Epic task', difficulty: 5 });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.mission.difficulty).toBe(5);
    expect(json.mission.xpReward).toBe(75);
    expect(json.mission.goldReward).toBe(25);
  });

  it('rejects empty title with 400', async () => {
    const res = await createMission({ title: '' });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Title is required');
  });

  it('rejects whitespace-only title with 400', async () => {
    const res = await createMission({ title: '   ' });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Title is required');
  });

  it('rejects invalid difficulty (0) with 400', async () => {
    const res = await createMission({ title: 'Bad difficulty', difficulty: 0 });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Difficulty must be 1-5');
  });

  it('rejects invalid difficulty (6) with 400', async () => {
    const res = await createMission({ title: 'Bad difficulty', difficulty: 6 });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Difficulty must be 1-5');
  });

  it('trims the mission title', async () => {
    const res = await createMission({ title: '  Trimmed title  ' });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.mission.title).toBe('Trimmed title');
  });

  it('stores dueDate when provided', async () => {
    const dueDate = '2026-03-01';
    const res = await createMission({ title: 'Due soon', dueDate });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.mission.dueDate).toBe(dueDate);
  });
});

// ===================================================================
// GET /api/missions — List Missions
// ===================================================================
describe('GET /api/missions', () => {
  afterEach(async () => {
    await clearMissions();
  });

  it('returns empty mission list initially', async () => {
    const res = await app.request('/api/missions');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.missions).toBeDefined();
    expect(json.missions).toHaveLength(0);
  });

  it('returns missions after creating some', async () => {
    await createMission({ title: 'Mission A' });
    await createMission({ title: 'Mission B' });
    await createMission({ title: 'Mission C' });

    const res = await app.request('/api/missions');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.missions).toHaveLength(3);

    const titles = json.missions.map((m: any) => m.title);
    expect(titles).toContain('Mission A');
    expect(titles).toContain('Mission B');
    expect(titles).toContain('Mission C');
  });

  it('only returns active missions (not completed ones)', async () => {
    const createRes = await createMission({ title: 'Will complete' });
    const created = await createRes.json();
    const missionId = created.mission.id;

    // Complete the mission
    await app.request(`/api/missions/${missionId}/complete`, { method: 'POST' });

    // Create another active mission
    await createMission({ title: 'Still active' });

    const res = await app.request('/api/missions');
    const json = await res.json();

    expect(json.missions).toHaveLength(1);
    expect(json.missions[0].title).toBe('Still active');
  });
});

// ===================================================================
// PUT /api/missions/:id — Update Mission
// ===================================================================
describe('PUT /api/missions/:id', () => {
  afterEach(async () => {
    await clearMissions();
  });

  it('updates mission title', async () => {
    const createRes = await createMission({ title: 'Original title' });
    const created = await createRes.json();
    const id = created.mission.id;

    const res = await app.request(`/api/missions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Updated title' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.mission.title).toBe('Updated title');
  });

  it('updates mission description', async () => {
    const createRes = await createMission({ title: 'Test', description: 'Old desc' });
    const created = await createRes.json();
    const id = created.mission.id;

    const res = await app.request(`/api/missions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: 'New description' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.mission.description).toBe('New description');
  });

  it('updates mission difficulty and recalculates rewards', async () => {
    const createRes = await createMission({ title: 'Test', difficulty: 1 });
    const created = await createRes.json();
    const id = created.mission.id;

    // Difficulty 1: xp=15, gold=5
    expect(created.mission.xpReward).toBe(15);
    expect(created.mission.goldReward).toBe(5);

    const res = await app.request(`/api/missions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty: 4 }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    // Difficulty 4: xp=60, gold=20
    expect(json.mission.difficulty).toBe(4);
    expect(json.mission.xpReward).toBe(60);
    expect(json.mission.goldReward).toBe(20);
  });

  it('rejects invalid difficulty on update with 400', async () => {
    const createRes = await createMission({ title: 'Test' });
    const created = await createRes.json();
    const id = created.mission.id;

    const res = await app.request(`/api/missions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty: 10 }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Difficulty must be 1-5');
  });

  it('returns 404 for non-existent mission', async () => {
    const res = await app.request('/api/missions/nonexistent-id', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Nope' }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Mission not found');
  });

  it('updates dueDate', async () => {
    const createRes = await createMission({ title: 'Test' });
    const created = await createRes.json();
    const id = created.mission.id;

    const res = await app.request(`/api/missions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate: '2026-12-31' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.mission.dueDate).toBe('2026-12-31');
  });
});

// ===================================================================
// DELETE /api/missions/:id — Delete Mission
// ===================================================================
describe('DELETE /api/missions/:id', () => {
  afterEach(async () => {
    await clearMissions();
  });

  it('deletes a mission successfully', async () => {
    const createRes = await createMission({ title: 'To delete' });
    const created = await createRes.json();
    const id = created.mission.id;

    const res = await app.request(`/api/missions/${id}`, { method: 'DELETE' });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    // Verify mission is actually gone
    const listRes = await app.request('/api/missions');
    const listJson = await listRes.json();
    expect(listJson.missions).toHaveLength(0);
  });

  it('returns 404 for non-existent mission', async () => {
    const res = await app.request('/api/missions/nonexistent-id', { method: 'DELETE' });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Mission not found');
  });

  it('cannot delete the same mission twice', async () => {
    const createRes = await createMission({ title: 'Double delete' });
    const created = await createRes.json();
    const id = created.mission.id;

    // First delete succeeds
    const res1 = await app.request(`/api/missions/${id}`, { method: 'DELETE' });
    expect(res1.status).toBe(200);

    // Second delete returns 404
    const res2 = await app.request(`/api/missions/${id}`, { method: 'DELETE' });
    expect(res2.status).toBe(404);
  });
});

// ===================================================================
// POST /api/missions/:id/complete — Complete Mission
// ===================================================================
describe('POST /api/missions/:id/complete', () => {
  afterEach(async () => {
    await clearMissions();
    await resetAgent();
  });

  it('completes a mission and returns XP/gold rewards', async () => {
    const createRes = await createMission({ title: 'Complete me', difficulty: 2 });
    const created = await createRes.json();
    const id = created.mission.id;

    const res = await app.request(`/api/missions/${id}/complete`, { method: 'POST' });

    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.mission).toBeDefined();
    expect(json.mission.status).toBe('completed');
    expect(json.mission.completedAt).toBeDefined();
    expect(json.xpGained).toBeGreaterThan(0);
    expect(json.goldGained).toBeGreaterThan(0);
    expect(typeof json.wasCrit).toBe('boolean');
    expect(typeof json.comboBonus).toBe('number');
    expect(typeof json.leveledUp).toBe('boolean');
  });

  it('rejects completing an already-completed mission', async () => {
    const createRes = await createMission({ title: 'Already done' });
    const created = await createRes.json();
    const id = created.mission.id;

    // Complete once
    await app.request(`/api/missions/${id}/complete`, { method: 'POST' });

    // Try to complete again
    const res = await app.request(`/api/missions/${id}/complete`, { method: 'POST' });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Mission is not active');
  });

  it('returns 404 for non-existent mission', async () => {
    const res = await app.request('/api/missions/nonexistent-id/complete', { method: 'POST' });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Mission not found');
  });

  it('increments combo count on successive completions', async () => {
    // Complete first mission
    const res1 = await createMission({ title: 'First' });
    const m1 = (await res1.json()).mission;
    const complete1 = await app.request(`/api/missions/${m1.id}/complete`, { method: 'POST' });
    const c1 = await complete1.json();
    expect(c1.comboBonus).toBe(0); // combo count becomes 1, no bonus at 1

    // Complete second mission
    const res2 = await createMission({ title: 'Second' });
    const m2 = (await res2.json()).mission;
    const complete2 = await app.request(`/api/missions/${m2.id}/complete`, { method: 'POST' });
    const c2 = await complete2.json();
    expect(c2.comboBonus).toBe(5); // combo count becomes 2, bonus = 5

    // Complete third mission
    const res3 = await createMission({ title: 'Third' });
    const m3 = (await res3.json()).mission;
    const complete3 = await app.request(`/api/missions/${m3.id}/complete`, { method: 'POST' });
    const c3 = await complete3.json();
    expect(c3.comboBonus).toBe(15); // combo count becomes 3, bonus = 15
  });

  it('updates agent XP and gold after completion', async () => {
    const { eq } = await import('drizzle-orm');

    const createRes = await createMission({ title: 'Reward check', difficulty: 3 });
    const created = await createRes.json();
    const id = created.mission.id;

    // Get agent before completion
    const agentBefore = (
      await db.select().from(agents).where(eq(agents.userId, 'default'))
    )[0];

    const res = await app.request(`/api/missions/${id}/complete`, { method: 'POST' });
    const json = await res.json();

    // Get agent after completion
    const agentAfter = (
      await db.select().from(agents).where(eq(agents.userId, 'default'))
    )[0];

    // Agent gold should have increased
    expect(agentAfter.gold).toBe((agentBefore.gold ?? 0) + json.goldGained);

    // Agent combo count should have incremented
    expect(agentAfter.comboCount).toBe((agentBefore.comboCount ?? 0) + 1);
  });

  it('awards correct XP for each difficulty level', async () => {
    // We test difficulty 1 which has baseXp=15
    // Note: XP may include crit bonus (5% chance), so we check minimum
    const createRes = await createMission({ title: 'Quick one', difficulty: 1 });
    const created = await createRes.json();
    const id = created.mission.id;

    const res = await app.request(`/api/missions/${id}/complete`, { method: 'POST' });
    const json = await res.json();

    // Base XP for difficulty 1 is 15, with no streak bonus the xpGained should be >= 15
    // (could be 30 if crit, which is 2x)
    expect(json.xpGained).toBeGreaterThanOrEqual(15);
    // combo bonus is 0 for first completion (comboCount=1 has no bonus)
    // so totalXp = xp from calculateMissionXp + 0
    expect(json.comboBonus).toBe(0);
  });
});
