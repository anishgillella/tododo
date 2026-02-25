import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

const DB_PATH = process.env.DB_PATH || './tododo.db';

const client = createClient({
  url: `file:${DB_PATH}`,
});

export const db = drizzle(client, { schema });

/** Create all tables if they don't already exist. Zero-config startup. */
export async function initializeDatabase(): Promise<void> {
  console.log(`[db] Initializing database at ${DB_PATH}`);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      openrouter_api_key TEXT,
      difficulty_mode TEXT DEFAULT 'drifter',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      level INTEGER DEFAULT 1,
      xp INTEGER DEFAULT 0,
      hp INTEGER DEFAULT 100,
      max_hp INTEGER DEFAULT 100,
      energy INTEGER DEFAULT 100,
      max_energy INTEGER DEFAULT 100,
      reputation INTEGER DEFAULT 0,
      gold INTEGER DEFAULT 0,
      discipline REAL DEFAULT 0.5,
      courage REAL DEFAULT 0.5,
      wisdom REAL DEFAULT 0.5,
      charisma REAL DEFAULT 0.5,
      streak_days INTEGER DEFAULT 0,
      streak_tier TEXT DEFAULT 'none',
      streak_shields INTEGER DEFAULT 1,
      last_completion_date TEXT,
      debt INTEGER DEFAULT 0,
      consecutive_fail_days INTEGER DEFAULT 0,
      combo_count INTEGER DEFAULT 0,
      overdrive_until TEXT
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS missions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT,
      difficulty INTEGER DEFAULT 2,
      status TEXT DEFAULT 'active',
      xp_reward INTEGER DEFAULT 0,
      gold_reward INTEGER DEFAULT 0,
      narrative_flavor TEXT,
      carry_over_count INTEGER DEFAULT 0,
      due_date TEXT,
      created_at TEXT,
      completed_at TEXT
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS daily_recaps (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      date TEXT,
      missions_completed INTEGER,
      missions_failed INTEGER,
      xp_earned INTEGER,
      gold_earned INTEGER,
      hp_change INTEGER,
      narrative TEXT,
      axiom_commentary TEXT,
      kael_reaction TEXT,
      stats_snapshot TEXT,
      created_at TEXT
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS dialogue_history (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      character TEXT,
      role TEXT,
      content TEXT,
      game_context TEXT,
      created_at TEXT
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS agent_skills (
      id TEXT PRIMARY KEY,
      agent_id TEXT REFERENCES agents(id),
      skill_id TEXT,
      name TEXT,
      category TEXT,
      level INTEGER DEFAULT 1,
      effect_json TEXT,
      purchased_at TEXT
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      agent_id TEXT REFERENCES agents(id),
      item_id TEXT,
      name TEXT,
      type TEXT,
      quantity INTEGER DEFAULT 1,
      effect_json TEXT
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS game_events (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      type TEXT,
      data TEXT,
      created_at TEXT
    )
  `);

  // Ensure default user and agent exist
  const existingUsers = await db.select().from(schema.users).where(sql`id = 'default'`);
  if (existingUsers.length === 0) {
    await db.insert(schema.users).values({
      id: 'default',
      username: 'Adventurer',
      difficultyMode: 'drifter',
      createdAt: new Date().toISOString(),
    });
    await db.insert(schema.agents).values({
      id: 'default-agent',
      userId: 'default',
    });
    console.log('[db] Created default user and agent');
  }

  console.log('[db] All tables ready');
}
