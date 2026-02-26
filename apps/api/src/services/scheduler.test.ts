import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { unlinkSync, existsSync } from 'fs';

let runEndOfDay: typeof import('./scheduler').runEndOfDay;
let getRecap: typeof import('./scheduler').getRecap;
let listRecaps: typeof import('./scheduler').listRecaps;

let initializeDatabase: () => Promise<void>;
let db: any;
let missions: any;
let agents: any;
let users: any;
let dailyRecaps: any;
let gameEvents: any;

const TEST_DB = './test-tododo.db';

beforeAll(async () => {
  // Clean up any leftover test database
  if (existsSync(TEST_DB)) {
    unlinkSync(TEST_DB);
  }

  // Dynamic imports so DB_PATH env is read at the right time
  const dbModule = await import('../db/index');
  const schemaModule = await import('../db/schema');
  const schedulerModule = await import('./scheduler');

  initializeDatabase = dbModule.initializeDatabase;
  db = dbModule.db;
  missions = schemaModule.missions;
  agents = schemaModule.agents;
  users = schemaModule.users;
  dailyRecaps = schemaModule.dailyRecaps;
  gameEvents = schemaModule.gameEvents;

  runEndOfDay = schedulerModule.runEndOfDay;
  getRecap = schedulerModule.getRecap;
  listRecaps = schedulerModule.listRecaps;

  await initializeDatabase();

  // Clear seed data created during initialization
  const { sql: sqlTag } = await import('drizzle-orm');
  await db.run(sqlTag`DELETE FROM missions`);
  await db.run(sqlTag`DELETE FROM categories`);
  await db.run(sqlTag`DELETE FROM game_events`);
  await db.run(sqlTag`DELETE FROM daily_recaps`);
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

// Helper to clear missions, recaps, and game events between tests
async function clearData() {
  const { sql } = await import('drizzle-orm');
  await db.run(sql`DELETE FROM missions`);
  await db.run(sql`DELETE FROM game_events`);
  await db.run(sql`DELETE FROM daily_recaps`);
}

// Helper to reset agent to baseline
async function resetAgent(overrides: Record<string, unknown> = {}) {
  const { eq } = await import('drizzle-orm');
  await db
    .update(agents)
    .set({
      comboCount: 0,
      xp: 0,
      gold: 0,
      level: 1,
      hp: 100,
      maxHp: 100,
      streakDays: 0,
      streakTier: 'none',
      streakShields: 1,
      debt: 0,
      consecutiveFailDays: 0,
      discipline: 0.5,
      courage: 0.5,
      wisdom: 0.5,
      charisma: 0.5,
      overdriveUntil: null,
      lastCompletionDate: null,
      ...overrides,
    })
    .where(eq(agents.userId, 'default'));
}

// Helper to create a mission directly in DB
async function insertMission(overrides: Partial<{
  id: string;
  title: string;
  difficulty: number;
  status: string;
  carryOverCount: number;
  dueDate: string;
  createdAt: string;
  completedAt: string | null;
  xpReward: number;
  goldReward: number;
}> = {}) {
  const { nanoid } = await import('nanoid');
  const id = overrides.id ?? nanoid();
  const now = new Date().toISOString();
  await db.insert(missions).values({
    id,
    userId: 'default',
    title: overrides.title ?? 'Test Mission',
    description: null,
    difficulty: overrides.difficulty ?? 2,
    status: overrides.status ?? 'active',
    xpReward: overrides.xpReward ?? 0,
    goldReward: overrides.goldReward ?? 0,
    narrativeFlavor: null,
    carryOverCount: overrides.carryOverCount ?? 0,
    dueDate: overrides.dueDate ?? null,
    createdAt: overrides.createdAt ?? now,
    completedAt: overrides.completedAt ?? null,
  });
  return id;
}

// Helper to get agent from DB
async function getAgent() {
  const { eq } = await import('drizzle-orm');
  const rows = await db.select().from(agents).where(eq(agents.userId, 'default'));
  return rows[0];
}

// Helper to get a mission by ID
async function getMission(id: string) {
  const { eq } = await import('drizzle-orm');
  const rows = await db.select().from(missions).where(eq(missions.id, id));
  return rows[0];
}

// ===================================================================
// Full end-of-day with all missions complete
// ===================================================================
describe('runEndOfDay — all missions complete', () => {
  afterEach(async () => {
    await clearData();
    await resetAgent();
  });

  it('saves recap, updates agent, and increments streak', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    await resetAgent({ streakDays: 3, streakTier: 'flame', hp: 100 });

    // Create completed missions for today
    await insertMission({
      title: 'Done 1',
      status: 'completed',
      completedAt: now,
      xpReward: 30,
      goldReward: 10,
    });
    await insertMission({
      title: 'Done 2',
      status: 'completed',
      completedAt: now,
      xpReward: 45,
      goldReward: 15,
    });

    const report = await runEndOfDay('default');

    // Report shape
    expect(report.date).toBe(today);
    expect(report.missionsCompleted).toBe(2);
    expect(report.missionsFailed).toBe(0);
    expect(report.consequences.hpDamage).toBe(0);
    expect(report.consequences.debtChange).toBe(0);
    expect(report.consequences.streakResult.held).toBe(true);
    expect(report.consequences.streakResult.newDays).toBe(4);
    expect(report.narrative).toBeDefined();
    expect(report.axiomCommentary).toBeDefined();
    expect(report.kaelReaction).toBeDefined();

    // Agent snapshot
    expect(report.agentSnapshot).toBeDefined();
    expect(report.agentSnapshot.hp).toBe(100);
    expect(report.agentSnapshot.streakDays).toBe(4);

    // Verify agent in DB
    const agent = await getAgent();
    expect(agent.hp).toBe(100);
    expect(agent.streakDays).toBe(4);
    expect(agent.debt).toBe(0);
    expect(agent.comboCount).toBe(0); // reset

    // Verify recap was saved
    const recap = await getRecap('default', today);
    expect(recap).not.toBeNull();
    expect(recap!.missionsCompleted).toBe(2);
    expect(recap!.missionsFailed).toBe(0);
    expect(recap!.xpEarned).toBe(75);
    expect(recap!.goldEarned).toBe(25);
    expect(recap!.hpChange).toBe(0);
    expect(recap!.narrative).toBeDefined();
  });
});

// ===================================================================
// End-of-day with failed missions
// ===================================================================
describe('runEndOfDay — failed missions', () => {
  afterEach(async () => {
    await clearData();
    await resetAgent();
  });

  it('decreases HP, increases debt, and applies carry-over', async () => {
    const now = new Date().toISOString();
    await resetAgent({ hp: 100, debt: 1, streakDays: 5, streakShields: 0 });

    // One completed, two active (will fail)
    await insertMission({
      title: 'Done',
      status: 'completed',
      completedAt: now,
      xpReward: 30,
      goldReward: 10,
    });
    const failId1 = await insertMission({
      title: 'Failed 1',
      difficulty: 2,
      carryOverCount: 0,
    });
    const failId2 = await insertMission({
      title: 'Failed 2',
      difficulty: 3,
      carryOverCount: 1,
    });

    const report = await runEndOfDay('default');

    // 1 completed, 2 failed = 33% < 80%
    expect(report.missionsCompleted).toBe(1);
    expect(report.missionsFailed).toBe(2);
    expect(report.consequences.hpDamage).toBeGreaterThan(0);
    expect(report.consequences.debtChange).toBe(2);
    expect(report.consequences.streakResult.held).toBe(false);

    // Verify agent in DB
    const agent = await getAgent();
    expect(agent.hp).toBeLessThan(100);
    expect(agent.debt).toBe(3); // was 1, added 2
    expect(agent.consecutiveFailDays).toBe(1);

    // HP damage: (2*5+0*3)*1.0 + (3*5+1*3)*1.0 = 10 + 18 = 28
    expect(report.consequences.hpDamage).toBe(28);
    expect(agent.hp).toBe(72);

    // Verify missions were carried over
    const m1 = await getMission(failId1);
    expect(m1.status).toBe('carried_over');
    expect(m1.carryOverCount).toBe(1);

    const m2 = await getMission(failId2);
    expect(m2.status).toBe('carried_over');
    expect(m2.carryOverCount).toBe(2);
  });
});

// ===================================================================
// Daily recap is saved correctly
// ===================================================================
describe('Daily recap persistence', () => {
  afterEach(async () => {
    await clearData();
    await resetAgent();
  });

  it('saves daily recap to DB with correct fields', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    await resetAgent({ hp: 100, streakDays: 1, debt: 0 });

    await insertMission({
      title: 'Done 1',
      status: 'completed',
      completedAt: now,
      xpReward: 30,
      goldReward: 10,
    });
    await insertMission({
      title: 'Failed 1',
      difficulty: 1,
      carryOverCount: 0,
    });

    await runEndOfDay('default');

    // Query recap directly
    const recap = await getRecap('default', today);
    expect(recap).not.toBeNull();
    expect(recap!.date).toBe(today);
    expect(recap!.missionsCompleted).toBe(1);
    expect(recap!.missionsFailed).toBe(1);
    expect(recap!.xpEarned).toBe(30);
    expect(recap!.goldEarned).toBe(10);
    expect(recap!.hpChange).toBeLessThanOrEqual(0);
    expect(recap!.narrative).toContain('1 of 2 missions');
    expect(recap!.axiomCommentary).toBeDefined();
    expect(recap!.kaelReaction).toBeDefined();
    expect(recap!.statsSnapshot).toBeDefined();
    expect(typeof recap!.statsSnapshot).toBe('object'); // parsed from JSON
    expect(recap!.statsSnapshot.hp).toBeDefined();
    expect(recap!.statsSnapshot.streakDays).toBeDefined();
  });

  it('lists recent recaps in correct order', async () => {
    const now = new Date().toISOString();

    // Create a recap via runEndOfDay
    await insertMission({
      title: 'Done',
      status: 'completed',
      completedAt: now,
      xpReward: 15,
      goldReward: 5,
    });

    await runEndOfDay('default');

    const recaps = await listRecaps('default', 10);
    expect(recaps.length).toBeGreaterThanOrEqual(1);
    expect(recaps[0].date).toBeDefined();
    expect(recaps[0].narrative).toBeDefined();
  });
});

// ===================================================================
// Carried-over missions
// ===================================================================
describe('Carried-over missions', () => {
  afterEach(async () => {
    await clearData();
    await resetAgent();
  });

  it('increments carryOverCount and sets status to carried_over', async () => {
    await resetAgent({ hp: 100 });

    const missionId = await insertMission({
      title: 'Will carry over',
      difficulty: 2,
      carryOverCount: 1,
    });

    await runEndOfDay('default');

    const m = await getMission(missionId);
    expect(m.status).toBe('carried_over');
    expect(m.carryOverCount).toBe(2);
  });

  it('handles multiple carry-overs with correct counts', async () => {
    await resetAgent({ hp: 100 });

    const id1 = await insertMission({ title: 'First carry', carryOverCount: 0 });
    const id2 = await insertMission({ title: 'Second carry', carryOverCount: 3 });
    const id3 = await insertMission({ title: 'Third carry', carryOverCount: 0 });

    await runEndOfDay('default');

    const m1 = await getMission(id1);
    expect(m1.status).toBe('carried_over');
    expect(m1.carryOverCount).toBe(1);

    const m2 = await getMission(id2);
    expect(m2.status).toBe('carried_over');
    expect(m2.carryOverCount).toBe(4);

    const m3 = await getMission(id3);
    expect(m3.status).toBe('carried_over');
    expect(m3.carryOverCount).toBe(1);
  });
});
