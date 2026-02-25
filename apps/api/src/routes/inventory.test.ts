import { beforeAll, afterAll, afterEach, describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { unlinkSync, existsSync } from 'fs';

let app: Hono;
let initializeDatabase: () => Promise<void>;
let db: any;
let agents: any;
let inventory: any;

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
  inventory = schemaModule.inventory;

  await initializeDatabase();

  const inventoryRouter = (await import('./inventory')).default;
  app = new Hono();
  app.route('/api/inventory', inventoryRouter);
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

// Helper to clear inventory and reset agent
async function resetState() {
  const { sql } = await import('drizzle-orm');
  const { eq } = await import('drizzle-orm');
  await db.run(sql`DELETE FROM inventory`);
  await db
    .update(agents)
    .set({ xp: 0, gold: 0, level: 1, hp: 100, maxHp: 100, energy: 100, maxEnergy: 100, debt: 0, streakShields: 1 })
    .where(eq(agents.userId, 'default'));
}

// Helper to set agent stats
async function setAgent(values: Record<string, any>) {
  const { eq } = await import('drizzle-orm');
  await db.update(agents).set(values).where(eq(agents.userId, 'default'));
}

// ===================================================================
// GET /api/inventory — Return inventory
// ===================================================================
describe('GET /api/inventory', () => {
  afterEach(async () => {
    await resetState();
  });

  it('returns empty inventory initially', async () => {
    const res = await app.request('/api/inventory');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.inventory).toBeDefined();
    expect(json.inventory).toHaveLength(0);
  });
});

// ===================================================================
// GET /api/inventory/catalog — Return item catalog
// ===================================================================
describe('GET /api/inventory/catalog', () => {
  it('returns the full item catalog', async () => {
    const res = await app.request('/api/inventory/catalog');

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.catalog).toBeDefined();
    expect(Array.isArray(json.catalog)).toBe(true);
    expect(json.catalog.length).toBeGreaterThan(0);

    // Check that each item has expected shape
    const item = json.catalog[0];
    expect(item.id).toBeDefined();
    expect(item.name).toBeDefined();
    expect(item.type).toBeDefined();
    expect(item.description).toBeDefined();
    expect(item.goldCost).toBeDefined();
  });

  it('includes consumables, equipment, and cosmetics', async () => {
    const res = await app.request('/api/inventory/catalog');
    const json = await res.json();

    const types = [...new Set(json.catalog.map((i: any) => i.type))];
    expect(types).toContain('consumable');
    expect(types).toContain('equipment');
    expect(types).toContain('cosmetic');
  });
});

// ===================================================================
// POST /api/inventory/buy — Buy an item
// ===================================================================
describe('POST /api/inventory/buy', () => {
  afterEach(async () => {
    await resetState();
  });

  it('buys an item and deducts gold', async () => {
    await setAgent({ gold: 100 });

    const res = await app.request('/api/inventory/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hp_potion' }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.item).toBeDefined();
    expect(json.item.itemId).toBe('hp_potion');
    expect(json.item.quantity).toBe(1);
    expect(json.goldSpent).toBe(30);
    expect(json.remainingGold).toBe(70);
  });

  it('rejects when not enough gold', async () => {
    await setAgent({ gold: 5 });

    const res = await app.request('/api/inventory/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hp_potion' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Not enough gold/);
  });

  it('rejects when level requirement not met', async () => {
    // Iron Gauntlet requires level 5
    await setAgent({ gold: 500, level: 1 });

    const res = await app.request('/api/inventory/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'iron_gauntlet' }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/level 5/);
  });

  it('stacks consumables when buying same item again', async () => {
    await setAgent({ gold: 200 });

    // Buy first hp potion
    const res1 = await app.request('/api/inventory/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hp_potion' }),
    });
    expect(res1.status).toBe(201);

    // Buy second hp potion
    const res2 = await app.request('/api/inventory/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hp_potion' }),
    });
    expect(res2.status).toBe(200);
    const json = await res2.json();
    expect(json.item.quantity).toBe(2);
    expect(json.remainingGold).toBe(140); // 200 - 30 - 30
  });

  it('rejects invalid itemId', async () => {
    await setAgent({ gold: 500 });

    const res = await app.request('/api/inventory/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'nonexistent' }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Item not found in catalog');
  });
});

// ===================================================================
// POST /api/inventory/use — Use a consumable item
// ===================================================================
describe('POST /api/inventory/use', () => {
  afterEach(async () => {
    await resetState();
  });

  it('uses an HP potion and restores HP', async () => {
    // Set agent to low HP and give them a potion
    await setAgent({ gold: 100, hp: 50, maxHp: 100 });

    // Buy the potion
    await app.request('/api/inventory/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hp_potion' }),
    });

    // Use the potion
    const res = await app.request('/api/inventory/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hp_potion' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.used).toBe('hp_potion');
    expect(json.effects).toBeDefined();
    expect(json.effects.length).toBeGreaterThan(0);
    expect(json.effects[0]).toMatch(/Restored 25 HP/);
    expect(json.remainingQuantity).toBe(0);

    // Verify HP was restored
    const { eq } = await import('drizzle-orm');
    const agentRows = await db.select().from(agents).where(eq(agents.userId, 'default'));
    expect(agentRows[0].hp).toBe(75); // 50 + 25
  });

  it('decrements quantity and removes when 0', async () => {
    await setAgent({ gold: 200, hp: 50, maxHp: 100 });

    // Buy 2 potions
    await app.request('/api/inventory/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hp_potion' }),
    });
    await app.request('/api/inventory/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hp_potion' }),
    });

    // Verify we have 2
    const invRes1 = await app.request('/api/inventory');
    const inv1 = await invRes1.json();
    expect(inv1.inventory[0].quantity).toBe(2);

    // Use one
    const useRes1 = await app.request('/api/inventory/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hp_potion' }),
    });
    const use1 = await useRes1.json();
    expect(use1.remainingQuantity).toBe(1);

    // Verify we have 1 left
    const invRes2 = await app.request('/api/inventory');
    const inv2 = await invRes2.json();
    expect(inv2.inventory).toHaveLength(1);
    expect(inv2.inventory[0].quantity).toBe(1);

    // Use the last one
    const useRes2 = await app.request('/api/inventory/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hp_potion' }),
    });
    const use2 = await useRes2.json();
    expect(use2.remainingQuantity).toBe(0);

    // Verify inventory is empty
    const invRes3 = await app.request('/api/inventory');
    const inv3 = await invRes3.json();
    expect(inv3.inventory).toHaveLength(0);
  });

  it('rejects using an item not in inventory', async () => {
    const res = await app.request('/api/inventory/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hp_potion' }),
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe('Item not found in inventory');
  });

  it('uses an energy drink and restores energy', async () => {
    await setAgent({ gold: 100, energy: 30, maxEnergy: 100 });

    // Buy the energy drink
    await app.request('/api/inventory/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'energy_drink' }),
    });

    // Use it
    const res = await app.request('/api/inventory/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'energy_drink' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.effects[0]).toMatch(/Restored 50 energy/);

    // Verify energy was restored
    const { eq } = await import('drizzle-orm');
    const agentRows = await db.select().from(agents).where(eq(agents.userId, 'default'));
    expect(agentRows[0].energy).toBe(80); // 30 + 50
  });

  it('uses a hollow ward and reduces debt', async () => {
    await setAgent({ gold: 200, debt: 3 });

    // Buy the ward
    await app.request('/api/inventory/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hollow_ward' }),
    });

    // Use it
    const res = await app.request('/api/inventory/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: 'hollow_ward' }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.effects[0]).toMatch(/Reduced debt by 1/);

    // Verify debt was reduced
    const { eq } = await import('drizzle-orm');
    const agentRows = await db.select().from(agents).where(eq(agents.userId, 'default'));
    expect(agentRows[0].debt).toBe(2); // 3 - 1
  });
});
