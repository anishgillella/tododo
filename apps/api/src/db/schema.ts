import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// === Users ===
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  openrouterApiKey: text('openrouter_api_key'),
  difficultyMode: text('difficulty_mode').default('drifter'),
  createdAt: text('created_at').default(new Date().toISOString()),
});

// === Agents ===
export const agents = sqliteTable('agents', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  level: integer('level').default(1),
  xp: integer('xp').default(0),
  hp: integer('hp').default(100),
  maxHp: integer('max_hp').default(100),
  energy: integer('energy').default(100),
  maxEnergy: integer('max_energy').default(100),
  reputation: integer('reputation').default(0),
  gold: integer('gold').default(0),
  discipline: real('discipline').default(0.5),
  courage: real('courage').default(0.5),
  wisdom: real('wisdom').default(0.5),
  charisma: real('charisma').default(0.5),
  streakDays: integer('streak_days').default(0),
  streakTier: text('streak_tier').default('none'),
  streakShields: integer('streak_shields').default(1),
  lastCompletionDate: text('last_completion_date'),
  debt: integer('debt').default(0),
  consecutiveFailDays: integer('consecutive_fail_days').default(0),
  comboCount: integer('combo_count').default(0),
  overdriveUntil: text('overdrive_until'),
  buildingUpgrades: text('building_upgrades').default('{}'),
});

// === Categories ===
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  name: text('name').notNull(),
  emoji: text('emoji').default('📋'),
  color: text('color').default('#6B7280'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at'),
});

// === Missions ===
export const missions = sqliteTable('missions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  difficulty: integer('difficulty').default(2),
  status: text('status').default('active'),
  xpReward: integer('xp_reward').default(0),
  goldReward: integer('gold_reward').default(0),
  narrativeFlavor: text('narrative_flavor'),
  categoryId: text('category_id'),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurringSourceId: text('recurring_source_id'),
  carryOverCount: integer('carry_over_count').default(0),
  dueDate: text('due_date'),
  isHabit: integer('is_habit', { mode: 'boolean' }).default(false),
  habitStreak: integer('habit_streak').default(0),
  lastHabitCompletion: text('last_habit_completion'),
  createdAt: text('created_at'),
  completedAt: text('completed_at'),
});

// === Daily Recaps ===
export const dailyRecaps = sqliteTable('daily_recaps', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  date: text('date'),
  missionsCompleted: integer('missions_completed'),
  missionsFailed: integer('missions_failed'),
  xpEarned: integer('xp_earned'),
  goldEarned: integer('gold_earned'),
  hpChange: integer('hp_change'),
  narrative: text('narrative'),
  axiomCommentary: text('axiom_commentary'),
  kaelReaction: text('kael_reaction'),
  statsSnapshot: text('stats_snapshot'),
  createdAt: text('created_at'),
});

// === Dialogue History ===
export const dialogueHistory = sqliteTable('dialogue_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  character: text('character'),
  role: text('role'),
  content: text('content'),
  gameContext: text('game_context'),
  createdAt: text('created_at'),
});

// === Agent Skills ===
export const agentSkills = sqliteTable('agent_skills', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').references(() => agents.id),
  skillId: text('skill_id'),
  name: text('name'),
  category: text('category'),
  level: integer('level').default(1),
  effectJson: text('effect_json'),
  purchasedAt: text('purchased_at'),
});

// === Inventory ===
export const inventory = sqliteTable('inventory', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').references(() => agents.id),
  itemId: text('item_id'),
  name: text('name'),
  type: text('type'),
  quantity: integer('quantity').default(1),
  effectJson: text('effect_json'),
});

// === Game Events ===
export const gameEvents = sqliteTable('game_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  type: text('type'),
  data: text('data'),
  createdAt: text('created_at'),
});

// === Agent Memory (LangChain summary memory) ===
export const agentMemory = sqliteTable('agent_memory', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  character: text('character'),
  summaryText: text('summary_text'),
  messageCount: integer('message_count').default(0),
  updatedAt: text('updated_at'),
});
