import { nanoid } from 'nanoid';
import { sql } from 'drizzle-orm';
import { DEFAULT_CATEGORIES } from '@tododo/shared';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';

const DEFAULT_USER_ID = 'default';

const SAMPLE_MISSIONS: {
  title: string;
  description?: string;
  difficulty: number;
  categoryName: string;
  isRecurring?: boolean;
}[] = [
  { title: 'Review pull requests', difficulty: 2, categoryName: 'Work' },
  { title: 'Prepare standup notes', difficulty: 1, categoryName: 'Work' },
  { title: 'Write API documentation', difficulty: 3, categoryName: 'Work' },
  { title: 'Morning workout', difficulty: 2, categoryName: 'Health', isRecurring: true },
  { title: 'Drink 8 glasses of water', difficulty: 1, categoryName: 'Health', isRecurring: true },
  { title: 'Evening walk', difficulty: 1, categoryName: 'Health' },
  { title: 'Call Mom', difficulty: 1, categoryName: 'Personal' },
  { title: 'Organize desk', difficulty: 2, categoryName: 'Personal' },
  { title: 'Read 30 pages', difficulty: 2, categoryName: 'Learning' },
  { title: 'Complete TypeScript exercise', difficulty: 3, categoryName: 'Learning' },
  { title: 'Sketch a UI concept', difficulty: 2, categoryName: 'Creative' },
  { title: 'Write journal entry', difficulty: 1, categoryName: 'Creative' },
  { title: 'Grocery shopping', difficulty: 2, categoryName: 'Errands' },
  { title: 'Pick up dry cleaning', difficulty: 1, categoryName: 'Errands' },
];

const RECURRING_TEMPLATES = ['Morning workout', 'Drink 8 glasses of water', 'Prepare standup notes'];

const MISSION_XP: Record<number, number> = { 1: 15, 2: 30, 3: 45, 4: 60, 5: 75 };
const MISSION_GOLD: Record<number, number> = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 25 };

export async function seedSampleDay(db: LibSQLDatabase<any>): Promise<void> {
  // Check if categories already exist for this user
  const existingCats = await db.all(
    sql`SELECT id FROM categories WHERE user_id = ${DEFAULT_USER_ID} LIMIT 1`,
  );
  if (existingCats.length > 0) return;

  const now = new Date().toISOString();
  const today = new Date().toISOString().slice(0, 10);

  // Seed default categories
  const categoryMap: Record<string, string> = {};
  for (const cat of DEFAULT_CATEGORIES) {
    const id = nanoid();
    categoryMap[cat.name] = id;
    await db.run(sql`
      INSERT INTO categories (id, user_id, name, emoji, color, is_default, sort_order, created_at)
      VALUES (${id}, ${DEFAULT_USER_ID}, ${cat.name}, ${cat.emoji}, ${cat.color}, 1, ${cat.sortOrder}, ${now})
    `);
  }

  console.log('[seed] Created default categories');

  // Check if missions already exist
  const existingMissions = await db.all(
    sql`SELECT id FROM missions WHERE user_id = ${DEFAULT_USER_ID} LIMIT 1`,
  );
  if (existingMissions.length > 0) return;

  // Seed recurring templates first
  const templateIds: Record<string, string> = {};
  for (const templateTitle of RECURRING_TEMPLATES) {
    const sample = SAMPLE_MISSIONS.find((m) => m.title === templateTitle);
    if (!sample) continue;
    const id = nanoid();
    templateIds[templateTitle] = id;
    const catId = categoryMap[sample.categoryName] ?? null;
    await db.run(sql`
      INSERT INTO missions (id, user_id, title, difficulty, status, xp_reward, gold_reward, category_id, is_recurring, carry_over_count, created_at)
      VALUES (${id}, ${DEFAULT_USER_ID}, ${sample.title}, ${sample.difficulty}, ${'active'}, ${MISSION_XP[sample.difficulty]}, ${MISSION_GOLD[sample.difficulty]}, ${catId}, 1, 0, ${now})
    `);
  }

  // Seed sample missions (non-recurring instances)
  for (const sample of SAMPLE_MISSIONS) {
    const id = nanoid();
    const catId = categoryMap[sample.categoryName] ?? null;
    const recurringSourceId = templateIds[sample.title] ?? null;
    await db.run(sql`
      INSERT INTO missions (id, user_id, title, difficulty, status, xp_reward, gold_reward, category_id, is_recurring, recurring_source_id, carry_over_count, due_date, created_at)
      VALUES (${id}, ${DEFAULT_USER_ID}, ${sample.title}, ${sample.difficulty}, ${'active'}, ${MISSION_XP[sample.difficulty]}, ${MISSION_GOLD[sample.difficulty]}, ${catId}, 0, ${recurringSourceId}, 0, ${today}, ${now})
    `);
  }

  console.log('[seed] Created sample missions and recurring templates');
}
