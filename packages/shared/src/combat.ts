// === Turn-Based Combat Engine ===

export interface CombatantStats {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  level: number;
}

export interface CombatAbility {
  id: string;
  name: string;
  description: string;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'stun';
  baseDamage?: number;
  healAmount?: number;
  buffAmount?: number;
  cooldown: number;
  unlocksAtLevel: number;
}

export interface CombatAction {
  type: 'attack' | 'ability' | 'defend' | 'item' | 'flee';
  abilityId?: string;
  itemId?: string;
}

export interface CombatTurnResult {
  actor: 'player' | 'enemy';
  action: string;
  damage?: number;
  healing?: number;
  isCrit?: boolean;
  isStunned?: boolean;
  isDefending?: boolean;
  message: string;
}

export interface CombatState {
  sessionId: string;
  turn: number;
  phase: 'player_turn' | 'enemy_turn' | 'victory' | 'defeat' | 'fled';
  player: CombatantStats;
  enemy: CombatantStats & { creatureId: string };
  playerDefending: boolean;
  enemyDefending: boolean;
  playerStunnedTurns: number;
  enemyStunnedTurns: number;
  cooldowns: Record<string, number>; // abilityId -> turns remaining
  enemyCooldowns: Record<string, number>;
  turnLog: CombatTurnResult[];
  rewards?: { xp: number; gold: number; loot?: string };
}

// ── Player Abilities ────────────────────────────────────────────────

export const PLAYER_ABILITIES: CombatAbility[] = [
  {
    id: 'power_strike',
    name: 'Power Strike',
    description: 'A focused blow dealing 150% damage.',
    type: 'damage',
    baseDamage: 1.5,
    cooldown: 0,
    unlocksAtLevel: 1,
  },
  {
    id: 'rally',
    name: 'Rally',
    description: 'Heal yourself for 20% of max HP.',
    type: 'heal',
    healAmount: 0.2,
    cooldown: 3,
    unlocksAtLevel: 5,
  },
  {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Deal 80% damage and stun the enemy for 1 turn.',
    type: 'stun',
    baseDamage: 0.8,
    cooldown: 4,
    unlocksAtLevel: 10,
  },
  {
    id: 'war_shout',
    name: 'War Shout',
    description: 'Buff your attack by 30% for the next 2 turns.',
    type: 'buff',
    buffAmount: 0.3,
    cooldown: 4,
    unlocksAtLevel: 15,
  },
  {
    id: 'whirlwind',
    name: 'Whirlwind',
    description: 'A devastating attack dealing 200% damage.',
    type: 'damage',
    baseDamage: 2.0,
    cooldown: 5,
    unlocksAtLevel: 20,
  },
  {
    id: 'second_wind',
    name: 'Second Wind',
    description: 'Heal yourself for 40% of max HP.',
    type: 'heal',
    healAmount: 0.4,
    cooldown: 6,
    unlocksAtLevel: 25,
  },
];

// ── Damage Calculation ──────────────────────────────────────────────

/** Diminishing returns defense: reduction = def / (def + 50) */
export function calculateDamage(atk: number, def: number, baseDmgMult: number = 1): number {
  const reduction = def / (def + 50);
  const rawDmg = atk * baseDmgMult;
  const damage = Math.max(1, Math.floor(rawDmg * (1 - reduction)));
  return damage;
}

// ── Init Combat ─────────────────────────────────────────────────────

export function initCombatState(
  sessionId: string,
  player: CombatantStats,
  enemy: CombatantStats & { creatureId: string },
): CombatState {
  return {
    sessionId,
    turn: 1,
    phase: 'player_turn',
    player: { ...player },
    enemy: { ...enemy },
    playerDefending: false,
    enemyDefending: false,
    playerStunnedTurns: 0,
    enemyStunnedTurns: 0,
    cooldowns: {},
    enemyCooldowns: {},
    turnLog: [],
    rewards: undefined,
  };
}

// ── Execute Turn ────────────────────────────────────────────────────

export function executeTurn(state: CombatState, playerAction: CombatAction): CombatState {
  const next = JSON.parse(JSON.stringify(state)) as CombatState;
  next.playerDefending = false;
  next.enemyDefending = false;

  // --- Player Turn ---
  if (next.playerStunnedTurns > 0) {
    next.playerStunnedTurns--;
    next.turnLog.push({
      actor: 'player',
      action: 'stunned',
      isStunned: true,
      message: 'You are stunned and cannot act!',
    });
  } else {
    executePlayerAction(next, playerAction);
  }

  // Check if enemy defeated
  if (next.enemy.hp <= 0) {
    next.enemy.hp = 0;
    next.phase = 'victory';
    return next;
  }

  // --- Enemy Turn ---
  if (next.enemyStunnedTurns > 0) {
    next.enemyStunnedTurns--;
    next.turnLog.push({
      actor: 'enemy',
      action: 'stunned',
      isStunned: true,
      message: `${next.enemy.name} is stunned!`,
    });
  } else {
    executeEnemyAI(next);
  }

  // Check if player defeated
  if (next.player.hp <= 0) {
    next.player.hp = 0;
    next.phase = 'defeat';
    return next;
  }

  // Tick cooldowns
  for (const key of Object.keys(next.cooldowns)) {
    if (next.cooldowns[key] > 0) next.cooldowns[key]--;
  }
  for (const key of Object.keys(next.enemyCooldowns)) {
    if (next.enemyCooldowns[key] > 0) next.enemyCooldowns[key]--;
  }

  next.turn++;
  next.phase = 'player_turn';
  return next;
}

function executePlayerAction(state: CombatState, action: CombatAction): void {
  switch (action.type) {
    case 'attack': {
      const isCrit = Math.random() < 0.1;
      const mult = isCrit ? 1.5 : 1;
      const dmg = calculateDamage(state.player.attack, state.enemy.defense, mult);
      state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
      state.turnLog.push({
        actor: 'player',
        action: 'attack',
        damage: dmg,
        isCrit,
        message: isCrit
          ? `Critical hit! You deal ${dmg} damage!`
          : `You attack for ${dmg} damage.`,
      });
      break;
    }
    case 'ability': {
      const ability = PLAYER_ABILITIES.find((a) => a.id === action.abilityId);
      if (!ability) return;
      if ((state.cooldowns[ability.id] ?? 0) > 0) return;

      state.cooldowns[ability.id] = ability.cooldown;

      switch (ability.type) {
        case 'damage': {
          const dmg = calculateDamage(state.player.attack, state.enemy.defense, ability.baseDamage ?? 1);
          state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
          state.turnLog.push({
            actor: 'player',
            action: ability.name,
            damage: dmg,
            message: `${ability.name}! You deal ${dmg} damage!`,
          });
          break;
        }
        case 'heal': {
          const heal = Math.floor(state.player.maxHp * (ability.healAmount ?? 0.2));
          state.player.hp = Math.min(state.player.maxHp, state.player.hp + heal);
          state.turnLog.push({
            actor: 'player',
            action: ability.name,
            healing: heal,
            message: `${ability.name}! You heal for ${heal} HP!`,
          });
          break;
        }
        case 'stun': {
          const dmg = calculateDamage(state.player.attack, state.enemy.defense, ability.baseDamage ?? 0.8);
          state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
          state.enemyStunnedTurns = 1;
          state.turnLog.push({
            actor: 'player',
            action: ability.name,
            damage: dmg,
            message: `${ability.name}! ${dmg} damage and enemy is stunned!`,
          });
          break;
        }
        case 'buff': {
          const buff = Math.floor(state.player.attack * (ability.buffAmount ?? 0.3));
          state.player.attack += buff;
          state.turnLog.push({
            actor: 'player',
            action: ability.name,
            message: `${ability.name}! Attack increased by ${buff}!`,
          });
          break;
        }
      }
      break;
    }
    case 'defend': {
      state.playerDefending = true;
      state.turnLog.push({
        actor: 'player',
        action: 'defend',
        isDefending: true,
        message: 'You brace for impact, reducing damage taken.',
      });
      break;
    }
  }
}

// ── Enemy AI ────────────────────────────────────────────────────────

function executeEnemyAI(state: CombatState): void {
  const hpPercent = state.enemy.hp / state.enemy.maxHp;
  const roll = Math.random();

  // HP < 30%: try to heal if possible
  if (hpPercent < 0.3 && roll < 0.5) {
    const heal = Math.floor(state.enemy.maxHp * 0.15);
    state.enemy.hp = Math.min(state.enemy.maxHp, state.enemy.hp + heal);
    state.turnLog.push({
      actor: 'enemy',
      action: 'heal',
      healing: heal,
      message: `${state.enemy.name} regenerates ${heal} HP!`,
    });
    return;
  }

  // 10% chance to defend
  if (roll < 0.1) {
    state.enemyDefending = true;
    state.turnLog.push({
      actor: 'enemy',
      action: 'defend',
      isDefending: true,
      message: `${state.enemy.name} takes a defensive stance.`,
    });
    return;
  }

  // 30% chance for heavy attack
  if (roll < 0.4) {
    const defMod = state.playerDefending ? state.player.defense * 2 : state.player.defense;
    const dmg = calculateDamage(state.enemy.attack, defMod, 1.3);
    state.player.hp = Math.max(0, state.player.hp - dmg);
    state.turnLog.push({
      actor: 'enemy',
      action: 'heavy_attack',
      damage: dmg,
      message: `${state.enemy.name} unleashes a heavy attack for ${dmg} damage!`,
    });
    return;
  }

  // Default: basic attack
  const defMod = state.playerDefending ? state.player.defense * 2 : state.player.defense;
  const dmg = calculateDamage(state.enemy.attack, defMod);
  state.player.hp = Math.max(0, state.player.hp - dmg);
  state.turnLog.push({
    actor: 'enemy',
    action: 'attack',
    damage: dmg,
    message: `${state.enemy.name} attacks for ${dmg} damage.`,
  });
}

// ── Helpers ─────────────────────────────────────────────────────────

export function getUnlockedAbilities(level: number): CombatAbility[] {
  return PLAYER_ABILITIES.filter((a) => a.unlocksAtLevel <= level);
}

export function buildPlayerCombatStats(
  name: string,
  level: number,
  baseAttack: number,
  baseDefense: number,
  hp: number,
  maxHp: number,
  equippedBonuses?: { attack?: number; defense?: number; maxHp?: number; speed?: number },
): CombatantStats {
  return {
    name,
    hp: hp + (equippedBonuses?.maxHp ?? 0),
    maxHp: maxHp + (equippedBonuses?.maxHp ?? 0),
    attack: baseAttack + (equippedBonuses?.attack ?? 0),
    defense: baseDefense + (equippedBonuses?.defense ?? 0),
    speed: 10 + (equippedBonuses?.speed ?? 0),
    level,
  };
}
