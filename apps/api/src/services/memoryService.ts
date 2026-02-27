import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';

const SUMMARIZE_THRESHOLD = 20;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const SUMMARY_MODEL = 'openai/gpt-4o-mini';

/**
 * Increment message count for a character's memory record.
 * Creates the record if it doesn't exist.
 */
export async function incrementMessageCount(
  userId: string,
  character: string,
): Promise<number> {
  // Check if memory record exists for this character
  const existing = await db.all<{ id: string; message_count: number }>(sql`
    SELECT id, message_count FROM agent_memory
    WHERE user_id = ${userId} AND character = ${character}
    LIMIT 1
  `);

  if (existing.length === 0) {
    await db.run(sql`
      INSERT INTO agent_memory (id, user_id, character, summary_text, message_count, updated_at)
      VALUES (${nanoid()}, ${userId}, ${character}, ${null}, 1, ${new Date().toISOString()})
    `);
    return 1;
  }

  const newCount = (existing[0].message_count ?? 0) + 1;
  await db.run(sql`
    UPDATE agent_memory SET message_count = ${newCount}
    WHERE id = ${existing[0].id}
  `);
  return newCount;
}

/**
 * Check if summarization is needed (every SUMMARIZE_THRESHOLD messages).
 */
export function shouldSummarize(messageCount: number): boolean {
  return messageCount > 0 && messageCount % SUMMARIZE_THRESHOLD === 0;
}

/**
 * Fetch the existing memory summary for a character.
 */
export async function getMemory(
  userId: string,
  character: string,
): Promise<string | null> {
  const rows = await db.all<{ summary_text: string | null }>(sql`
    SELECT summary_text FROM agent_memory
    WHERE user_id = ${userId} AND character = ${character}
    LIMIT 1
  `);
  return rows[0]?.summary_text ?? null;
}

/**
 * Summarize recent dialogue and store/update the memory.
 */
export async function summarizeAndStore(
  userId: string,
  character: string,
  apiKey: string,
): Promise<void> {
  // Get the last SUMMARIZE_THRESHOLD*2 messages for context
  const messages = await db.all<{ role: string; content: string }>(sql`
    SELECT role, content FROM dialogue_history
    WHERE user_id = ${userId} AND character = ${character}
    ORDER BY created_at DESC
    LIMIT ${SUMMARIZE_THRESHOLD * 2}
  `);

  if (messages.length === 0) return;

  // Reverse to chronological order
  messages.reverse();

  // Get existing summary
  const existingSummary = await getMemory(userId, character);

  const conversationText = messages
    .map((m) => `${m.role === 'user' ? 'Drifter' : character}: ${m.content}`)
    .join('\n');

  const prompt = existingSummary
    ? `You are summarizing an ongoing conversation between a player (the Drifter) and ${character} in the fantasy village of Drifthollow.

Previous summary:
${existingSummary}

Recent conversation:
${conversationText}

Write an updated summary that combines the previous summary with key points from the recent conversation. Focus on: relationship dynamics, important topics discussed, promises or commitments made, the player's emotional state, and any memorable exchanges. Keep it under 200 words.`
    : `Summarize this conversation between a player (the Drifter) and ${character} in the fantasy village of Drifthollow.

${conversationText}

Focus on: relationship dynamics, important topics discussed, promises or commitments made, the player's emotional state, and any memorable exchanges. Keep it under 200 words.`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://tododo.app',
        'X-Title': 'Tododo',
      },
      body: JSON.stringify({
        model: SUMMARY_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error(`[memory] Summary generation failed: ${response.status}`);
      return;
    }

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    const summary = data?.choices?.[0]?.message?.content?.trim();

    if (!summary) return;

    const now = new Date().toISOString();
    await db.run(sql`
      UPDATE agent_memory
      SET summary_text = ${summary}, updated_at = ${now}
      WHERE user_id = ${userId} AND character = ${character}
    `);

    console.log(`[memory] Updated summary for ${character} (${userId})`);
  } catch (error) {
    console.error('[memory] summarizeAndStore error:', error);
  }
}
