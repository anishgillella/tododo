import { Hono } from 'hono';
import { getGameState } from '../services/gameEngine';
import { runEndOfDay, getRecap, listRecaps } from '../services/scheduler';
import { initiateBossFight, getHollowStatus } from '../services/bossFight';
import {
  startCombat,
  submitAction,
  getCombatState,
  fleeCombat,
  endCombat,
} from '../services/combatService';
import { resolveEncounterRewards, getBestiary } from '../services/encounterService';
import { getAchievements } from '../services/achievementService';

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

// ── Combat Endpoints ────────────────────────────────────────────────

// POST /api/game/combat/start — start a combat session
app.post('/combat/start', async (c) => {
  try {
    const body = await c.req.json();
    const { type = 'encounter', creatureId } = body;
    const state = await startCombat(DEFAULT_USER_ID, type, creatureId);
    return c.json(state);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

// POST /api/game/combat/action — submit a player action
app.post('/combat/action', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId, action } = body;
    if (!sessionId || !action) {
      return c.json({ error: 'sessionId and action are required' }, 400);
    }
    const state = submitAction(sessionId, action);
    return c.json(state);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

// GET /api/game/combat/state — get current combat state
app.get('/combat/state', async (c) => {
  const sessionId = c.req.query('sessionId');
  if (!sessionId) {
    return c.json({ error: 'sessionId is required' }, 400);
  }
  const state = getCombatState(sessionId);
  if (!state) {
    return c.json({ error: 'Combat session not found' }, 404);
  }
  return c.json(state);
});

// POST /api/game/combat/flee — attempt to flee
app.post('/combat/flee', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId } = body;
    if (!sessionId) {
      return c.json({ error: 'sessionId is required' }, 400);
    }
    const state = fleeCombat(sessionId);
    return c.json(state);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 400);
  }
});

// POST /api/game/combat/resolve — end combat and apply rewards
app.post('/combat/resolve', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId } = body;
    if (!sessionId) {
      return c.json({ error: 'sessionId is required' }, 400);
    }
    const rewards = await resolveEncounterRewards(DEFAULT_USER_ID, sessionId);
    return c.json(rewards);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// GET /api/game/achievements — get user's achievements
app.get('/achievements', async (c) => {
  try {
    const entries = await getAchievements(DEFAULT_USER_ID);
    return c.json({ achievements: entries });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// GET /api/game/bestiary — get user's bestiary entries
app.get('/bestiary', async (c) => {
  try {
    const entries = await getBestiary(DEFAULT_USER_ID);
    return c.json({ bestiary: entries });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

export default app;
