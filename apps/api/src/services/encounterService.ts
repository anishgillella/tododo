/**
 * Encounter Service — Handles random encounter triggers and reward resolution.
 */

import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { agents, inventory, bestiary, gameEvents } from '../db/schema';
import {
  selectRandomCreature,
  scaleCreatureToLevel,
  type CreatureDef,
  ITEM_CATALOG,
} from '@tododo/shared';
import { startCombat, endCombat } from './combatService';

/** Resolve combat encounter rewards after victory or defeat */
export async function resolveEncounterRewards(
  userId: string,
  sessionId: string,
): Promise<{
  xpGained: number;
  goldGained: number;
  lootDrops: string[];
  bestiaryUpdated: boolean;
}> {
  const state = endCombat(sessionId);
  if (!state) throw new Error('Combat session not found');

  const agentRows = await db.select().from(agents).where(eq(agents.userId, userId));
  if (agentRows.length === 0) throw new Error('Agent not found');
  const agent = agentRows[0];

  const creatureId = state.enemy.creatureId;
  const now = new Date().toISOString();
  let xpGained = 0;
  let goldGained = 0;
  const lootDrops: string[] = [];

  if (state.phase === 'victory') {
    // Find creature definition for rewards
    const { CREATURES } = await import('@tododo/shared');
    const creature = CREATURES.find((c) => c.id === creatureId);

    if (creature) {
      xpGained = creature.xpReward;
      goldGained = creature.goldReward;

      // Roll loot table
      for (const loot of creature.lootTable) {
        if (Math.random() < loot.dropChance) {
          lootDrops.push(loot.itemId);

          // Add item to inventory
          const existingItem = await db
            .select()
            .from(inventory)
            .where(and(eq(inventory.agentId, agent.id), eq(inventory.itemId, loot.itemId)));

          if (existingItem.length > 0) {
            await db
              .update(inventory)
              .set({ quantity: (existingItem[0].quantity ?? 1) + 1 })
              .where(eq(inventory.id, existingItem[0].id));
          } else {
            const itemDef = ITEM_CATALOG.find((i) => i.id === loot.itemId);
            await db.insert(inventory).values({
              id: nanoid(),
              agentId: agent.id,
              itemId: loot.itemId,
              name: itemDef?.name ?? loot.itemId,
              type: itemDef?.type ?? 'consumable',
              quantity: 1,
              effectJson: itemDef?.effect ? JSON.stringify(itemDef.effect) : null,
              slot: itemDef?.slot ?? null,
              rarity: itemDef?.rarity ?? 'common',
            });
          }
        }
      }
    }

    // Award XP and gold
    await db
      .update(agents)
      .set({
        xp: (agent.xp ?? 0) + xpGained,
        gold: (agent.gold ?? 0) + goldGained,
      })
      .where(eq(agents.id, agent.id));

    // Update bestiary — defeated
    await updateBestiary(userId, creatureId, 'defeated', now);
  } else if (state.phase === 'defeat') {
    // On defeat: lose 10% max HP
    const hpLoss = Math.floor((agent.maxHp ?? 100) * 0.1);
    await db
      .update(agents)
      .set({ hp: Math.max(0, (agent.hp ?? 100) - hpLoss) })
      .where(eq(agents.id, agent.id));

    // Update bestiary — lost
    await updateBestiary(userId, creatureId, 'lost', now);
  }

  // Log game event
  await db.insert(gameEvents).values({
    id: nanoid(),
    userId,
    type: 'encounter_resolved',
    data: JSON.stringify({
      creatureId,
      outcome: state.phase,
      xpGained,
      goldGained,
      lootDrops,
    }),
    createdAt: now,
  });

  return { xpGained, goldGained, lootDrops, bestiaryUpdated: true };
}

async function updateBestiary(
  userId: string,
  creatureId: string,
  outcome: 'defeated' | 'lost',
  now: string,
): Promise<void> {
  const existing = await db
    .select()
    .from(bestiary)
    .where(and(eq(bestiary.userId, userId), eq(bestiary.creatureId, creatureId)));

  if (existing.length > 0) {
    const update: Record<string, unknown> = { lastEncountered: now };
    if (outcome === 'defeated') {
      update.timesDefeated = (existing[0].timesDefeated ?? 0) + 1;
    } else {
      update.timesLost = (existing[0].timesLost ?? 0) + 1;
    }
    await db.update(bestiary).set(update).where(eq(bestiary.id, existing[0].id));
  } else {
    await db.insert(bestiary).values({
      id: nanoid(),
      userId,
      creatureId,
      timesDefeated: outcome === 'defeated' ? 1 : 0,
      timesLost: outcome === 'lost' ? 1 : 0,
      firstEncountered: now,
      lastEncountered: now,
    });
  }
}

/** Get bestiary entries for a user */
export async function getBestiary(userId: string) {
  return db.select().from(bestiary).where(eq(bestiary.userId, userId));
}
