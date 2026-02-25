import { beforeAll, afterAll, afterEach, describe, it, expect, vi } from 'vitest';
import { unlinkSync, existsSync } from 'fs';

let initiateBossFight: typeof import('./bossFight').initiateBossFight;
let getHollowStatus: typeof import('./bossFight').getHollowStatus;

let initializeDatabase: () => Promise<void>;
let db: any;
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
  const bossFightModule = await import('./bossFight');

  initializeDatabase = dbModule.initializeDatabase;
  db = dbModule.db;
  agents = schemaModule.agents;
  users = schemaModule.users;
  gameEvents = schemaModule.gameEvents;

  initiateBossFight = bossFightModule.initiateBossFight;
  getHollowStatus = bossFightModule.getHollowStatus;

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

// Helper to clear game events between tests
async function clearEvents() {
  const { sql } = await import('drizzle-orm');
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

// Helper to get agent from DB
async function getAgent() {
  const { eq } = await import('drizzle-orm');
  const rows = await db.select().from(agents).where(eq(agents.userId, 'default'));
  return rows[0];
}

// Helper to get game events
async function getEvents(type?: string) {
  const { eq } = await import('drizzle-orm');
  const allEvents = await db
    .select()
    .from(gameEvents)
    .where(eq(gameEvents.userId, 'default'));
  if (type) {
    return allEvents.filter((e: any) => e.type === type);
  }
  return allEvents;
}

// ===================================================================
// Boss Fight — Victory
// ===================================================================
describe('Boss Fight — Victory', () => {
  afterEach(async () => {
    await clearEvents();
    await resetAgent();
  });

  it('halves debt, restores HP, and awards rewards on victory', async () => {
    // Set up agent with enough debt and force a win
    await resetAgent({ debt: 8, hp: 60, maxHp: 100, level: 10, xp: 50, gold: 200 });

    // Mock Math.random to always return 0 (guarantees win since winChance > 0)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = await initiateBossFight('default');

    randomSpy.mockRestore();

    expect(result.won).toBe(true);

    // Debt should be halved (8 / 2 = 4, ceil(4) = 4)
    expect(result.debtBefore).toBe(8);
    expect(result.debtAfter).toBe(4);

    // HP should be restored by 20% of maxHp = 20
    expect(result.hpChange).toBe(20);

    // Rewards: 50 * debt = 400 XP, 100 * debt = 800 gold
    expect(result.rewards).toBeDefined();
    expect(result.rewards!.xp).toBe(400);
    expect(result.rewards!.gold).toBe(800);

    // Verify agent in DB
    const agent = await getAgent();
    expect(agent.debt).toBe(4);
    expect(agent.hp).toBe(80); // 60 + 20 = 80
    expect(agent.xp).toBe(450); // 50 + 400 = 450
    expect(agent.gold).toBe(1000); // 200 + 800 = 1000

    // Snapshot should reflect updated state
    expect(result.agentSnapshot.debt).toBe(4);
    expect(result.agentSnapshot.hp).toBe(80);
    expect(result.agentSnapshot.xp).toBe(450);
    expect(result.agentSnapshot.gold).toBe(1000);
  });

  it('halves odd debt using ceil', async () => {
    await resetAgent({ debt: 9, hp: 80, maxHp: 100, level: 5 });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = await initiateBossFight('default');
    randomSpy.mockRestore();

    // ceil(9 / 2) = 5
    expect(result.debtAfter).toBe(5);
  });

  it('caps HP restoration at maxHp', async () => {
    await resetAgent({ debt: 7, hp: 95, maxHp: 100, level: 5 });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = await initiateBossFight('default');
    randomSpy.mockRestore();

    expect(result.won).toBe(true);
    // 20% of 100 = 20, but hp + 20 = 115 > 100, so capped at 100
    const agent = await getAgent();
    expect(agent.hp).toBe(100);
  });
});

// ===================================================================
// Boss Fight — Defeat
// ===================================================================
describe('Boss Fight — Defeat', () => {
  afterEach(async () => {
    await clearEvents();
    await resetAgent();
  });

  it('loses HP and debt stays on defeat', async () => {
    await resetAgent({ debt: 8, hp: 100, maxHp: 100, level: 1, xp: 50, gold: 200 });

    // Mock Math.random to always return 0.99 (guarantees loss since winChance < 0.8)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const result = await initiateBossFight('default');

    randomSpy.mockRestore();

    expect(result.won).toBe(false);

    // Debt unchanged
    expect(result.debtBefore).toBe(8);
    expect(result.debtAfter).toBe(8);

    // HP lost: 30% of maxHp = 30
    expect(result.hpChange).toBe(-30);

    // No rewards
    expect(result.rewards).toBeUndefined();

    // Verify agent in DB
    const agent = await getAgent();
    expect(agent.debt).toBe(8);
    expect(agent.hp).toBe(70); // 100 - 30 = 70
    expect(agent.xp).toBe(50); // unchanged
    expect(agent.gold).toBe(200); // unchanged
  });

  it('does not let HP drop below 0', async () => {
    await resetAgent({ debt: 7, hp: 10, maxHp: 100, level: 1 });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = await initiateBossFight('default');
    randomSpy.mockRestore();

    expect(result.won).toBe(false);
    // 30% of 100 = 30 loss, 10 - 30 = -20, clamped to 0
    const agent = await getAgent();
    expect(agent.hp).toBe(0);
  });
});

// ===================================================================
// Boss Fight — Rejection conditions
// ===================================================================
describe('Boss Fight — Rejection conditions', () => {
  afterEach(async () => {
    await clearEvents();
    await resetAgent();
  });

  it('rejects fight when debt < 7', async () => {
    await resetAgent({ debt: 5, hp: 100, level: 5 });

    await expect(initiateBossFight('default')).rejects.toThrow(
      'Not enough threat to challenge The Hollow',
    );
  });

  it('rejects fight when debt is 0', async () => {
    await resetAgent({ debt: 0, hp: 100, level: 10 });

    await expect(initiateBossFight('default')).rejects.toThrow(
      'Not enough threat to challenge The Hollow',
    );
  });

  it('rejects fight when agent HP is 0', async () => {
    await resetAgent({ debt: 10, hp: 0, level: 5 });

    await expect(initiateBossFight('default')).rejects.toThrow('Agent is incapacitated');
  });

  it('allows fight at exactly debt 7', async () => {
    await resetAgent({ debt: 7, hp: 100, maxHp: 100, level: 5 });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = await initiateBossFight('default');
    randomSpy.mockRestore();

    expect(result).toBeDefined();
    expect(result.debtBefore).toBe(7);
  });

  it('allows forced fight at debt >= 10', async () => {
    await resetAgent({ debt: 10, hp: 100, maxHp: 100, level: 5 });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = await initiateBossFight('default');
    randomSpy.mockRestore();

    expect(result).toBeDefined();
    expect(result.debtBefore).toBe(10);
  });
});

// ===================================================================
// Boss Fight — Win chance mechanics
// ===================================================================
describe('Boss Fight — Win chance mechanics', () => {
  afterEach(async () => {
    await clearEvents();
    await resetAgent();
  });

  it('has higher win chance with higher agent level and HP', async () => {
    // Low level agent
    await resetAgent({ debt: 7, hp: 50, maxHp: 100, level: 1 });
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    let result: any;
    try {
      result = await initiateBossFight('default');
    } catch {
      // might lose
    }
    randomSpy.mockRestore();
    await clearEvents();

    // Get the win chance for low-level
    await resetAgent({ debt: 7, hp: 50, maxHp: 100, level: 1 });
    const randomSpy2 = vi.spyOn(Math, 'random').mockReturnValue(0);
    const lowResult = await initiateBossFight('default');
    randomSpy2.mockRestore();
    const lowWinChance = lowResult.winChance;

    await clearEvents();

    // High level agent with same debt
    await resetAgent({ debt: 7, hp: 100, maxHp: 100, level: 20 });
    const randomSpy3 = vi.spyOn(Math, 'random').mockReturnValue(0);
    const highResult = await initiateBossFight('default');
    randomSpy3.mockRestore();
    const highWinChance = highResult.winChance;

    expect(highWinChance).toBeGreaterThan(lowWinChance);
  });

  it('has lower win chance with higher hollow strength', async () => {
    // Low debt = low hollow strength
    await resetAgent({ debt: 7, hp: 100, maxHp: 100, level: 5, consecutiveFailDays: 0 });
    const randomSpy1 = vi.spyOn(Math, 'random').mockReturnValue(0);
    const lowDebtResult = await initiateBossFight('default');
    randomSpy1.mockRestore();

    await clearEvents();

    // High debt = high hollow strength
    await resetAgent({ debt: 15, hp: 100, maxHp: 100, level: 5, consecutiveFailDays: 3 });
    const randomSpy2 = vi.spyOn(Math, 'random').mockReturnValue(0);
    const highDebtResult = await initiateBossFight('default');
    randomSpy2.mockRestore();

    expect(lowDebtResult.winChance).toBeGreaterThan(highDebtResult.winChance);
    expect(lowDebtResult.hollowStrength).toBeLessThan(highDebtResult.hollowStrength);
  });
});

// ===================================================================
// Boss Fight — Game events
// ===================================================================
describe('Boss Fight — Game events', () => {
  afterEach(async () => {
    await clearEvents();
    await resetAgent();
  });

  it('logs boss_fight event on victory', async () => {
    await resetAgent({ debt: 8, hp: 100, maxHp: 100, level: 5 });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    await initiateBossFight('default');
    randomSpy.mockRestore();

    const events = await getEvents('boss_fight');
    expect(events.length).toBe(1);

    const data = JSON.parse(events[0].data);
    expect(data.won).toBe(true);
    expect(data.hollowStrength).toBeDefined();
    expect(data.winChance).toBeDefined();
    expect(data.debtBefore).toBe(8);
    expect(data.debtAfter).toBe(4);
    expect(data.rewards).toBeDefined();
    expect(data.rewards.xp).toBe(400);
    expect(data.rewards.gold).toBe(800);
  });

  it('logs boss_fight event on defeat', async () => {
    await resetAgent({ debt: 8, hp: 100, maxHp: 100, level: 1 });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    await initiateBossFight('default');
    randomSpy.mockRestore();

    const events = await getEvents('boss_fight');
    expect(events.length).toBe(1);

    const data = JSON.parse(events[0].data);
    expect(data.won).toBe(false);
    expect(data.debtBefore).toBe(8);
    expect(data.debtAfter).toBe(8);
    expect(data.rewards).toBeNull();
  });
});

// ===================================================================
// Boss Fight — Narrative generation
// ===================================================================
describe('Boss Fight — Narrative generation', () => {
  afterEach(async () => {
    await clearEvents();
    await resetAgent();
  });

  it('generates victory narrative with template (no API key)', async () => {
    await resetAgent({ debt: 8, hp: 80, maxHp: 100, level: 5, streakDays: 3 });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = await initiateBossFight('default');
    randomSpy.mockRestore();

    expect(result.narrative).toContain('Drifter');
    expect(result.narrative).toContain('Hollow');
    expect(result.narrative).toContain('3 days');
    expect(result.narrative).toContain('8');
    expect(result.narrative).toContain('4');
  });

  it('generates defeat narrative with template (no API key)', async () => {
    await resetAgent({ debt: 8, hp: 100, maxHp: 100, level: 3 });

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = await initiateBossFight('default');
    randomSpy.mockRestore();

    expect(result.narrative).toContain('Hollow');
    expect(result.narrative).toContain('Level 3');
    expect(result.narrative).toContain('30 HP');
  });
});

// ===================================================================
// Hollow Status
// ===================================================================
describe('Hollow Status', () => {
  afterEach(async () => {
    await clearEvents();
    await resetAgent();
  });

  it('returns correct hollow status when dormant', async () => {
    await resetAgent({ debt: 0 });

    const status = await getHollowStatus('default');

    expect(status.debt).toBe(0);
    expect(status.hollowStage).toBe('dormant');
    expect(status.hollowStrength).toBe(0);
    expect(status.bossFightAvailable).toBe(false);
    expect(status.bossFightForced).toBe(false);
  });

  it('returns correct hollow status at confrontation stage', async () => {
    await resetAgent({ debt: 7, consecutiveFailDays: 2 });

    const status = await getHollowStatus('default');

    expect(status.debt).toBe(7);
    expect(status.hollowStage).toBe('confrontation');
    expect(status.hollowStrength).toBeGreaterThan(0);
    expect(status.bossFightAvailable).toBe(true);
    expect(status.bossFightForced).toBe(false);
  });

  it('returns correct hollow status at forced stage', async () => {
    await resetAgent({ debt: 10, consecutiveFailDays: 0 });

    const status = await getHollowStatus('default');

    expect(status.debt).toBe(10);
    expect(status.hollowStage).toBe('forced');
    expect(status.bossFightAvailable).toBe(true);
    expect(status.bossFightForced).toBe(true);
  });

  it('calculates hollow strength correctly with consecutive fail days', async () => {
    // hollowStrength = debt * 10 * (1 + consecutiveFailDays * 0.2)
    await resetAgent({ debt: 7, consecutiveFailDays: 3 });

    const status = await getHollowStatus('default');

    // 7 * 10 * (1 + 3 * 0.2) = 70 * 1.6 = 112
    expect(status.hollowStrength).toBe(112);
  });
});
