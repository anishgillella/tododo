// === Skill Tree Definitions — Training Grounds ===

export interface SkillDef {
  id: string;
  name: string;
  category: 'discipline' | 'courage' | 'wisdom' | 'luck';
  description: string;
  maxLevel: number;
  xpCost: (level: number) => number;
  effect: (level: number) => { type: string; value: number };
  requiredLevel: number;
  prerequisiteSkill?: string;
}

// Base XP costs per category
const CATEGORY_BASE_COST: Record<string, number> = {
  discipline: 100,
  courage: 120,
  wisdom: 100,
  luck: 150,
};

function makeCost(category: string) {
  const base = CATEGORY_BASE_COST[category] ?? 100;
  return (level: number) => Math.floor(base * level * 1.5);
}

export const SKILL_TREE: SkillDef[] = [
  // ── Discipline ──────────────────────────────────────────────────────
  {
    id: 'focus',
    name: 'Focus',
    category: 'discipline',
    description: 'Sharpen your mind. Gain +3% XP bonus per mission for each level.',
    maxLevel: 5,
    xpCost: makeCost('discipline'),
    effect: (level: number) => ({ type: 'xp_bonus_percent', value: level * 3 }),
    requiredLevel: 1,
  },
  {
    id: 'endurance',
    name: 'Endurance',
    category: 'discipline',
    description: 'Build fortitude. Gain +10 max HP per level.',
    maxLevel: 5,
    xpCost: makeCost('discipline'),
    effect: (level: number) => ({ type: 'max_hp_bonus', value: level * 10 }),
    requiredLevel: 3,
    prerequisiteSkill: 'focus',
  },
  {
    id: 'iron_will',
    name: 'Iron Will',
    category: 'discipline',
    description: 'Steel yourself against failure. Reduce failure damage by 5% per level.',
    maxLevel: 5,
    xpCost: makeCost('discipline'),
    effect: (level: number) => ({ type: 'failure_damage_reduction_percent', value: level * 5 }),
    requiredLevel: 5,
    prerequisiteSkill: 'endurance',
  },
  {
    id: 'steady_hand',
    name: 'Steady Hand',
    category: 'discipline',
    description: 'Lower the streak threshold by 2% per level (minimum 60%).',
    maxLevel: 5,
    xpCost: makeCost('discipline'),
    effect: (level: number) => ({ type: 'streak_threshold_reduction_percent', value: level * 2 }),
    requiredLevel: 8,
    prerequisiteSkill: 'iron_will',
  },

  // ── Courage ─────────────────────────────────────────────────────────
  {
    id: 'battle_ready',
    name: 'Battle Ready',
    category: 'courage',
    description: 'Train for The Hollow. Increase boss fight win chance by +3% per level.',
    maxLevel: 5,
    xpCost: makeCost('courage'),
    effect: (level: number) => ({ type: 'boss_win_chance_percent', value: level * 3 }),
    requiredLevel: 1,
  },
  {
    id: 'reckless_strike',
    name: 'Reckless Strike',
    category: 'courage',
    description: 'Embrace risk. Increase critical hit chance by +2% per level.',
    maxLevel: 5,
    xpCost: makeCost('courage'),
    effect: (level: number) => ({ type: 'crit_chance_percent', value: level * 2 }),
    requiredLevel: 3,
    prerequisiteSkill: 'battle_ready',
  },
  {
    id: 'war_cry',
    name: 'War Cry',
    category: 'courage',
    description: 'Rally your spirit. Gain +5 XP per combo level.',
    maxLevel: 5,
    xpCost: makeCost('courage'),
    effect: (level: number) => ({ type: 'combo_bonus_xp', value: level * 5 }),
    requiredLevel: 5,
    prerequisiteSkill: 'reckless_strike',
  },
  {
    id: 'valor',
    name: 'Valor',
    category: 'courage',
    description: 'Earn respect faster. Increase reputation gain by +10% per level.',
    maxLevel: 5,
    xpCost: makeCost('courage'),
    effect: (level: number) => ({ type: 'reputation_gain_percent', value: level * 10 }),
    requiredLevel: 8,
    prerequisiteSkill: 'war_cry',
  },

  // ── Wisdom ──────────────────────────────────────────────────────────
  {
    id: 'insight',
    name: 'Insight',
    category: 'wisdom',
    description: 'See the value in everything. Gain +5% gold bonus per level.',
    maxLevel: 5,
    xpCost: makeCost('wisdom'),
    effect: (level: number) => ({ type: 'gold_bonus_percent', value: level * 5 }),
    requiredLevel: 1,
  },
  {
    id: 'meditation',
    name: 'Meditation',
    category: 'wisdom',
    description: 'Expand your reserves. Gain +10 max energy per level.',
    maxLevel: 5,
    xpCost: makeCost('wisdom'),
    effect: (level: number) => ({ type: 'max_energy_bonus', value: level * 10 }),
    requiredLevel: 3,
    prerequisiteSkill: 'insight',
  },
  {
    id: 'foresight',
    name: 'Foresight',
    category: 'wisdom',
    description: 'Anticipate treasure. Increase loot drop chance by +2% per level.',
    maxLevel: 5,
    xpCost: makeCost('wisdom'),
    effect: (level: number) => ({ type: 'loot_drop_chance_percent', value: level * 2 }),
    requiredLevel: 5,
    prerequisiteSkill: 'meditation',
  },
  {
    id: 'scholar',
    name: 'Scholar',
    category: 'wisdom',
    description: 'Master hard challenges. Gain +10% XP from 4-5 star missions per level.',
    maxLevel: 5,
    xpCost: makeCost('wisdom'),
    effect: (level: number) => ({ type: 'hard_mission_xp_bonus_percent', value: level * 10 }),
    requiredLevel: 8,
    prerequisiteSkill: 'foresight',
  },

  // ── Luck ────────────────────────────────────────────────────────────
  {
    id: 'fortune',
    name: 'Fortune',
    category: 'luck',
    description: 'Lady Luck smiles. Increase gold random range by +15% per level.',
    maxLevel: 5,
    xpCost: makeCost('luck'),
    effect: (level: number) => ({ type: 'gold_range_percent', value: level * 15 }),
    requiredLevel: 1,
  },
  {
    id: 'lucky_star',
    name: 'Lucky Star',
    category: 'luck',
    description: 'When crits land, they hit harder. Increase crit multiplier by +0.25 per level.',
    maxLevel: 5,
    xpCost: makeCost('luck'),
    effect: (level: number) => ({ type: 'crit_multiplier_bonus', value: level * 0.25 }),
    requiredLevel: 3,
    prerequisiteSkill: 'fortune',
  },
  {
    id: 'scavenger',
    name: 'Scavenger',
    category: 'luck',
    description: 'Find better treasure. Increase loot quality bonus per level.',
    maxLevel: 5,
    xpCost: makeCost('luck'),
    effect: (level: number) => ({ type: 'loot_quality_bonus', value: level * 1 }),
    requiredLevel: 5,
    prerequisiteSkill: 'lucky_star',
  },
  {
    id: 'jackpot_hunter',
    name: 'Jackpot Hunter',
    category: 'luck',
    description: 'Attract fortune. Increase jackpot day chance by +1% per level.',
    maxLevel: 5,
    xpCost: makeCost('luck'),
    effect: (level: number) => ({ type: 'jackpot_chance_percent', value: level * 1 }),
    requiredLevel: 8,
    prerequisiteSkill: 'scavenger',
  },
];
