import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { agents, inventory } from '../db/schema';
import { ITEM_CATALOG, type EquipmentSlot } from '@tododo/shared';

const app = new Hono();

const DEFAULT_USER_ID = 'default';

// Helper to get the agent for the default user
async function getAgent() {
  const rows = await db.select().from(agents).where(eq(agents.userId, DEFAULT_USER_ID));
  return rows[0] ?? null;
}

// GET / — return agent's inventory items
app.get('/', async (c) => {
  const agent = await getAgent();
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  const items = await db
    .select()
    .from(inventory)
    .where(eq(inventory.agentId, agent.id));

  return c.json({ inventory: items });
});

// GET /catalog — return the full item catalog with prices
app.get('/catalog', async (c) => {
  const catalog = ITEM_CATALOG.map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    description: item.description,
    goldCost: item.goldCost,
    effect: item.effect ?? null,
    requiredLevel: item.requiredLevel ?? null,
  }));

  return c.json({ catalog });
});

// POST /buy — buy an item from the catalog
app.post('/buy', async (c) => {
  const body = await c.req.json();
  const { itemId } = body;

  if (!itemId) {
    return c.json({ error: 'itemId is required' }, 400);
  }

  // Find item definition
  const itemDef = ITEM_CATALOG.find((i) => i.id === itemId);
  if (!itemDef) {
    return c.json({ error: 'Item not found in catalog' }, 404);
  }

  const agent = await getAgent();
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  // Check level requirement
  if (itemDef.requiredLevel && (agent.level ?? 1) < itemDef.requiredLevel) {
    return c.json(
      { error: `Agent must be level ${itemDef.requiredLevel} to buy this item` },
      400,
    );
  }

  // Check gold
  if ((agent.gold ?? 0) < itemDef.goldCost) {
    return c.json(
      { error: `Not enough gold. Need ${itemDef.goldCost}, have ${agent.gold ?? 0}` },
      400,
    );
  }

  // Deduct gold
  const newGold = (agent.gold ?? 0) - itemDef.goldCost;
  await db.update(agents).set({ gold: newGold }).where(eq(agents.id, agent.id));

  // Check if agent already has this item in inventory (stack consumables and cosmetics)
  const existingRows = await db
    .select()
    .from(inventory)
    .where(
      and(eq(inventory.agentId, agent.id), eq(inventory.itemId, itemId)),
    );

  if (existingRows.length > 0) {
    // Increment quantity
    const newQuantity = (existingRows[0].quantity ?? 1) + 1;
    await db
      .update(inventory)
      .set({ quantity: newQuantity })
      .where(eq(inventory.id, existingRows[0].id));

    const updated = await db
      .select()
      .from(inventory)
      .where(eq(inventory.id, existingRows[0].id));

    return c.json({
      item: updated[0],
      goldSpent: itemDef.goldCost,
      remainingGold: newGold,
    });
  } else {
    // New item
    const id = nanoid();
    await db.insert(inventory).values({
      id,
      agentId: agent.id,
      itemId,
      name: itemDef.name,
      type: itemDef.type,
      quantity: 1,
      effectJson: itemDef.effect ? JSON.stringify(itemDef.effect) : null,
      slot: itemDef.slot ?? null,
      rarity: itemDef.rarity ?? 'common',
    });

    const inserted = await db.select().from(inventory).where(eq(inventory.id, id));

    return c.json({
      item: inserted[0],
      goldSpent: itemDef.goldCost,
      remainingGold: newGold,
    }, 201);
  }
});

// POST /use — use a consumable item
app.post('/use', async (c) => {
  const body = await c.req.json();
  const { itemId } = body;

  if (!itemId) {
    return c.json({ error: 'itemId is required' }, 400);
  }

  const agent = await getAgent();
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  // Find the item in inventory
  const invRows = await db
    .select()
    .from(inventory)
    .where(
      and(eq(inventory.agentId, agent.id), eq(inventory.itemId, itemId)),
    );

  if (invRows.length === 0) {
    return c.json({ error: 'Item not found in inventory' }, 404);
  }

  const invItem = invRows[0];

  // Only consumables can be used
  if (invItem.type !== 'consumable') {
    return c.json({ error: 'Only consumable items can be used' }, 400);
  }

  // Find item definition for the effect
  const itemDef = ITEM_CATALOG.find((i) => i.id === itemId);
  if (!itemDef || !itemDef.effect) {
    return c.json({ error: 'Item has no usable effect' }, 400);
  }

  // Apply effect
  const effect = itemDef.effect;
  const appliedEffects: string[] = [];

  switch (effect.type) {
    case 'restore_hp': {
      const maxHp = agent.maxHp ?? 100;
      const newHp = Math.min(maxHp, (agent.hp ?? 100) + effect.value);
      await db.update(agents).set({ hp: newHp }).where(eq(agents.id, agent.id));
      appliedEffects.push(`Restored ${effect.value} HP (now ${newHp})`);
      break;
    }
    case 'restore_energy': {
      const maxEnergy = agent.maxEnergy ?? 100;
      const newEnergy = Math.min(maxEnergy, (agent.energy ?? 100) + effect.value);
      await db.update(agents).set({ energy: newEnergy }).where(eq(agents.id, agent.id));
      appliedEffects.push(`Restored ${effect.value} energy (now ${newEnergy})`);
      break;
    }
    case 'add_streak_shield': {
      const newShields = (agent.streakShields ?? 1) + effect.value;
      await db.update(agents).set({ streakShields: newShields }).where(eq(agents.id, agent.id));
      appliedEffects.push(`Added ${effect.value} streak shield(s) (now ${newShields})`);
      break;
    }
    case 'reduce_debt': {
      const newDebt = Math.max(0, (agent.debt ?? 0) - effect.value);
      await db.update(agents).set({ debt: newDebt }).where(eq(agents.id, agent.id));
      appliedEffects.push(`Reduced debt by ${effect.value} (now ${newDebt})`);
      break;
    }
    case 'xp_multiplier': {
      // XP boost scroll — set an overdrive-like timer
      const duration = (effect.duration ?? 3600) * 1000;
      const until = new Date(Date.now() + duration).toISOString();
      await db.update(agents).set({ overdriveUntil: until }).where(eq(agents.id, agent.id));
      appliedEffects.push(`XP boost active for ${effect.duration}s`);
      break;
    }
    default:
      appliedEffects.push(`Applied effect: ${effect.type} (${effect.value})`);
  }

  // Decrement quantity or remove
  const newQuantity = (invItem.quantity ?? 1) - 1;
  if (newQuantity <= 0) {
    // Remove from inventory
    const { sql } = await import('drizzle-orm');
    await db.run(sql`DELETE FROM inventory WHERE id = ${invItem.id}`);
  } else {
    await db
      .update(inventory)
      .set({ quantity: newQuantity })
      .where(eq(inventory.id, invItem.id));
  }

  return c.json({
    used: itemId,
    effects: appliedEffects,
    remainingQuantity: newQuantity,
  });
});

// POST /equip — equip an equipment item
app.post('/equip', async (c) => {
  const body = await c.req.json();
  const { itemId } = body;

  if (!itemId) {
    return c.json({ error: 'itemId is required' }, 400);
  }

  const agent = await getAgent();
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  // Find the item in inventory
  const invRows = await db
    .select()
    .from(inventory)
    .where(
      and(eq(inventory.agentId, agent.id), eq(inventory.itemId, itemId)),
    );

  if (invRows.length === 0) {
    return c.json({ error: 'Item not found in inventory' }, 404);
  }

  const invItem = invRows[0];

  if (invItem.type !== 'equipment') {
    return c.json({ error: 'Only equipment can be equipped' }, 400);
  }

  // Get item definition for slot
  const itemDef = ITEM_CATALOG.find((i) => i.id === itemId);
  const slot = invItem.slot ?? itemDef?.slot ?? 'accessory';

  // Unequip any existing item in the same slot
  const equippedInSlot = await db
    .select()
    .from(inventory)
    .where(
      and(
        eq(inventory.agentId, agent.id),
        eq(inventory.equipped, true),
        eq(inventory.slot, slot),
      ),
    );

  for (const existing of equippedInSlot) {
    await db
      .update(inventory)
      .set({ equipped: false })
      .where(eq(inventory.id, existing.id));
  }

  // Equip the new item
  await db
    .update(inventory)
    .set({ equipped: true, slot })
    .where(eq(inventory.id, invItem.id));

  return c.json({ equipped: itemId, slot });
});

// POST /unequip — unequip an equipment item
app.post('/unequip', async (c) => {
  const body = await c.req.json();
  const { itemId } = body;

  if (!itemId) {
    return c.json({ error: 'itemId is required' }, 400);
  }

  const agent = await getAgent();
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  const invRows = await db
    .select()
    .from(inventory)
    .where(
      and(eq(inventory.agentId, agent.id), eq(inventory.itemId, itemId)),
    );

  if (invRows.length === 0) {
    return c.json({ error: 'Item not found in inventory' }, 404);
  }

  await db
    .update(inventory)
    .set({ equipped: false })
    .where(eq(inventory.id, invRows[0].id));

  return c.json({ unequipped: itemId });
});

export default app;
