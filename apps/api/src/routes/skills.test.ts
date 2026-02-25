import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { unlinkSync, existsSync } from 'fs';

let app: Hono;
let initializeDatabase: () => Promise<void>;
let db: any;
let agents: any;
let agentSkills: any;

const TEST_DB = './test-tododo.db';

beforeAll(async () => {
  if (existsSync(TEST_DB)) {
    unlinkSync(TEST_DB);
  }

  const dbModule = await import('../db/index');
  const schemaModule = await import('../db/schema');
  initializeDatabase = dbModule.initializeDatabase;
  db = dbModule.db;
  agents = schemaModule.agents;
  agentSkills = schemaModule.agentSkills;

  await initializeDatabase();

  const skillsRouter = (await import('./skills')).default;
  app = new Hono();
  app.route('/api/skills', skillsRouter);
});

afterAll(() => {
  try {
    if (existsSync(TEST_DB)) {
      unlinkSync(TEST_DB);
    }
  } catch {
    // ignore cleanup errors
  }
});

// Helper to clear agent skills and reset agent
async function resetState() {
  const { sql } = await import('drizzle-orm');
  const { eq } = await import('drizzle-orm');
  await db.run(sql`DELETE FROM agent_skills`);
  await db
    .update(agents)
    .set({ xp: 0, gold: 0, level: 1 })
    .where(eq(agents.userId, 'default'));
}

// Helper to set agent XP and level
async function setAgent(values: { xp?: number; level?: number; gold?: number }) {
  const { eq } = await import('drizzle-orm');
  await db.update(agents).set(values).where(eq(agents.userId, 'default'));
}

// ===================================================================
// GET /api/skills — Return skill tree
// ===================================================================
describe('GET /api/skills', () => {
  afterEach(async () => {
    await resetState();
  });

  it('returns the full skill tree and empty purchased list', async () => {
    const res = await app.request('/api/skills');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skills).toBeDefined();
    expect(Array.isArray(json.skills)).toBe(true);
    expect(json.skills.length).toBeGreaterThan(0);
    expect(json.purchased).toBeDefined();
    expect(json.purchased).toHaveLength(0);

    // Check that each skill has the expected shape
    const skill = json.skills[0];
    expect(skill.id).toBeDefined();
    expect(skill.name).toBeDefined();
    expect(skill.category).toBeDefined();
    expect(skill.description).toBeDefined();
    expect(skill.maxLevel).toBeDefined();
    expect(skill.requiredLevel).toBeDefined();
  });

  it('includes all 4 categories', async () => {
    const res = await app.request('/api/skills');
    const json = await res.json();

    const categories = [...new Set(json.skills.map((s: any) => s.category))];
    expect(categories).toContain('discipline');
    expect(categories).toContain('courage');
    expect(categories).toContain('wisdom');
    expect(categories).toContain('luck');
  });
});

// ===================================================================
// POST /api/skills/purchase — Purchase a skill
// ===================================================================
describe('POST /api/skills/purchase', () => {
  afterEach(async () => {
    await resetState();
  });

  it('successfully purchases a skill and deducts XP', async () => {
    // Focus requires level 1, costs 100*1*1.5 = 150 XP for level 1
    await setAgent({ xp: 500, level: 1 });

    const res = await app.request('/api/skills/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: 'focus' }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.skill).toBeDefined();
    expect(json.skill.skillId).toBe('focus');
    expect(json.skill.level).toBe(1);
    expect(json.xpSpent).toBe(150); // 100 * 1 * 1.5
    expect(json.remainingXp).toBe(350);
    expect(json.upgraded).toBe(false);
  });

  it('rejects when not enough XP', async () => {
    await setAgent({ xp: 10, level: 1 });

    const res = await app.request('/api/skills/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: 'focus' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Not enough XP/);
  });

  it('rejects when level requirement not met', async () => {
    // endurance requires level 3
    await setAgent({ xp: 1000, level: 1 });

    const res = await app.request('/api/skills/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: 'endurance' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/level 3/);
  });

  it('rejects when prerequisite skill not learned', async () => {
    // endurance requires focus as prerequisite
    await setAgent({ xp: 1000, level: 5 });

    const res = await app.request('/api/skills/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: 'endurance' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Prerequisite/);
  });

  it('upgrades an existing skill', async () => {
    // Buy focus level 1 first
    await setAgent({ xp: 1000, level: 1 });

    const buyRes = await app.request('/api/skills/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: 'focus' }),
    });
    expect(buyRes.status).toBe(201);

    // Now upgrade to level 2 (cost = 100 * 2 * 1.5 = 300)
    const upgradeRes = await app.request('/api/skills/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: 'focus' }),
    });

    expect(upgradeRes.status).toBe(200);
    const json = await upgradeRes.json();
    expect(json.skill.level).toBe(2);
    expect(json.xpSpent).toBe(300);
    expect(json.upgraded).toBe(true);
  });

  it('rejects invalid skillId', async () => {
    const res = await app.request('/api/skills/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: 'nonexistent' }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Skill not found');
  });
});

// ===================================================================
// GET /api/skills/mine — Return agent's purchased skills
// ===================================================================
describe('GET /api/skills/mine', () => {
  afterEach(async () => {
    await resetState();
  });

  it('returns empty skills when none purchased', async () => {
    const res = await app.request('/api/skills/mine');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skills).toBeDefined();
    expect(json.skills).toHaveLength(0);
  });

  it('returns purchased skills after buying some', async () => {
    await setAgent({ xp: 500, level: 1 });

    // Buy focus
    await app.request('/api/skills/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: 'focus' }),
    });

    // Buy battle_ready (courage, no prereq at level 1)
    await app.request('/api/skills/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: 'battle_ready' }),
    });

    const res = await app.request('/api/skills/mine');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skills).toHaveLength(2);

    const skillIds = json.skills.map((s: any) => s.skillId);
    expect(skillIds).toContain('focus');
    expect(skillIds).toContain('battle_ready');
  });
});
