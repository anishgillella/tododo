import { Hono } from 'hono';
import { getGameState } from '../services/gameEngine';
import { runEndOfDay, getRecap, listRecaps } from '../services/scheduler';
import { initiateBossFight, getHollowStatus } from '../services/bossFight';

const app = new Hono();

const DEFAULT_USER_ID = 'default';

// GET /api/game/state — get full game state
app.get('/state', async (c) => {
  try {
    const state = await getGameState(DEFAULT_USER_ID);
    return c.json(state);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// POST /api/game/end-of-day — trigger end-of-day processing
app.post('/end-of-day', async (c) => {
  try {
    const report = await runEndOfDay(DEFAULT_USER_ID);
    return c.json(report);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// GET /api/game/recap?date=YYYY-MM-DD — get daily recap for a specific date (default: today)
app.get('/recap', async (c) => {
  try {
    const date = c.req.query('date');
    const recap = await getRecap(DEFAULT_USER_ID, date);
    if (!recap) {
      return c.json({ recap: null, message: 'No recap found for this date' });
    }
    return c.json({ recap });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// GET /api/game/recaps — list all recaps, most recent first, limit 10
app.get('/recaps', async (c) => {
  try {
    const recaps = await listRecaps(DEFAULT_USER_ID, 10);
    return c.json({ recaps });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// POST /api/game/boss-fight — initiate a boss fight against The Hollow
app.post('/boss-fight', async (c) => {
  try {
    const result = await initiateBossFight(DEFAULT_USER_ID);
    return c.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message === 'Not enough threat to challenge The Hollow' || message === 'Agent is incapacitated') {
      return c.json({ error: message }, 400);
    }
    return c.json({ error: message }, 500);
  }
});

// GET /api/game/hollow-status — get current Hollow status and boss fight availability
app.get('/hollow-status', async (c) => {
  try {
    const status = await getHollowStatus(DEFAULT_USER_ID);
    return c.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default app;
