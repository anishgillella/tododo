// === Item Catalog Definitions — The Forge ===

import type { EquipmentSlot, ItemRarity } from './types';

export interface CombatStats {
  attack?: number;
  defense?: number;
  maxHp?: number;
  speed?: number;
  critChance?: number;
}

export interface ItemDef {
  id: string;
  name: string;
  type: 'consumable' | 'equipment' | 'cosmetic';
  description: string;
  goldCost: number;
  effect?: { type: string; value: number; duration?: number };
  requiredLevel?: number;
  slot?: EquipmentSlot;
  rarity?: ItemRarity;
  combatStats?: CombatStats;
  lootOnly?: boolean;
}

export const ITEM_CATALOG: ItemDef[] = [
  // ── Consumables ─────────────────────────────────────────────────────
  {
    id: 'hp_potion',
    name: 'HP Potion',
    type: 'consumable',
    description: 'Restores 25 HP instantly.',
    goldCost: 30,
    effect: { type: 'restore_hp', value: 25 },
  },
  {
    id: 'greater_hp_potion',
    name: 'Greater HP Potion',
    type: 'consumable',
    description: 'Restores 50 HP instantly.',
    goldCost: 60,
    effect: { type: 'restore_hp', value: 50 },
  },
  {
    id: 'xp_boost_scroll',
    name: 'XP Boost Scroll',
    type: 'consumable',
    description: 'Grants 1.5x XP for 1 hour.',
    goldCost: 100,
    effect: { type: 'xp_multiplier', value: 1.5, duration: 3600 },
  },
  {
    id: 'streak_shield',
    name: 'Streak Shield',
    type: 'consumable',
    description: 'Adds an extra streak shield to protect your streak.',
    goldCost: 80,
    effect: { type: 'add_streak_shield', value: 1 },
  },
  {
    id: 'energy_drink',
    name: 'Energy Drink',
    type: 'consumable',
    description: 'Restores 50 energy instantly.',
    goldCost: 40,
    effect: { type: 'restore_energy', value: 50 },
  },
  {
    id: 'hollow_ward',
    name: 'Hollow Ward',
    type: 'consumable',
    description: 'Reduces your debt to The Hollow by 1.',
    goldCost: 120,
    effect: { type: 'reduce_debt', value: 1 },
  },

  // ── Weapons ────────────────────────────────────────────────────────
  {
    id: 'rusty_sword',
    name: 'Rusty Sword',
    type: 'equipment',
    description: 'A battered blade. Better than nothing.',
    goldCost: 80,
    slot: 'weapon',
    rarity: 'common',
    combatStats: { attack: 3 },
  },
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    type: 'equipment',
    description: 'A solid iron blade forged in Drifthollow.',
    goldCost: 180,
    requiredLevel: 3,
    slot: 'weapon',
    rarity: 'common',
    combatStats: { attack: 6 },
  },
  {
    id: 'arcane_staff',
    name: 'Arcane Staff',
    type: 'equipment',
    description: 'A staff pulsing with arcane energy. Boosts attack and crit.',
    goldCost: 350,
    requiredLevel: 8,
    slot: 'weapon',
    rarity: 'uncommon',
    combatStats: { attack: 8, critChance: 3 },
  },
  {
    id: 'shadow_dagger',
    name: 'Shadow Dagger',
    type: 'equipment',
    description: 'A darkness-infused dagger. Quick and deadly.',
    goldCost: 400,
    requiredLevel: 12,
    slot: 'weapon',
    rarity: 'uncommon',
    combatStats: { attack: 10, speed: 2 },
  },
  {
    id: 'hollow_edge',
    name: 'Hollow Edge',
    type: 'equipment',
    description: 'A blade forged from crystallized void energy.',
    goldCost: 0,
    requiredLevel: 15,
    slot: 'weapon',
    rarity: 'rare',
    combatStats: { attack: 15, critChance: 5 },
    lootOnly: true,
  },
  {
    id: 'dragon_fang',
    name: 'Dragon Fang',
    type: 'equipment',
    description: 'A legendary weapon carved from a dragon\'s tooth.',
    goldCost: 0,
    requiredLevel: 25,
    slot: 'weapon',
    rarity: 'epic',
    combatStats: { attack: 22, critChance: 8 },
    lootOnly: true,
  },

  // ── Armor ─────────────────────────────────────────────────────────
  {
    id: 'leather_vest',
    name: 'Leather Vest',
    type: 'equipment',
    description: 'Basic protection from the wilds.',
    goldCost: 100,
    slot: 'armor',
    rarity: 'common',
    combatStats: { defense: 3, maxHp: 10 },
  },
  {
    id: 'chainmail',
    name: 'Chainmail',
    type: 'equipment',
    description: 'Interlocking metal rings provide solid protection.',
    goldCost: 220,
    requiredLevel: 5,
    slot: 'armor',
    rarity: 'common',
    combatStats: { defense: 6, maxHp: 20 },
  },
  {
    id: 'shadow_cloak',
    name: 'Shadow Cloak',
    type: 'equipment',
    description: 'A dark cloak that reduces failure damage by 10%.',
    goldCost: 250,
    effect: { type: 'failure_damage_reduction_percent', value: 10 },
    requiredLevel: 8,
    slot: 'armor',
    rarity: 'uncommon',
    combatStats: { defense: 8, speed: 1 },
  },
  {
    id: 'plate_armor',
    name: 'Plate Armor',
    type: 'equipment',
    description: 'Heavy plate forged in the depths of Drifthollow.',
    goldCost: 0,
    requiredLevel: 18,
    slot: 'armor',
    rarity: 'rare',
    combatStats: { defense: 14, maxHp: 40 },
    lootOnly: true,
  },
  {
    id: 'riftforged_plate',
    name: 'Riftforged Plate',
    type: 'equipment',
    description: 'Armor woven from the fabric of reality itself.',
    goldCost: 0,
    requiredLevel: 30,
    slot: 'armor',
    rarity: 'epic',
    combatStats: { defense: 20, maxHp: 60 },
    lootOnly: true,
  },

  // ── Accessories ───────────────────────────────────────────────────
  {
    id: 'iron_gauntlet',
    name: 'Iron Gauntlet',
    type: 'equipment',
    description: 'A sturdy gauntlet that permanently boosts XP gain by 5%.',
    goldCost: 200,
    effect: { type: 'xp_bonus_percent', value: 5 },
    requiredLevel: 5,
    slot: 'accessory',
    rarity: 'common',
    combatStats: { attack: 2 },
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    type: 'equipment',
    description: 'A small trinket that increases critical hit chance by 3%.',
    goldCost: 300,
    effect: { type: 'crit_chance_percent', value: 3 },
    requiredLevel: 10,
    slot: 'accessory',
    rarity: 'common',
    combatStats: { critChance: 3 },
  },
  {
    id: 'vitality_ring',
    name: 'Vitality Ring',
    type: 'equipment',
    description: 'A ring that pulses with life energy.',
    goldCost: 350,
    requiredLevel: 8,
    slot: 'accessory',
    rarity: 'uncommon',
    combatStats: { maxHp: 25 },
  },
  {
    id: 'swift_boots',
    name: 'Swift Boots',
    type: 'equipment',
    description: 'Enchanted boots that make you faster in combat.',
    goldCost: 380,
    requiredLevel: 10,
    slot: 'accessory',
    rarity: 'uncommon',
    combatStats: { speed: 3 },
  },
  {
    id: 'abyssal_amulet',
    name: 'Abyssal Amulet',
    type: 'equipment',
    description: 'An amulet that channels the power of the abyss.',
    goldCost: 0,
    requiredLevel: 25,
    slot: 'accessory',
    rarity: 'epic',
    combatStats: { attack: 5, defense: 5, maxHp: 20, speed: 2 },
    lootOnly: true,
  },
  {
    id: 'phoenix_feather',
    name: 'Phoenix Feather',
    type: 'equipment',
    description: 'A radiant feather that grants incredible vitality.',
    goldCost: 0,
    requiredLevel: 30,
    slot: 'accessory',
    rarity: 'epic',
    combatStats: { maxHp: 50 },
    lootOnly: true,
  },

  // ── Cosmetics ───────────────────────────────────────────────────────
  {
    id: 'theme_midnight',
    name: 'Midnight Theme',
    type: 'cosmetic',
    description: 'A dark, starlit theme for your hub.',
    goldCost: 50,
  },
  {
    id: 'theme_crimson',
    name: 'Crimson Theme',
    type: 'cosmetic',
    description: 'A bold red and black theme for your hub.',
    goldCost: 75,
  },
  {
    id: 'theme_aurora',
    name: 'Aurora Theme',
    type: 'cosmetic',
    description: 'A shimmering northern lights theme.',
    goldCost: 100,
  },
  {
    id: 'title_apprentice',
    name: 'Title: Apprentice',
    type: 'cosmetic',
    description: 'Display the "Apprentice" title on your avatar.',
    goldCost: 50,
  },
  {
    id: 'title_veteran',
    name: 'Title: Veteran',
    type: 'cosmetic',
    description: 'Display the "Veteran" title on your avatar.',
    goldCost: 150,
    requiredLevel: 10,
  },
  {
    id: 'title_legend',
    name: 'Title: Legend',
    type: 'cosmetic',
    description: 'Display the "Legend" title on your avatar.',
    goldCost: 500,
    requiredLevel: 25,
  },
];
