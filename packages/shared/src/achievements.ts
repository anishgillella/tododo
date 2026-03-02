// === Achievement Definitions ===

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 'productivity' | 'streaks' | 'combat' | 'mastery';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  condition: {
    type: string;
    value: number;
    creatureId?: string;
  };
  rewards: {
    xp: number;
    gold: number;
    title?: string;
  };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // ── Productivity ────────────────────────────────────────────────────
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete your first task.',
    category: 'productivity',
    tier: 'bronze',
    condition: { type: 'tasks_completed', value: 1 },
    rewards: { xp: 25, gold: 10 },
  },
  {
    id: 'getting_going',
    name: 'Getting Going',
    description: 'Complete 10 tasks.',
    category: 'productivity',
    tier: 'bronze',
    condition: { type: 'tasks_completed', value: 10 },
    rewards: { xp: 100, gold: 50 },
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Complete 100 tasks.',
    category: 'productivity',
    tier: 'silver',
    condition: { type: 'tasks_completed', value: 100 },
    rewards: { xp: 500, gold: 200, title: 'Centurion' },
  },
  {
    id: 'the_thousand',
    name: 'The Thousand',
    description: 'Complete 1000 tasks.',
    category: 'productivity',
    tier: 'platinum',
    condition: { type: 'tasks_completed', value: 1000 },
    rewards: { xp: 2000, gold: 1000, title: 'Grandmaster' },
  },

  // ── Streaks ─────────────────────────────────────────────────────────
  {
    id: 'spark_starter',
    name: 'Spark Starter',
    description: 'Maintain a 3-day streak.',
    category: 'streaks',
    tier: 'bronze',
    condition: { type: 'streak_days', value: 3 },
    rewards: { xp: 50, gold: 20 },
  },
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak.',
    category: 'streaks',
    tier: 'silver',
    condition: { type: 'streak_days', value: 7 },
    rewards: { xp: 150, gold: 75 },
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Maintain a 30-day streak.',
    category: 'streaks',
    tier: 'gold',
    condition: { type: 'streak_days', value: 30 },
    rewards: { xp: 500, gold: 250, title: 'Eternal Flame' },
  },

  // ── Combat ──────────────────────────────────────────────────────────
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Win your first combat encounter.',
    category: 'combat',
    tier: 'bronze',
    condition: { type: 'combat_wins', value: 1 },
    rewards: { xp: 50, gold: 25 },
  },
  {
    id: 'beast_hunter',
    name: 'Beast Hunter',
    description: 'Win 50 combat encounters.',
    category: 'combat',
    tier: 'gold',
    condition: { type: 'combat_wins', value: 50 },
    rewards: { xp: 500, gold: 300, title: 'Beast Hunter' },
  },
  {
    id: 'hollow_slayer',
    name: 'Hollow Slayer',
    description: 'Defeat The Hollow in combat.',
    category: 'combat',
    tier: 'gold',
    condition: { type: 'boss_defeated', value: 1 },
    rewards: { xp: 300, gold: 200, title: 'Hollow Slayer' },
  },
  {
    id: 'dragon_slayer',
    name: 'Dragon Slayer',
    description: 'Defeat the Nightmare Dragon.',
    category: 'combat',
    tier: 'platinum',
    condition: { type: 'creature_defeated', value: 1, creatureId: 'nightmare_dragon' },
    rewards: { xp: 1000, gold: 500, title: 'Dragonbane' },
  },

  // ── Mastery ─────────────────────────────────────────────────────────
  {
    id: 'level_5',
    name: 'Apprentice',
    description: 'Reach level 5.',
    category: 'mastery',
    tier: 'bronze',
    condition: { type: 'level_reached', value: 5 },
    rewards: { xp: 75, gold: 30 },
  },
  {
    id: 'level_10',
    name: 'Journeyman',
    description: 'Reach level 10.',
    category: 'mastery',
    tier: 'silver',
    condition: { type: 'level_reached', value: 10 },
    rewards: { xp: 200, gold: 100 },
  },
  {
    id: 'level_25',
    name: 'Expert',
    description: 'Reach level 25.',
    category: 'mastery',
    tier: 'gold',
    condition: { type: 'level_reached', value: 25 },
    rewards: { xp: 500, gold: 250, title: 'Expert' },
  },
  {
    id: 'level_50',
    name: 'Legendary',
    description: 'Reach level 50.',
    category: 'mastery',
    tier: 'platinum',
    condition: { type: 'level_reached', value: 50 },
    rewards: { xp: 1500, gold: 750, title: 'Legend' },
  },
  {
    id: 'combo_master',
    name: 'Combo Master',
    description: 'Reach a 5x combo.',
    category: 'mastery',
    tier: 'silver',
    condition: { type: 'combo_reached', value: 5 },
    rewards: { xp: 150, gold: 75 },
  },
  {
    id: 'collector',
    name: 'Collector',
    description: 'Own 5 different items.',
    category: 'mastery',
    tier: 'bronze',
    condition: { type: 'items_owned', value: 5 },
    rewards: { xp: 100, gold: 50 },
  },
  {
    id: 'scholar_of_war',
    name: 'Scholar of War',
    description: 'Learn 4 skills from the training grounds.',
    category: 'mastery',
    tier: 'silver',
    condition: { type: 'skills_learned', value: 4 },
    rewards: { xp: 200, gold: 100 },
  },
];
