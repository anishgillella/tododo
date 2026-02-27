import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index';
import { agents } from '../db/schema';

const app = new Hono();

const DEFAULT_USER_ID = 'default';

/**
 * Building upgrade tiers purchasable with gold.
 * Each building can be upgraded independently.
 */
const UPGRADE_TIERS = [
  { tier: 1, name: 'Banner', cost: 50, description: 'A proud banner flies from the rooftop.' },
  { tier: 2, name: 'Stained Glass', cost: 150, description: 'Arcane stained glass windows illuminate the interior.' },
  { tier: 3, name: 'Fountain', cost: 300, description: 'A magical fountain springs to life outside.' },
  { tier: 4, name: 'Enchanted Roof', cost: 500, description: 'The roof glows with protective runes.' },
] as const;

const BUILDING_IDS = [
  'guild-hall',
  'twilight-hearth',
  'training-yard',
  'blacksmiths-forge',
  'chroniclers-tower',
  'elders-study',
] as const;

type BuildingId = typeof BUILDING_IDS[number];
type BuildingUpgrades = Record<string, number>;

function parseUpgrades(raw: string | null): BuildingUpgrades {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// GET /api/buildings — list all buildings with their upgrade tiers
app.get('/', async (c) => {
  try {
    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, DEFAULT_USER_ID))
      .limit(1);

    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    const upgrades = parseUpgrades(agent.buildingUpgrades);

    const buildings = BUILDING_IDS.map((id) => ({
      id,
      currentTier: upgrades[id] ?? 0,
      nextUpgrade: UPGRADE_TIERS[(upgrades[id] ?? 0)] ?? null,
      maxTier: UPGRADE_TIERS.length,
    }));

    return c.json({ buildings, gold: agent.gold });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// POST /api/buildings/:id/upgrade — spend gold to upgrade a building
app.post('/:id/upgrade', async (c) => {
  try {
    const buildingId = c.req.param('id') as BuildingId;

    if (!BUILDING_IDS.includes(buildingId)) {
      return c.json({ error: 'Invalid building ID' }, 400);
    }

    const [agent] = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, DEFAULT_USER_ID))
      .limit(1);

    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }

    const upgrades = parseUpgrades(agent.buildingUpgrades);
    const currentTier = upgrades[buildingId] ?? 0;

    if (currentTier >= UPGRADE_TIERS.length) {
      return c.json({ error: 'Building is already at max tier' }, 400);
    }

    const nextUpgrade = UPGRADE_TIERS[currentTier];
    const gold = agent.gold ?? 0;

    if (gold < nextUpgrade.cost) {
      return c.json({ error: `Not enough gold. Need ${nextUpgrade.cost}, have ${gold}` }, 400);
    }

    // Deduct gold and apply upgrade
    upgrades[buildingId] = currentTier + 1;

    await db
      .update(agents)
      .set({
        gold: sql`${agents.gold} - ${nextUpgrade.cost}`,
        buildingUpgrades: JSON.stringify(upgrades),
      })
      .where(eq(agents.userId, DEFAULT_USER_ID));

    return c.json({
      success: true,
      buildingId,
      newTier: currentTier + 1,
      tierName: nextUpgrade.name,
      goldSpent: nextUpgrade.cost,
      description: nextUpgrade.description,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default app;
