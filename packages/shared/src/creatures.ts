// === Bestiary — Creature Definitions ===

export type CreatureShape = 'wolf' | 'spider' | 'wraith' | 'golem' | 'dragon' | 'shadow' | 'elemental';

export interface CreatureAbility {
  name: string;
  damageMultiplier?: number;
  healPercent?: number;
  cooldown: number;
}

export interface LootEntry {
  itemId: string;
  dropChance: number; // 0-1
}

export interface CreatureDef {
  id: string;
  name: string;
  description: string;
  shape: CreatureShape;
  minLevel: number;
  maxLevel: number;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  abilities: CreatureAbility[];
  lootTable: LootEntry[];
  xpReward: number;
  goldReward: number;
  isRare?: boolean;
}

export const CREATURES: CreatureDef[] = [
  // Level 1-5
  {
    id: 'forest_wolf',
    name: 'Forest Wolf',
    description: 'A snarling beast from the Drifthollow wilds.',
    shape: 'wolf',
    minLevel: 1, maxLevel: 5,
    baseHp: 30, baseAttack: 6, baseDefense: 3, baseSpeed: 8,
    abilities: [{ name: 'Lunge', damageMultiplier: 1.3, cooldown: 2 }],
    lootTable: [{ itemId: 'hp_potion', dropChance: 0.1 }],
    xpReward: 20, goldReward: 8,
  },
  {
    id: 'cave_spider',
    name: 'Cave Spider',
    description: 'A venomous arachnid lurking in shadows.',
    shape: 'spider',
    minLevel: 1, maxLevel: 5,
    baseHp: 25, baseAttack: 7, baseDefense: 2, baseSpeed: 10,
    abilities: [{ name: 'Venom Bite', damageMultiplier: 1.4, cooldown: 3 }],
    lootTable: [{ itemId: 'energy_drink', dropChance: 0.08 }],
    xpReward: 18, goldReward: 7,
  },
  {
    id: 'mushroom_spore',
    name: 'Mushroom Spore',
    description: 'A living fungal mass releasing toxic clouds.',
    shape: 'elemental',
    minLevel: 1, maxLevel: 5,
    baseHp: 35, baseAttack: 4, baseDefense: 5, baseSpeed: 4,
    abilities: [{ name: 'Spore Cloud', damageMultiplier: 1.2, cooldown: 2 }],
    lootTable: [{ itemId: 'hp_potion', dropChance: 0.12 }],
    xpReward: 15, goldReward: 6,
  },
  // Level 5-10
  {
    id: 'shadow_rat',
    name: 'Shadow Rat',
    description: 'A darkness-infused rodent with razor teeth.',
    shape: 'shadow',
    minLevel: 5, maxLevel: 10,
    baseHp: 40, baseAttack: 9, baseDefense: 4, baseSpeed: 12,
    abilities: [{ name: 'Shadow Bite', damageMultiplier: 1.4, cooldown: 2 }],
    lootTable: [{ itemId: 'hp_potion', dropChance: 0.08 }],
    xpReward: 30, goldReward: 12,
  },
  {
    id: 'hollow_wisp',
    name: 'Hollow Wisp',
    description: 'A fragment of The Hollow\'s essence.',
    shape: 'wraith',
    minLevel: 5, maxLevel: 10,
    baseHp: 35, baseAttack: 10, baseDefense: 3, baseSpeed: 14,
    abilities: [
      { name: 'Soul Drain', damageMultiplier: 1.3, healPercent: 0.1, cooldown: 3 },
    ],
    lootTable: [{ itemId: 'hollow_ward', dropChance: 0.05 }],
    xpReward: 35, goldReward: 14,
  },
  {
    id: 'corrupted_deer',
    name: 'Corrupted Deer',
    description: 'Once gentle, now twisted by dark energy.',
    shape: 'wolf',
    minLevel: 5, maxLevel: 10,
    baseHp: 50, baseAttack: 8, baseDefense: 6, baseSpeed: 9,
    abilities: [{ name: 'Antler Charge', damageMultiplier: 1.5, cooldown: 3 }],
    lootTable: [{ itemId: 'greater_hp_potion', dropChance: 0.08 }],
    xpReward: 32, goldReward: 13,
  },
  // Level 10-20
  {
    id: 'rift_stalker',
    name: 'Rift Stalker',
    description: 'A predator that phases between dimensions.',
    shape: 'shadow',
    minLevel: 10, maxLevel: 20,
    baseHp: 70, baseAttack: 14, baseDefense: 8, baseSpeed: 13,
    abilities: [
      { name: 'Phase Strike', damageMultiplier: 1.6, cooldown: 3 },
      { name: 'Void Step', healPercent: 0.1, cooldown: 4 },
    ],
    lootTable: [{ itemId: 'xp_boost_scroll', dropChance: 0.06 }],
    xpReward: 50, goldReward: 22,
  },
  {
    id: 'stone_golem',
    name: 'Stone Golem',
    description: 'An ancient construct of living rock.',
    shape: 'golem',
    minLevel: 10, maxLevel: 20,
    baseHp: 100, baseAttack: 12, baseDefense: 15, baseSpeed: 5,
    abilities: [{ name: 'Earthquake', damageMultiplier: 1.8, cooldown: 4 }],
    lootTable: [{ itemId: 'streak_shield', dropChance: 0.06 }],
    xpReward: 55, goldReward: 25,
  },
  {
    id: 'shadow_wraith',
    name: 'Shadow Wraith',
    description: 'A tormented spirit bound by The Hollow.',
    shape: 'wraith',
    minLevel: 10, maxLevel: 20,
    baseHp: 65, baseAttack: 16, baseDefense: 6, baseSpeed: 15,
    abilities: [
      { name: 'Death Touch', damageMultiplier: 1.7, cooldown: 3 },
      { name: 'Lifesteal', damageMultiplier: 1.2, healPercent: 0.15, cooldown: 4 },
    ],
    lootTable: [{ itemId: 'hollow_ward', dropChance: 0.08 }],
    xpReward: 52, goldReward: 23,
  },
  // Level 20-35
  {
    id: 'void_sentinel',
    name: 'Void Sentinel',
    description: 'A guardian of the rift between worlds.',
    shape: 'golem',
    minLevel: 20, maxLevel: 35,
    baseHp: 130, baseAttack: 20, baseDefense: 18, baseSpeed: 8,
    abilities: [
      { name: 'Void Slam', damageMultiplier: 1.8, cooldown: 3 },
      { name: 'Barrier', healPercent: 0.15, cooldown: 5 },
    ],
    lootTable: [
      { itemId: 'xp_boost_scroll', dropChance: 0.08 },
      { itemId: 'hollow_edge', dropChance: 0.08 },
    ],
    xpReward: 80, goldReward: 40,
  },
  {
    id: 'elder_spider',
    name: 'Elder Spider',
    description: 'A massive arachnid matriarch.',
    shape: 'spider',
    minLevel: 20, maxLevel: 35,
    baseHp: 110, baseAttack: 22, baseDefense: 12, baseSpeed: 11,
    abilities: [
      { name: 'Web Trap', damageMultiplier: 1.4, cooldown: 2 },
      { name: 'Venom Spray', damageMultiplier: 2.0, cooldown: 5 },
    ],
    lootTable: [
      { itemId: 'greater_hp_potion', dropChance: 0.1 },
      { itemId: 'plate_armor', dropChance: 0.08 },
    ],
    xpReward: 75, goldReward: 38,
  },
  {
    id: 'frost_elemental',
    name: 'Frost Elemental',
    description: 'Living ice from the void between stars.',
    shape: 'elemental',
    minLevel: 20, maxLevel: 35,
    baseHp: 120, baseAttack: 18, baseDefense: 20, baseSpeed: 7,
    abilities: [
      { name: 'Frost Nova', damageMultiplier: 1.6, cooldown: 3 },
      { name: 'Ice Armor', healPercent: 0.12, cooldown: 4 },
    ],
    lootTable: [
      { itemId: 'streak_shield', dropChance: 0.1 },
      { itemId: 'abyssal_amulet', dropChance: 0.06 },
    ],
    xpReward: 78, goldReward: 35,
  },
  // Level 35-50
  {
    id: 'abyssal_knight',
    name: 'Abyssal Knight',
    description: 'A fallen warrior empowered by the abyss.',
    shape: 'golem',
    minLevel: 35, maxLevel: 50,
    baseHp: 180, baseAttack: 28, baseDefense: 22, baseSpeed: 10,
    abilities: [
      { name: 'Abyssal Cleave', damageMultiplier: 2.0, cooldown: 3 },
      { name: 'Dark Shield', healPercent: 0.15, cooldown: 5 },
    ],
    lootTable: [
      { itemId: 'xp_boost_scroll', dropChance: 0.12 },
      { itemId: 'riftforged_plate', dropChance: 0.1 },
      { itemId: 'phoenix_feather', dropChance: 0.08 },
    ],
    xpReward: 120, goldReward: 60,
  },
  {
    id: 'nightmare_dragon',
    name: 'Nightmare Dragon',
    description: 'The apex predator of the void realms.',
    shape: 'dragon',
    minLevel: 35, maxLevel: 50,
    baseHp: 250, baseAttack: 32, baseDefense: 25, baseSpeed: 12,
    abilities: [
      { name: 'Dragon Breath', damageMultiplier: 2.2, cooldown: 4 },
      { name: 'Wing Buffet', damageMultiplier: 1.5, cooldown: 2 },
      { name: 'Regeneration', healPercent: 0.1, cooldown: 5 },
    ],
    lootTable: [
      { itemId: 'hollow_ward', dropChance: 0.15 },
      { itemId: 'dragon_fang', dropChance: 0.12 },
    ],
    xpReward: 150, goldReward: 80,
  },
  // Rare (any level)
  {
    id: 'treasure_mimic',
    name: 'Treasure Mimic',
    description: 'That chest was not what it seemed...',
    shape: 'golem',
    minLevel: 1, maxLevel: 50,
    baseHp: 45, baseAttack: 12, baseDefense: 8, baseSpeed: 6,
    abilities: [{ name: 'Chomp', damageMultiplier: 1.6, cooldown: 2 }],
    lootTable: [
      { itemId: 'greater_hp_potion', dropChance: 0.3 },
      { itemId: 'xp_boost_scroll', dropChance: 0.2 },
    ],
    xpReward: 40, goldReward: 50,
    isRare: true,
  },
  {
    id: 'hollow_echo',
    name: 'Hollow Echo',
    description: 'A reflection of your darkest fears.',
    shape: 'shadow',
    minLevel: 1, maxLevel: 50,
    baseHp: 50, baseAttack: 10, baseDefense: 10, baseSpeed: 10,
    abilities: [
      { name: 'Mirror Strike', damageMultiplier: 1.5, cooldown: 2 },
      { name: 'Echo Heal', healPercent: 0.15, cooldown: 4 },
    ],
    lootTable: [{ itemId: 'hollow_ward', dropChance: 0.15 }],
    xpReward: 45, goldReward: 35,
    isRare: true,
  },
];

/** Select a random creature appropriate for the player's level */
export function selectRandomCreature(level: number): CreatureDef {
  // 15% chance for rare creature
  const isRareRoll = Math.random() < 0.15;

  const eligible = CREATURES.filter((c) => {
    if (isRareRoll && c.isRare) return true;
    if (!isRareRoll && c.isRare) return false;
    return level >= c.minLevel && level <= c.maxLevel + 5;
  });

  if (eligible.length === 0) {
    // Fallback: pick closest creature
    const sorted = [...CREATURES].filter((c) => !c.isRare).sort(
      (a, b) => Math.abs(a.minLevel - level) - Math.abs(b.minLevel - level),
    );
    return sorted[0];
  }

  return eligible[Math.floor(Math.random() * eligible.length)];
}

/** Scale a creature's stats to match a specific level */
export function scaleCreatureToLevel(creature: CreatureDef, level: number): {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
} {
  const scale = 1 + (level - creature.minLevel) * 0.12;
  const hp = Math.floor(creature.baseHp * scale);
  return {
    hp,
    maxHp: hp,
    attack: Math.floor(creature.baseAttack * scale),
    defense: Math.floor(creature.baseDefense * scale),
    speed: Math.floor(creature.baseSpeed * scale),
  };
}
