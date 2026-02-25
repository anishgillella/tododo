import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { initializeDatabase } from './db/index';
import missionsRouter from './routes/missions';
import agentRouter from './routes/agent';
import dialogueRouter from './routes/dialogue';
import gameRouter from './routes/game';
import settingsRouter from './routes/settings';
import skillsRouter from './routes/skills';
import inventoryRouter from './routes/inventory';

const app = new Hono();

// === Middleware ===
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

// === Health Check ===
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.0.1',
  });
});

// === Routes ===
app.route('/api/missions', missionsRouter);
app.route('/api/agent', agentRouter);
app.route('/api/dialogue', dialogueRouter);
app.route('/api/game', gameRouter);
app.route('/api/settings', settingsRouter);
app.route('/api/skills', skillsRouter);
app.route('/api/inventory', inventoryRouter);

// === Initialize and Start ===
const PORT = Number(process.env.PORT) || 3000;

// Initialize database (creates tables if not exist), then start server
await initializeDatabase();

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`
  =======================================
    TODODO API Server
    Running on http://localhost:${info.port}
    Health: http://localhost:${info.port}/api/health
  =======================================
    `);
  },
);

export default app;
