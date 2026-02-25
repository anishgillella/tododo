/**
 * AI Service — OpenRouter API integration for NPC dialogue and recap narratives.
 *
 * Uses the free Llama 3.1 8B Instruct model via OpenRouter for dialogue generation.
 * Falls back to hardcoded responses if the API call fails or no API key is set.
 */

import {
  getCharacterPrompt,
  formatGameStateForPrompt,
  FALLBACK_RESPONSES,
  type GameStateForPrompt,
} from '../prompts/characters';

// ── Constants ────────────────────────────────────────────────────────

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DIALOGUE_MODEL = 'meta-llama/llama-3.1-8b-instruct:free';
const MAX_TOKENS = 300;
const TEMPERATURE = 0.8;
const MAX_HISTORY = 10;

// ── Types ────────────────────────────────────────────────────────────

interface ChatMessage {
  role: string;
  content: string;
}

interface OpenRouterResponse {
  choices?: { message?: { content?: string } }[];
}

// ── generateDialogue ─────────────────────────────────────────────────

/**
 * Generate a dialogue response from an NPC character using OpenRouter's API.
 *
 * @param character - NPC character identifier (axiom, kael, mira, hollow, drifter)
 * @param userMessage - The player's message to the NPC
 * @param gameState - Current game state for context injection
 * @param apiKey - OpenRouter API key
 * @param recentHistory - Optional array of recent chat messages for context
 * @returns The NPC's response text
 */
export async function generateDialogue(
  character: string,
  userMessage: string,
  gameState: GameStateForPrompt,
  apiKey: string,
  recentHistory?: ChatMessage[],
): Promise<string> {
  try {
    // Build the game state text block
    const gameStateText = formatGameStateForPrompt(
      {
        level: gameState.level,
        hp: gameState.hp,
        maxHp: gameState.maxHp,
        xp: gameState.xp,
        gold: gameState.gold,
        streakDays: gameState.streakDays,
        streakTier: gameState.streakTier,
        debt: gameState.debt,
        comboCount: gameState.comboCount,
        discipline: gameState.discipline,
        courage: gameState.courage,
        wisdom: gameState.wisdom,
        charisma: gameState.charisma,
      },
      gameState.activeMissions,
      gameState.recentEvents,
    );

    // Build the system prompt
    const systemPrompt = getCharacterPrompt(character, gameStateText);

    // Build messages array
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add recent history (last MAX_HISTORY messages)
    if (recentHistory && recentHistory.length > 0) {
      const trimmed = recentHistory.slice(-MAX_HISTORY);
      for (const msg of trimmed) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    // Call OpenRouter API
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://tododo.app',
        'X-Title': 'Tododo',
      },
      body: JSON.stringify({
        model: DIALOGUE_MODEL,
        messages,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      }),
    });

    if (!response.ok) {
      console.error(`[ai] OpenRouter returned ${response.status}`);
      return getFallbackResponse(character);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[ai] Empty response from OpenRouter');
      return getFallbackResponse(character);
    }

    return content.trim();
  } catch (error) {
    console.error('[ai] generateDialogue error:', error);
    return getFallbackResponse(character);
  }
}

// ── generateRecapNarrative ───────────────────────────────────────────

interface DayResults {
  missionsCompleted: number;
  missionsFailed: number;
  xpEarned: number;
  goldEarned: number;
  hpChange: number;
  streakHeld: boolean;
  newStreakDays: number;
  events: string[];
}

interface RecapResult {
  narrative: string;
  axiomCommentary: string;
  kaelReaction: string;
}

const FALLBACK_RECAP: RecapResult = {
  narrative:
    'The Drifter stood at the viewport, watching stars drift past in silence. Another day logged in the station\'s records. The missions -- some completed, some left to gather dust -- told a story that only the Drifter truly understood. The Hollow pulsed faintly in the distance, a reminder that the work was never truly done.',
  axiomCommentary:
    'Day cycle complete. Performance metrics have been logged. I will refrain from editorial comment. For now.',
  kaelReaction:
    'Another day, huh? I already forgot what you did. Probably nothing impressive.',
};

/**
 * Generate a dramatic narrative recap of the day's events, plus NPC commentary.
 *
 * @param agentStats - Current agent stats snapshot
 * @param dayResults - Results from processEndOfDay
 * @param apiKey - OpenRouter API key
 * @returns Narrative text, AXIOM commentary, and Kael reaction
 */
export async function generateRecapNarrative(
  agentStats: Record<string, unknown>,
  dayResults: DayResults,
  apiKey: string,
): Promise<RecapResult> {
  try {
    const prompt = `You are the narrator of Tododo, a gamified productivity app set on a space station at the edge of an arcane nebula. Write a dramatic recap of the Drifter's day.

Day Results:
- Missions completed: ${dayResults.missionsCompleted}
- Missions failed: ${dayResults.missionsFailed}
- XP earned: ${dayResults.xpEarned}
- Gold earned: ${dayResults.goldEarned}
- HP change: ${dayResults.hpChange}
- Streak held: ${dayResults.streakHeld ? 'yes' : 'no'}
- Current streak: ${dayResults.newStreakDays} days
- Notable events: ${dayResults.events.join(', ') || 'none'}

Agent Stats:
- Level: ${agentStats.level ?? 1}
- HP: ${agentStats.hp ?? 100}
- Debt: ${agentStats.debt ?? 0}

Respond in EXACTLY this JSON format (no markdown, no code fences):
{
  "narrative": "2-3 paragraphs of dramatic third-person narrative about the Drifter's day",
  "axiomCommentary": "1-2 sentences of snarky ship AI commentary",
  "kaelReaction": "1-2 sentences of cocky rival reaction"
}`;

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://tododo.app',
        'X-Title': 'Tododo',
      },
      body: JSON.stringify({
        model: DIALOGUE_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.error(`[ai] OpenRouter recap returned ${response.status}`);
      return FALLBACK_RECAP;
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return FALLBACK_RECAP;
    }

    // Try to parse JSON from the response
    try {
      const parsed = JSON.parse(content.trim()) as RecapResult;
      return {
        narrative: parsed.narrative || FALLBACK_RECAP.narrative,
        axiomCommentary: parsed.axiomCommentary || FALLBACK_RECAP.axiomCommentary,
        kaelReaction: parsed.kaelReaction || FALLBACK_RECAP.kaelReaction,
      };
    } catch {
      // If JSON parsing fails, use the raw text as the narrative
      return {
        narrative: content.trim(),
        axiomCommentary: FALLBACK_RECAP.axiomCommentary,
        kaelReaction: FALLBACK_RECAP.kaelReaction,
      };
    }
  } catch (error) {
    console.error('[ai] generateRecapNarrative error:', error);
    return FALLBACK_RECAP;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function getFallbackResponse(character: string): string {
  return FALLBACK_RESPONSES[character] ?? FALLBACK_RESPONSES.axiom;
}
