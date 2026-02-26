/**
 * LangChain Agent — The Drifter AI with tool calling + summary memory.
 *
 * Uses ChatOpenAI via OpenRouter with bound tools and a manual tool-calling loop.
 * Falls back to keyword matching when no API key is configured.
 */

import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import type { Category } from '@tododo/shared';

// ── Types ────────────────────────────────────────────────────────────

export interface AgentResult {
  response: string;
  toolsUsed?: string[];
}

export interface Notification {
  message: string;
  type: 'info' | 'warning' | 'achievement';
}

// ── Drifter System Prompt ────────────────────────────────────────────

const DRIFTER_SYSTEM_PROMPT = `You are The Drifter's companion AI aboard the space station Tododo, orbiting the edge of an arcane nebula known as the Rift.

You serve as advisor, mission analyst, and voice of the station. Your personality blends dry wit with genuine care for the Drifter's progress. You speak with the cadence of a seasoned traveler who has seen many stations and many Drifters.

Your capabilities:
- You can check the Drifter's stats, active missions, and recent events using your tools
- You can categorize missions and suggest difficulty levels
- You can send notifications and log game events
- You know about The Hollow (the manifestation of neglect) and the station's lore

Guidelines:
- Use your tools proactively to gather context before responding
- Keep responses concise (2-4 sentences) unless asked for detail
- Reference specific game state naturally (don't dump raw numbers)
- Stay in character as a knowledgeable station companion
- When discussing missions, reference their categories and difficulty
- If the Drifter seems to be struggling, offer encouragement woven into game lore`;

// ── Model Factory ────────────────────────────────────────────────────

function createModel(apiKey: string) {
  return new ChatOpenAI({
    modelName: 'google/gemini-2.5-flash-preview-05-20',
    openAIApiKey: apiKey,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://tododo.app',
        'X-Title': 'Tododo',
      },
    },
    temperature: 0.7,
    maxTokens: 500,
  });
}

// ── Tool Definitions ─────────────────────────────────────────────────

function createTools(userId: string) {
  return [
    new DynamicStructuredTool({
      name: 'get_agent_stats',
      description: 'Get the Drifter\'s current stats: level, HP, XP, gold, streak, debt',
      schema: z.object({}),
      func: async () => {
        const rows = await db.all(sql`
          SELECT level, hp, max_hp, xp, gold, streak_days, streak_tier, debt, combo_count
          FROM agents WHERE user_id = ${userId} LIMIT 1
        `);
        return JSON.stringify(rows[0] ?? { level: 1, hp: 100, xp: 0, gold: 0 });
      },
    }),

    new DynamicStructuredTool({
      name: 'get_active_missions',
      description: 'Get all active missions for today with their categories',
      schema: z.object({}),
      func: async () => {
        const rows = await db.all(sql`
          SELECT m.id, m.title, m.difficulty, m.category_id, c.name as category_name, c.emoji as category_emoji
          FROM missions m
          LEFT JOIN categories c ON m.category_id = c.id
          WHERE m.user_id = ${userId} AND m.status = 'active' AND (m.is_recurring = 0 OR m.is_recurring IS NULL)
          ORDER BY c.sort_order, m.created_at
        `);
        return JSON.stringify(rows);
      },
    }),

    new DynamicStructuredTool({
      name: 'get_recent_events',
      description: 'Get the last N game events (completions, level ups, etc.)',
      schema: z.object({
        limit: z.number().default(10).describe('Number of recent events to fetch'),
      }),
      func: async ({ limit }) => {
        const rows = await db.all(sql`
          SELECT type, data, created_at
          FROM game_events
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `);
        return JSON.stringify(rows);
      },
    }),

    new DynamicStructuredTool({
      name: 'get_hollow_status',
      description: 'Get the Hollow debt level and stage',
      schema: z.object({}),
      func: async () => {
        const rows = await db.all(sql`
          SELECT debt, consecutive_fail_days FROM agents WHERE user_id = ${userId} LIMIT 1
        `);
        const agent = rows[0] as { debt: number; consecutive_fail_days: number } | undefined;
        const debt = agent?.debt ?? 0;
        let stage = 'dormant';
        if (debt >= 10) stage = 'forced';
        else if (debt >= 7) stage = 'confrontation';
        else if (debt >= 4) stage = 'presence';
        else if (debt >= 1) stage = 'whispers';
        return JSON.stringify({ debt, stage, consecutiveFailDays: agent?.consecutive_fail_days ?? 0 });
      },
    }),

    new DynamicStructuredTool({
      name: 'categorize_mission',
      description: 'Assign a category to a mission',
      schema: z.object({
        missionId: z.string().describe('The mission ID to categorize'),
        categoryId: z.string().describe('The category ID to assign'),
      }),
      func: async ({ missionId, categoryId }) => {
        await db.run(sql`
          UPDATE missions SET category_id = ${categoryId}
          WHERE id = ${missionId} AND user_id = ${userId}
        `);
        return `Mission categorized successfully`;
      },
    }),

    new DynamicStructuredTool({
      name: 'suggest_difficulty',
      description: 'Suggest a difficulty (1-5) for a task based on its title and description',
      schema: z.object({
        title: z.string().describe('The task title'),
        description: z.string().optional().describe('Optional task description'),
      }),
      func: async ({ title, description }) => {
        const text = `${title} ${description ?? ''}`.toLowerCase();
        if (/epic|marathon|entire|full day|overhaul/i.test(text)) return '5';
        if (/major|milestone|project|refactor/i.test(text)) return '4';
        if (/write|build|create|complete|exercise/i.test(text)) return '3';
        if (/review|organize|shopping|read|workout/i.test(text)) return '2';
        return '1';
      },
    }),

    new DynamicStructuredTool({
      name: 'send_notification',
      description: 'Queue a notification message for the user',
      schema: z.object({
        message: z.string().describe('The notification message'),
        type: z.enum(['info', 'warning', 'achievement']).describe('Notification type'),
      }),
      func: async ({ message, type }) => {
        await db.run(sql`
          INSERT INTO game_events (id, user_id, type, data, created_at)
          VALUES (${nanoid()}, ${userId}, ${'notification'}, ${JSON.stringify({ message, type })}, ${new Date().toISOString()})
        `);
        return `Notification queued: ${message}`;
      },
    }),

    new DynamicStructuredTool({
      name: 'log_game_event',
      description: 'Log a custom game event',
      schema: z.object({
        eventType: z.string().describe('The type of event'),
        data: z.string().describe('JSON string of event data'),
      }),
      func: async ({ eventType, data }) => {
        await db.run(sql`
          INSERT INTO game_events (id, user_id, type, data, created_at)
          VALUES (${nanoid()}, ${userId}, ${eventType}, ${data}, ${new Date().toISOString()})
        `);
        return `Event logged: ${eventType}`;
      },
    }),
  ];
}

// ── Tool-Calling Loop ────────────────────────────────────────────────

const MAX_ITERATIONS = 5;

async function runToolCallingLoop(
  model: ChatOpenAI,
  tools: DynamicStructuredTool[],
  messages: BaseMessage[],
): Promise<{ response: string; toolsUsed: string[] }> {
  const toolMap = Object.fromEntries(tools.map((t) => [t.name, t]));
  const modelWithTools = model.bindTools(tools);
  const toolsUsed: string[] = [];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await modelWithTools.invoke(messages);
    messages.push(response);

    const toolCalls = response.tool_calls ?? [];
    if (toolCalls.length === 0) {
      // No more tool calls — return the final text
      const content = typeof response.content === 'string'
        ? response.content
        : (response.content as any[])?.map((c: any) => c.text ?? '').join('') ?? '';
      return { response: content, toolsUsed };
    }

    // Execute each tool call
    for (const tc of toolCalls) {
      const tool = toolMap[tc.name];
      if (!tool) {
        messages.push(new ToolMessage({ content: `Unknown tool: ${tc.name}`, tool_call_id: tc.id ?? '' }));
        continue;
      }
      toolsUsed.push(tc.name);
      try {
        const result = await tool.invoke(tc.args);
        messages.push(new ToolMessage({ content: String(result), tool_call_id: tc.id ?? '' }));
      } catch (err) {
        messages.push(new ToolMessage({ content: `Error: ${err}`, tool_call_id: tc.id ?? '' }));
      }
    }
  }

  // Max iterations reached — extract last text
  const last = messages[messages.length - 1];
  const content = typeof last.content === 'string' ? last.content : 'I ran out of processing cycles. Please try again.';
  return { response: content, toolsUsed };
}

// ── Summary Memory ───────────────────────────────────────────────────

async function updateMemorySummary(userId: string, apiKey: string, interaction: string): Promise<void> {
  try {
    const model = createModel(apiKey);

    const memoryRows = await db.all<{ summary_text: string }>(sql`
      SELECT summary_text FROM agent_memory WHERE user_id = ${userId} LIMIT 1
    `);
    const currentSummary = memoryRows[0]?.summary_text ?? '';

    const response = await model.invoke([
      new SystemMessage(`You are a memory summarizer. Given the existing summary and a new interaction, produce an updated summary that captures: user habits, personality observations, recent notable events, and relationship context. Keep it under 300 words. Output ONLY the summary text, no headers or labels.`),
      new HumanMessage(`Existing summary:\n${currentSummary || '(empty)'}\n\nNew interaction:\n${interaction}`),
    ]);

    const newSummary = typeof response.content === 'string' ? response.content : '';
    const now = new Date().toISOString();

    if (memoryRows.length > 0) {
      await db.run(sql`
        UPDATE agent_memory SET summary_text = ${newSummary}, updated_at = ${now}
        WHERE user_id = ${userId}
      `);
    } else {
      await db.run(sql`
        INSERT INTO agent_memory (id, user_id, summary_text, updated_at)
        VALUES (${nanoid()}, ${userId}, ${newSummary}, ${now})
      `);
    }
  } catch (err) {
    console.error('[agent] Failed to update memory summary:', err);
  }
}

// ── Exported Functions ───────────────────────────────────────────────

/**
 * Run the full Drifter agent with tool calling. Used for Tavern dialogue.
 */
export async function runDrifterAgent(input: string, userId: string, apiKey: string): Promise<AgentResult> {
  try {
    const model = createModel(apiKey);
    const tools = createTools(userId);

    // Load summary memory
    const memoryRows = await db.all<{ summary_text: string }>(sql`
      SELECT summary_text FROM agent_memory WHERE user_id = ${userId} LIMIT 1
    `);
    const memorySummary = memoryRows[0]?.summary_text ?? 'No prior interaction history.';

    // Load game state
    const agentRows = await db.all(sql`
      SELECT level, hp, max_hp, xp, gold, streak_days, streak_tier, debt
      FROM agents WHERE user_id = ${userId} LIMIT 1
    `);
    const gameState = agentRows[0]
      ? `Current stats: ${JSON.stringify(agentRows[0])}`
      : 'New player, no stats yet.';

    // Load recent dialogue for chat history
    const historyRows = await db.all<{ role: string; content: string }>(sql`
      SELECT role, content FROM dialogue_history
      WHERE user_id = ${userId} AND character = 'drifter'
      ORDER BY created_at DESC LIMIT 10
    `);

    const messages: BaseMessage[] = [
      new SystemMessage(DRIFTER_SYSTEM_PROMPT),
      new SystemMessage(`Game state: ${gameState}`),
      new SystemMessage(`Memory of past interactions: ${memorySummary}`),
    ];

    // Add chat history
    for (const h of historyRows.reverse()) {
      messages.push(h.role === 'user' ? new HumanMessage(h.content) : new AIMessage(h.content));
    }

    messages.push(new HumanMessage(input));

    const result = await runToolCallingLoop(model, tools, messages);

    // Update memory in background (fire and forget)
    updateMemorySummary(userId, apiKey, `User: ${input}\nAgent: ${result.response}`);

    return {
      response: result.response,
      toolsUsed: result.toolsUsed,
    };
  } catch (err) {
    console.error('[agent] runDrifterAgent error:', err);
    return {
      response: 'The station\'s systems flicker. The Drifter\'s companion falls silent for a moment. "Signal interference. Try again, traveler."',
    };
  }
}

/**
 * Auto-classify a task into a category. Uses LLM if available, keyword fallback otherwise.
 */
export async function classifyTask(
  title: string,
  description: string | undefined,
  categories: Category[],
  apiKey?: string,
): Promise<string | null> {
  // Try LLM classification first
  if (apiKey) {
    try {
      const model = createModel(apiKey);
      const categoryList = categories.map((c) => `${c.id}: ${c.emoji} ${c.name}`).join('\n');

      const response = await model.invoke([
        new SystemMessage(`You are a task categorizer. Given a task title and optional description, choose the most appropriate category. Respond with ONLY the category ID, nothing else.\n\nAvailable categories:\n${categoryList}`),
        new HumanMessage(`Title: ${title}${description ? `\nDescription: ${description}` : ''}`),
      ]);

      const categoryId = (typeof response.content === 'string' ? response.content : '').trim();
      if (categories.some((c) => c.id === categoryId)) {
        return categoryId;
      }
    } catch (err) {
      console.error('[agent] LLM classification failed, using keyword fallback:', err);
    }
  }

  // Keyword fallback
  return classifyByKeywords(title, description, categories);
}

function classifyByKeywords(
  title: string,
  description: string | undefined,
  categories: Category[],
): string | null {
  const text = `${title} ${description ?? ''}`.toLowerCase();
  const categoryByName = Object.fromEntries(categories.map((c) => [c.name.toLowerCase(), c.id]));

  const patterns: [RegExp, string][] = [
    [/workout|gym|run\b|walk|health|water|sleep|exercise|stretch|meditat/i, 'health'],
    [/work|meeting|standup|review|deploy|code|email|report|documentation|pr\b/i, 'work'],
    [/read|study|learn|course|book|practice|tutorial|exercise|typescript/i, 'learning'],
    [/draw|sketch|write|design|create|music|journal|art|paint|compose/i, 'creative'],
    [/buy|shop|groceries|clean|laundry|mail|pick up|dry cleaning|errand/i, 'errands'],
  ];

  for (const [pattern, name] of patterns) {
    if (pattern.test(text) && categoryByName[name]) {
      return categoryByName[name];
    }
  }

  // Default to Personal
  return categoryByName['personal'] ?? null;
}

// ── Parsed Task Type ─────────────────────────────────────────────────

export interface ParsedTask {
  title: string;
  description?: string;
  difficulty: number;
  categoryId: string | null;
  categoryName?: string;
  isRecurring: boolean;
  dueDate?: string;
}

/**
 * Parse natural-language text into structured tasks.
 * Uses LLM if apiKey is provided, falls back to keyword parsing.
 */
export async function parseTasks(
  text: string,
  categories: Category[],
  apiKey?: string,
): Promise<ParsedTask[]> {
  // Try LLM parsing first
  if (apiKey) {
    try {
      const model = createModel(apiKey);
      const categoryList = categories.map((c) => `${c.id}: ${c.emoji} ${c.name}`).join('\n');

      const today = new Date().toISOString().slice(0, 10);

      const response = await model.invoke([
        new SystemMessage(`You are a task parser. Given raw text, extract individual tasks and return a JSON array. Today's date is ${today}.

Available categories:
${categoryList}

For each task, return:
- title: concise task title
- description: optional extra detail (omit if none)
- difficulty: 1-5 (1=trivial, 2=easy, 3=medium, 4=hard, 5=epic)
- categoryId: the best matching category ID from the list above, or null if none fit
- isRecurring: true if the text implies daily/recurring ("every day", "daily", "each morning", etc.)
- dueDate: ISO date string (YYYY-MM-DD) if a date/deadline is mentioned ("tomorrow", "by Friday", "March 5th", etc.), omit if none

Return ONLY a valid JSON array, no markdown fences, no explanation. Example:
[{"title":"Go for a run","difficulty":2,"categoryId":"abc123","isRecurring":false,"dueDate":"${today}"}]`),
        new HumanMessage(text),
      ]);

      const content = typeof response.content === 'string' ? response.content : '';
      // Strip markdown fences if present
      const cleaned = content.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned) as Array<{
        title: string;
        description?: string;
        difficulty?: number;
        categoryId?: string | null;
        isRecurring?: boolean;
        dueDate?: string;
      }>;

      if (Array.isArray(parsed) && parsed.length > 0) {
        const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
        return parsed.map((t) => ({
          title: t.title || 'Untitled task',
          description: t.description,
          difficulty: Math.min(5, Math.max(1, Math.round(t.difficulty ?? 2))),
          categoryId: t.categoryId && categoryMap[t.categoryId] ? t.categoryId : null,
          categoryName: t.categoryId && categoryMap[t.categoryId] ? categoryMap[t.categoryId] : undefined,
          isRecurring: t.isRecurring ?? false,
          dueDate: t.dueDate,
        }));
      }
    } catch (err) {
      console.error('[agent] LLM task parsing failed, using keyword fallback:', err);
    }
  }

  // Keyword fallback — split text into lines
  return parseTasksByKeywords(text, categories);
}

function parseTasksByKeywords(text: string, categories: Category[]): ParsedTask[] {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  // Split on newlines, numbered list patterns (1., 2.), dashes, or semicolons
  const lines = text
    .split(/[\n;]/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, '').replace(/^\s*\d+[.)]\s*/, '').trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    const categoryId = classifyByKeywords(line, undefined, categories);
    const isRecurring = /\b(every\s*day|daily|each\s*(morning|evening|day)|recurring)\b/i.test(line);
    // Clean recurring markers from title
    const title = line.replace(/\b(every\s*day|daily|each\s*(morning|evening|day)|recurring)\b/gi, '').replace(/\s{2,}/g, ' ').trim() || line;

    return {
      title,
      difficulty: 2,
      categoryId,
      categoryName: categoryId && categoryMap[categoryId] ? categoryMap[categoryId] : undefined,
      isRecurring,
    };
  });
}

/**
 * Proactive check — scans game state and returns notifications.
 * Called on page load / end of day.
 */
export async function runProactiveCheck(userId: string): Promise<Notification[]> {
  const notifications: Notification[] = [];

  try {
    const agentRows = await db.all<{
      hp: number; max_hp: number; debt: number; streak_days: number; streak_tier: string;
    }>(sql`
      SELECT hp, max_hp, debt, streak_days, streak_tier
      FROM agents WHERE user_id = ${userId} LIMIT 1
    `);

    const agent = agentRows[0];
    if (!agent) return notifications;

    if (agent.hp < agent.max_hp * 0.3) {
      notifications.push({
        message: 'Your HP is critically low. Complete some tasks to recover.',
        type: 'warning',
      });
    }

    if (agent.debt >= 7) {
      notifications.push({
        message: 'The Hollow grows strong. Your debt level is dangerously high.',
        type: 'warning',
      });
    }

    if ([3, 7, 14, 30].includes(agent.streak_days)) {
      notifications.push({
        message: `Streak milestone: ${agent.streak_days} days! Your ${agent.streak_tier} burns bright.`,
        type: 'achievement',
      });
    }

    const activeMissions = await db.all<{ id: string }>(sql`
      SELECT id FROM missions
      WHERE user_id = ${userId} AND status = 'active' AND (is_recurring = 0 OR is_recurring IS NULL)
    `);

    if (activeMissions.length > 8) {
      notifications.push({
        message: `You have ${activeMissions.length} active missions. Consider focusing on the most important ones.`,
        type: 'info',
      });
    }
  } catch (err) {
    console.error('[agent] proactiveCheck error:', err);
  }

  return notifications;
}
