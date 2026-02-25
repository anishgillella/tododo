import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { unlinkSync, existsSync } from 'fs';

let completeMission: typeof import('./gameEngine').completeMission;
let getGameState: typeof import('./gameEngine').getGameState;
let processEndOfDay: typeof import('./gameEngine').processEndOfDay;
let isJackpotDay: typeof import('./gameEngine').isJackpotDay;

let initializeDatabase: () => Promise<void>;
let db: any;
let missions: any;
let agents: any;
let users: any;
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
  const engineModule = await import('./gameEngine');

  initializeDatabase = dbModule.initializeDatabase;
  db = dbModule.db;
  missions = schemaModule.missions;
  agents = schemaModule.agents;
  users = schemaModule.users;
  gameEvents = schemaModule.gameEvents;

  completeMission = engineModule.completeMission;
  getGameState = engineModule.getGameState;
  processEndOfDay = engineModule.processEndOfDay;
  isJackpotDay = engineModule.isJackpotDay;

  await initializeDatabase();
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

// Helper to clear missions and game events between tests
async function clearMissions() {
  const { sql } = await import('drizzle-orm');
  await db.run(sql`DELETE FROM missions`);
  await db.run(sql`DELETE FROM game_events`);
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
    xpReward: 0,
    goldReward: 0,
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

// ===================================================================
// completeMission
// ===================================================================
describe('completeMission', () => {
  afterEach(async () => {
    await clearMissions();
    await resetAgent();
  });

  it('completes a mission and awards XP and gold', async () => {
    const missionId = await insertMission({ title: 'Test completion', difficulty: 2 });

    const result = await completeMission(missionId, 'default');

    expect(result.mission).toBeDefined();
    expect((result.mission as any).status).toBe('completed');
    expect((result.mission as any).completedAt).toBeDefined();
    expect(result.xpGained).toBeGreaterThan(0);
    expect(result.goldGained).toBeGreaterThan(0);
    expect(typeof result.wasCrit).toBe('boolean');
    expect(typeof result.comboBonus).toBe('number');
    expect(typeof result.leveledUp).toBe('boolean');
    expect(result.events).toContain('mission_complete');

    // Verify agent stats were updated
    const agent = await getAgent();
    expect(agent.gold).toBeGreaterThan(0);
    expect(agent.comboCount).toBe(1);
  });

  it('throws error for non-existent mission', async () => {
    await expect(completeMission('nonexistent', 'default')).rejects.toThrow('Mission not found');
  });

  it('throws error for already completed mission', async () => {
    const missionId = await insertMission({ status: 'completed' });
    await expect(completeMission(missionId, 'default')).rejects.toThrow('Mission is not active');
  });

  it('updates personality traits on completion', async () => {
    const missionId = await insertMission({ difficulty: 3 });

    await completeMission(missionId, 'default');

    const agent = await getAgent();
    // discipline and courage should increase by TRAIT_SHIFT_COMPLETE (0.02)
    expect(agent.discipline).toBeCloseTo(0.52, 2);
    expect(agent.courage).toBeCloseTo(0.52, 2);
  });

  it('logs game events on completion', async () => {
    const { eq } = await import('drizzle-orm');
    const missionId = await insertMission({ difficulty: 1 });

    await completeMission(missionId, 'default');

    const events = await db
      .select()
      .from(gameEvents)
      .where(eq(gameEvents.userId, 'default'));

    // Should have at least 1 mission_complete event
    const completeEvents = events.filter((e: any) => e.type === 'mission_complete');
    expect(completeEvents.length).toBe(1);

    const data = JSON.parse(completeEvents[0].data);
    expect(data.missionId).toBe(missionId);
    expect(data.xpGained).toBeGreaterThan(0);
  });
});

// ===================================================================
// completeMission — combo bonuses
// ===================================================================
describe('completeMission with combos', () => {
  afterEach(async () => {
    await clearMissions();
    await resetAgent();
  });

  it('awards combo bonuses for consecutive completions', async () => {
    // Complete 3 missions in a row
    const m1 = await insertMission({ title: 'First' });
    const r1 = await completeMission(m1, 'default');
    expect(r1.comboCount).toBe(1);
    expect(r1.comboBonus).toBe(0); // no bonus at combo 1

    const m2 = await insertMission({ title: 'Second' });
    const r2 = await completeMission(m2, 'default');
    expect(r2.comboCount).toBe(2);
    expect(r2.comboBonus).toBe(5); // combo 2 = +5 XP

    const m3 = await insertMission({ title: 'Third' });
    const r3 = await completeMission(m3, 'default');
    expect(r3.comboCount).toBe(3);
    expect(r3.comboBonus).toBe(15); // combo 3 = +15 XP
  });

  it('awards combo 4 and combo 5 bonuses correctly', async () => {
    // Set combo count to 3 so next completion is combo 4
    await resetAgent({ comboCount: 3 });

    const m4 = await insertMission({ title: 'Fourth' });
    const r4 = await completeMission(m4, 'default');
    expect(r4.comboCount).toBe(4);
    expect(r4.comboBonus).toBe(30); // combo 4 = +30 XP

    const m5 = await insertMission({ title: 'Fifth' });
    const r5 = await completeMission(m5, 'default');
    expect(r5.comboCount).toBe(5);
    expect(r5.comboBonus).toBe(50); // combo 5+ = +50 XP
    expect(r5.overdriveTriggered).toBe(true); // combo >= 5 triggers overdrive
    expect(r5.events).toContain('overdrive_activated');
  });
});

// ===================================================================
// completeMission — level up
// ===================================================================
describe('completeMission level up', () => {
  afterEach(async () => {
    await clearMissions();
    await resetAgent();
  });

  it('levels up the agent when enough XP is earned', async () => {
    // Level 1 requires 50 XP. Set agent to 49 XP with a high-difficulty mission
    // so even base XP (15 for difficulty 1) will push over
    await resetAgent({ xp: 40, level: 1 });

    const missionId = await insertMission({ difficulty: 2 }); // base 30 XP

    const result = await completeMission(missionId, 'default');

    // 40 + 30 (base) = 70 >= 50 required, should level up
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBeGreaterThanOrEqual(2);
    expect(result.events).toContain(`level_up_${result.newLevel}`);

    const agent = await getAgent();
    expect(agent.level).toBeGreaterThanOrEqual(2);
  });

  it('can multi-level when earning massive XP', async () => {
    // Level 1 = 50 XP, Level 2 = 56 XP. Set xp to 100 and complete epic mission (75 base)
    await resetAgent({ xp: 100, level: 1 });

    const missionId = await insertMission({ difficulty: 5 }); // base 75 XP

    const result = await completeMission(missionId, 'default');

    // 100 + 75 = 175. Level 1->2 costs 50 (125 left), Level 2->3 costs 56 (69 left), Level 3->4 costs 63 (6 left)
    // So should be level 4 with 6 remaining
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBeGreaterThanOrEqual(3);

    const agent = await getAgent();
    expect(agent.level).toBeGreaterThanOrEqual(3);
  });
});

// ===================================================================
// getGameState
// ===================================================================
describe('getGameState', () => {
  afterEach(async () => {
    await clearMissions();
    await resetAgent();
  });

  it('returns correct game state shape', async () => {
    // Create some active missions
    await insertMission({ title: 'Active 1' });
    await insertMission({ title: 'Active 2' });

    const state = await getGameState('default');

    // Agent shape
    expect(state.agent).toBeDefined();
    expect(state.agent.xpToNext).toBeDefined();
    expect(typeof state.agent.xpToNext).toBe('number');
    expect((state.agent as any).level).toBeDefined();
    expect((state.agent as any).gold).toBeDefined();
    expect((state.agent as any).hp).toBeDefined();

    // Active missions
    expect(state.activeMissions).toBeDefined();
    expect(Array.isArray(state.activeMissions)).toBe(true);
    expect(state.activeMissions.length).toBe(2);

    // Hollow stage
    expect(state.hollowStage).toBeDefined();
    expect(state.hollowStage).toBe('dormant'); // debt = 0

    // Jackpot day (deterministic for a given day)
    expect(typeof state.isJackpotDay).toBe('boolean');

    // Daily stats
    expect(state.dailyStats).toBeDefined();
    expect(typeof state.dailyStats.completed).toBe('number');
    expect(typeof state.dailyStats.failed).toBe('number');
    expect(typeof state.dailyStats.total).toBe('number');
  });

  it('reflects correct hollow stage when agent has debt', async () => {
    await resetAgent({ debt: 5 });

    const state = await getGameState('default');
    expect(state.hollowStage).toBe('presence'); // debt 4-6
  });

  it('returns isJackpotDay consistently for the same date', () => {
    // isJackpotDay is deterministic for a given date string
    const date = '2026-02-25';
    const result1 = isJackpotDay(date);
    const result2 = isJackpotDay(date);
    expect(result1).toBe(result2);
  });

  it('counts daily stats correctly', async () => {
    const today = new Date().toISOString().slice(0, 10);

    // Create and complete a mission today
    const m1 = await insertMission({ title: 'Will complete', createdAt: new Date().toISOString() });
    await completeMission(m1, 'default');

    // Create an active mission
    await insertMission({ title: 'Still active', createdAt: new Date().toISOString() });

    const state = await getGameState('default');
    expect(state.dailyStats.completed).toBe(1);
    expect(state.activeMissions.length).toBe(1);
  });
});

// ===================================================================
// processEndOfDay — all tasks complete
// ===================================================================
describe('processEndOfDay with all tasks complete', () => {
  afterEach(async () => {
    await clearMissions();
    await resetAgent();
  });

  it('holds streak when all missions are completed', async () => {
    await resetAgent({ streakDays: 5, streakTier: 'blaze', hp: 100 });

    // Create and complete missions
    const m1 = await insertMission({ title: 'Done 1' });
    await completeMission(m1, 'default');
    const m2 = await insertMission({ title: 'Done 2' });
    await completeMission(m2, 'default');

    // No active missions remain — all completed
    const result = await processEndOfDay('default');

    expect(result.missionsCompleted).toBe(2);
    expect(result.missionsFailed).toBe(0);
    expect(result.hpDamage).toBe(0);
    expect(result.streakHeld).toBe(true);
    expect(result.debtAdded).toBe(0);
    expect(result.events).toContain('day_end');
    expect(result.events).not.toContain('streak_broken');

    // Verify agent HP is unchanged
    const agent = await getAgent();
    expect(agent.hp).toBe(100);
    expect(agent.comboCount).toBe(0); // reset at end of day
  });

  it('holds streak with 80% completion rate', async () => {
    await resetAgent({ streakDays: 3, streakTier: 'flame' });

    // Complete 4 out of 5 missions (80%)
    const today = new Date().toISOString();
    for (let i = 0; i < 4; i++) {
      const m = await insertMission({ title: `Done ${i}`, createdAt: today });
      await completeMission(m, 'default');
    }
    // Leave 1 active (failed)
    await insertMission({ title: 'Missed', createdAt: today });

    const result = await processEndOfDay('default');

    expect(result.missionsCompleted).toBe(4);
    expect(result.missionsFailed).toBe(1);
    expect(result.completionRate).toBe(0.8);
    expect(result.streakHeld).toBe(true);
  });
});

// ===================================================================
// processEndOfDay — tasks incomplete
// ===================================================================
describe('processEndOfDay with tasks incomplete', () => {
  afterEach(async () => {
    await clearMissions();
    await resetAgent();
  });

  it('decays streak and applies HP damage when below 80% completion', async () => {
    // Set lastCompletionDate to today so completeMission does not increment streak
    const today = new Date().toISOString();
    await resetAgent({
      streakDays: 10,
      streakTier: 'blaze',
      hp: 100,
      lastCompletionDate: today,
    });

    // Complete 1 out of 4 missions (25%)
    const m1 = await insertMission({ title: 'Done', createdAt: today });
    await completeMission(m1, 'default');

    await insertMission({ title: 'Missed 1', createdAt: today });
    await insertMission({ title: 'Missed 2', createdAt: today });
    await insertMission({ title: 'Missed 3', createdAt: today });

    const result = await processEndOfDay('default');

    expect(result.missionsCompleted).toBe(1);
    expect(result.missionsFailed).toBe(3);
    expect(result.completionRate).toBe(0.25);
    expect(result.streakHeld).toBe(false);
    expect(result.hpDamage).toBeGreaterThan(0);
    expect(result.debtAdded).toBe(3);
    expect(result.events).toContain('streak_broken');

    // Streak should decay (drifter mode: 75% of current)
    // 10 * 0.75 = 7.5 -> floor = 7
    expect(result.newStreakDays).toBe(7);

    // Verify agent
    const agent = await getAgent();
    expect(agent.hp).toBeLessThan(100);
    expect(agent.debt).toBe(3);
    expect(agent.consecutiveFailDays).toBe(1);
  });

  it('increases debt for each failed mission', async () => {
    await resetAgent({ debt: 2 });

    await insertMission({ title: 'Missed 1', difficulty: 3 });
    await insertMission({ title: 'Missed 2', difficulty: 1 });

    const result = await processEndOfDay('default');

    expect(result.missionsFailed).toBe(2);
    expect(result.debtAdded).toBe(2);

    const agent = await getAgent();
    expect(agent.debt).toBe(4); // was 2, added 2
  });

  it('applies HP damage based on mission difficulty', async () => {
    await resetAgent({ hp: 100 });

    // Epic difficulty (5) should deal more damage than Quick (1)
    await insertMission({ title: 'Epic miss', difficulty: 5 });

    const result = await processEndOfDay('default');

    // Difficulty 5, carryOver 0, drifter mode (mult 1.0): (5*5 + 0*3) * 1 = 25
    expect(result.hpDamage).toBe(25);

    const agent = await getAgent();
    expect(agent.hp).toBe(75);
  });

  it('resets combo count at end of day', async () => {
    await resetAgent({ comboCount: 4 });

    const result = await processEndOfDay('default');

    const agent = await getAgent();
    expect(agent.comboCount).toBe(0);
  });
});

// ===================================================================
// processEndOfDay — carry-over missions
// ===================================================================
describe('processEndOfDay carries over failed missions', () => {
  afterEach(async () => {
    await clearMissions();
    await resetAgent();
  });

  it('increments carryOverCount on failed missions', async () => {
    const { eq } = await import('drizzle-orm');

    const missionId = await insertMission({
      title: 'Carried over',
      difficulty: 2,
      carryOverCount: 1, // already carried over once
    });

    await processEndOfDay('default');

    // Check mission in DB
    const missionRows = await db
      .select()
      .from(missions)
      .where(eq(missions.id, missionId));

    expect(missionRows[0].status).toBe('carried_over');
    expect(missionRows[0].carryOverCount).toBe(2); // incremented from 1 to 2
  });

  it('applies increasing HP damage for carried-over missions', async () => {
    await resetAgent({ hp: 100 });

    // Mission with carryOverCount=2, difficulty 2
    // Damage = (2*5 + 2*3) * 1.0 = 16
    await insertMission({
      title: 'Carried twice',
      difficulty: 2,
      carryOverCount: 2,
    });

    const result = await processEndOfDay('default');

    expect(result.hpDamage).toBe(16);
    const agent = await getAgent();
    expect(agent.hp).toBe(84);
  });

  it('handles multiple carried-over missions', async () => {
    await resetAgent({ hp: 100 });

    await insertMission({ title: 'Miss 1', difficulty: 1, carryOverCount: 0 });
    await insertMission({ title: 'Miss 2', difficulty: 3, carryOverCount: 1 });

    const result = await processEndOfDay('default');

    expect(result.missionsFailed).toBe(2);
    expect(result.missionsCarriedOver).toBe(2);

    // Miss 1: (1*5 + 0*3) * 1 = 5
    // Miss 2: (3*5 + 1*3) * 1 = 18
    expect(result.hpDamage).toBe(23);
  });
});
