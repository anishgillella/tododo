/**
 * Combat Service — In-memory session manager for turn-based combat.
 */

import { nanoid } from 'nanoid';
import {
  type CombatState,
  type CombatAction,
  type CombatantStats,
  initCombatState,
  executeTurn,
  buildPlayerCombatStats,
  selectRandomCreature,
  scaleCreatureToLevel,
  type CreatureDef,
} from '@tododo/shared';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index';
import { agents, inventory } from '../db/schema';
import { ITEM_CATALOG } from '@tododo/shared';

// In-memory combat sessions
const activeSessions = new Map<string, CombatState>();

/** Get equipped item combat stat bonuses for an agent */
async function getEquippedBonuses(agentId: string): Promise<{
  attack: number;
  defense: number;
  maxHp: number;
  speed: number;
}> {
  const equippedItems = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.agentId, agentId), eq(inventory.equipped, true)));

  const bonuses = { attack: 0, defense: 0, maxHp: 0, speed: 0 };

  for (const item of equippedItems) {
    const def = ITEM_CATALOG.find((i) => i.id === item.itemId);
    if (def?.combatStats) {
      bonuses.attack += def.combatStats.attack ?? 0;
      bonuses.defense += def.combatStats.defense ?? 0;
      bonuses.maxHp += def.combatStats.maxHp ?? 0;
      bonuses.speed += def.combatStats.speed ?? 0;
    }
  }

  return bonuses;
}

/** Start a new combat session */
export async function startCombat(
  userId: string,
  type: 'encounter' | 'boss',
  creatureId?: string,
): Promise<CombatState> {
  const agentRows = await db.select().from(agents).where(eq(agents.userId, userId));
  if (agentRows.length === 0) throw new Error('Agent not found');
  const agent = agentRows[0];

  const level = agent.level ?? 1;
  const bonuses = await getEquippedBonuses(agent.id);

  const playerStats = buildPlayerCombatStats(
    'Drifter',
    level,
    agent.attack ?? 5,
    agent.defense ?? 3,
    agent.hp ?? 100,
    agent.maxHp ?? 100,
    bonuses,
  );

  let creature: CreatureDef;
  if (type === 'boss') {
    // The Hollow — scales with debt
    const debt = agent.debt ?? 0;
    creature = {
      id: 'the_hollow',
      name: 'The Hollow',
      description: 'The darkness born from neglected tasks.',
      shape: 'shadow',
      minLevel: 1,
      maxLevel: 100,
      baseHp: 50 + debt * 15,
      baseAttack: 8 + debt * 3,
      baseDefense: 5 + debt * 2,
      baseSpeed: 10,
      abilities: [
        { name: 'Void Drain', damageMultiplier: 1.5, healPercent: 0.1, cooldown: 3 },
        { name: 'Shadow Pulse', damageMultiplier: 1.8, cooldown: 4 },
        { name: 'Despair Wave', damageMultiplier: 2.0, cooldown: 5 },
      ],
      lootTable: [],
      xpReward: 50 * debt,
      goldReward: 100 * debt,
    };
  } else if (creatureId) {
    const { CREATURES } = await import('@tododo/shared');
    creature = CREATURES.find((c) => c.id === creatureId) ?? selectRandomCreature(level);
  } else {
    creature = selectRandomCreature(level);
  }

  const scaledStats = scaleCreatureToLevel(creature, level);
  const enemyStats: CombatantStats & { creatureId: string } = {
    creatureId: creature.id,
    name: creature.name,
    hp: scaledStats.hp,
    maxHp: scaledStats.maxHp,
    attack: scaledStats.attack,
    defense: scaledStats.defense,
    speed: scaledStats.speed,
    level,
  };

  const sessionId = nanoid();
  const state = initCombatState(sessionId, playerStats, enemyStats);
  activeSessions.set(sessionId, state);

  return state;
}

/** Submit a player action for a combat session */
export function submitAction(sessionId: string, action: CombatAction): CombatState {
  const state = activeSessions.get(sessionId);
  if (!state) throw new Error('Combat session not found');
  if (state.phase !== 'player_turn') throw new Error('Not player turn');

  const newState = executeTurn(state, action);
  activeSessions.set(sessionId, newState);

  return newState;
}

/** Get the current combat state */
export function getCombatState(sessionId: string): CombatState | null {
  return activeSessions.get(sessionId) ?? null;
}

/** Attempt to flee combat (50% chance, costs 10% HP) */
export function fleeCombat(sessionId: string): CombatState {
  const state = activeSessions.get(sessionId);
  if (!state) throw new Error('Combat session not found');

  const fleeSuccess = Math.random() < 0.5;

  if (fleeSuccess) {
    const newState = { ...state, phase: 'fled' as const };
    activeSessions.set(sessionId, newState);
    return newState;
  }

  // Failed flee: lose 10% HP and enemy gets a free turn
  const hpLoss = Math.floor(state.player.maxHp * 0.1);
  const newState = JSON.parse(JSON.stringify(state)) as CombatState;
  newState.player.hp = Math.max(0, newState.player.hp - hpLoss);
  newState.turnLog.push({
    actor: 'player',
    action: 'flee_failed',
    damage: hpLoss,
    message: `Failed to flee! You take ${hpLoss} damage while retreating!`,
  });

  if (newState.player.hp <= 0) {
    newState.phase = 'defeat';
  }

  activeSessions.set(sessionId, newState);
  return newState;
}

/** End combat session and clean up */
export function endCombat(sessionId: string): CombatState | null {
  const state = activeSessions.get(sessionId);
  activeSessions.delete(sessionId);
  return state ?? null;
}
