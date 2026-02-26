import { Hono } from 'hono';
import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { categories, missions } from '../db/schema';
import { validate, CreateCategorySchema, UpdateCategorySchema, ValidationError } from '../validators';

const app = new Hono();

const DEFAULT_USER_ID = 'default';

// GET /api/categories — list all categories ordered by sort_order
app.get('/', async (c) => {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, DEFAULT_USER_ID))
    .orderBy(categories.sortOrder);

  return c.json({ categories: rows });
});

// POST /api/categories — create a custom category
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const data = validate(CreateCategorySchema, body);

    // Get max sort_order
    const maxRows = await db.all<{ max_sort: number }>(sql`
      SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM categories WHERE user_id = ${DEFAULT_USER_ID}
    `);
    const nextSort = (maxRows[0]?.max_sort ?? -1) + 1;

    const id = nanoid();
    const now = new Date().toISOString();

    await db.insert(categories).values({
      id,
      userId: DEFAULT_USER_ID,
      name: data.name,
      emoji: data.emoji,
      color: data.color,
      isDefault: false,
      sortOrder: nextSort,
      createdAt: now,
    });

    const created = await db.select().from(categories).where(eq(categories.id, id));
    return c.json({ category: created[0] }, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

// PUT /api/categories/:id — update a category
app.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = validate(UpdateCategorySchema, body);

    const existing = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, DEFAULT_USER_ID)));

    if (existing.length === 0) {
      return c.json({ error: 'Category not found' }, 404);
    }

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.emoji !== undefined) updates.emoji = data.emoji;
    if (data.color !== undefined) updates.color = data.color;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

    if (Object.keys(updates).length > 0) {
      await db.update(categories).set(updates).where(eq(categories.id, id));
    }

    const updated = await db.select().from(categories).where(eq(categories.id, id));
    return c.json({ category: updated[0] });
  } catch (err) {
    if (err instanceof ValidationError) {
      return c.json({ error: err.message }, 400);
    }
    throw err;
  }
});

// DELETE /api/categories/:id — delete (reject if default)
app.delete('/:id', async (c) => {
  const id = c.req.param('id');

  const existing = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, DEFAULT_USER_ID)));

  if (existing.length === 0) {
    return c.json({ error: 'Category not found' }, 404);
  }

  if (existing[0].isDefault) {
    return c.json({ error: 'Cannot delete a default category' }, 400);
  }

  // Nullify category_id on missions that use this category
  await db.run(sql`
    UPDATE missions SET category_id = NULL WHERE category_id = ${id} AND user_id = ${DEFAULT_USER_ID}
  `);

  await db.delete(categories).where(eq(categories.id, id));

  return c.json({ success: true });
});

export default app;
