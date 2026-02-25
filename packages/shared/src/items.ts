// === Item Catalog Definitions — The Forge ===

export interface ItemDef {
  id: string;
  name: string;
  type: 'consumable' | 'equipment' | 'cosmetic';
  description: string;
  goldCost: number;
  effect?: { type: string; value: number; duration?: number };
  requiredLevel?: number;
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

  // ── Equipment ───────────────────────────────────────────────────────
  {
    id: 'iron_gauntlet',
    name: 'Iron Gauntlet',
    type: 'equipment',
    description: 'A sturdy gauntlet that permanently boosts XP gain by 5%.',
    goldCost: 200,
    effect: { type: 'xp_bonus_percent', value: 5 },
    requiredLevel: 5,
  },
  {
    id: 'shadow_cloak',
    name: 'Shadow Cloak',
    type: 'equipment',
    description: 'A dark cloak that reduces failure damage by 10%.',
    goldCost: 250,
    effect: { type: 'failure_damage_reduction_percent', value: 10 },
    requiredLevel: 8,
  },
  {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    type: 'equipment',
    description: 'A small trinket that increases critical hit chance by 3%.',
    goldCost: 300,
    effect: { type: 'crit_chance_percent', value: 3 },
    requiredLevel: 10,
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
