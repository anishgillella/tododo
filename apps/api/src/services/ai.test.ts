import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatGameStateForPrompt,
  getCharacterPrompt,
  FALLBACK_RESPONSES,
  type GameStateForPrompt,
} from '../prompts/characters';

// We import the AI service functions lazily so we can mock fetch before they run
let generateDialogue: typeof import('./ai').generateDialogue;
let generateRecapNarrative: typeof import('./ai').generateRecapNarrative;

beforeEach(async () => {
  // Re-import to get fresh module with our mocked fetch
  const mod = await import('./ai');
  generateDialogue = mod.generateDialogue;
  generateRecapNarrative = mod.generateRecapNarrative;
});

// ── Test data ────────────────────────────────────────────────────────

const mockAgent = {
  level: 5,
  hp: 80,
  maxHp: 100,
  xp: 120,
  gold: 250,
  streakDays: 7,
  streakTier: 'blaze',
  debt: 2,
  comboCount: 3,
  discipline: 0.7,
  courage: 0.6,
  wisdom: 0.5,
  charisma: 0.4,
};

const mockMissions = [
  { title: 'Fix the navigation array', difficulty: 3 },
  { title: 'Send weekly report', difficulty: 2 },
];

const mockEvents = ['mission_complete', 'combo_x3', 'level_up_5'];

const mockGameState: GameStateForPrompt = {
  ...mockAgent,
  activeMissions: mockMissions,
  recentEvents: mockEvents,
};

// ===================================================================
// formatGameStateForPrompt
// ===================================================================
describe('formatGameStateForPrompt', () => {
  it('returns a string containing level, HP, streak, debt', () => {
    const result = formatGameStateForPrompt(mockAgent, mockMissions, mockEvents);

    expect(typeof result).toBe('string');
    expect(result).toContain('Level: 5');
    expect(result).toContain('HP: 80 / 100');
    expect(result).toContain('Streak: 7 days (blaze)');
    expect(result).toContain('Debt: 2');
    expect(result).toContain('Combo Count: 3');
    expect(result).toContain('Gold: 250');
    expect(result).toContain('XP: 120');
  });

  it('includes active missions in the output', () => {
    const result = formatGameStateForPrompt(mockAgent, mockMissions, mockEvents);

    expect(result).toContain('Fix the navigation array');
    expect(result).toContain('difficulty 3');
    expect(result).toContain('Send weekly report');
    expect(result).toContain('difficulty 2');
  });

  it('includes recent events in the output', () => {
    const result = formatGameStateForPrompt(mockAgent, mockMissions, mockEvents);

    expect(result).toContain('mission_complete');
    expect(result).toContain('combo_x3');
    expect(result).toContain('level_up_5');
  });

  it('includes personality traits as percentages', () => {
    const result = formatGameStateForPrompt(mockAgent, mockMissions, mockEvents);

    expect(result).toContain('Discipline 70%');
    expect(result).toContain('Courage 60%');
    expect(result).toContain('Wisdom 50%');
    expect(result).toContain('Charisma 40%');
  });

  it('handles empty missions and events gracefully', () => {
    const result = formatGameStateForPrompt(mockAgent, [], []);

    expect(result).toContain('(none)');
    expect(result).toContain('(none recently)');
  });

  it('uses defaults for missing agent fields', () => {
    const result = formatGameStateForPrompt({}, [], []);

    expect(result).toContain('Level: 1');
    expect(result).toContain('HP: 100 / 100');
    expect(result).toContain('Gold: 0');
    expect(result).toContain('Streak: 0 days (none)');
  });
});

// ===================================================================
// getCharacterPrompt
// ===================================================================
describe('getCharacterPrompt', () => {
  const dummyGameState = '=== CURRENT GAME STATE ===\nLevel: 1\n=== END GAME STATE ===';

  it('returns a string for axiom containing personality keywords', () => {
    const prompt = getCharacterPrompt('axiom', dummyGameState);
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('AXIOM');
    expect(prompt).toContain('sarcastic');
    expect(prompt).toContain('Tododo');
    expect(prompt).toContain(dummyGameState);
  });

  it('returns a string for kael containing personality keywords', () => {
    const prompt = getCharacterPrompt('kael', dummyGameState);
    expect(prompt).toContain('Kael');
    expect(prompt).toContain('cocky');
    expect(prompt).toContain('rival');
  });

  it('returns a string for mira containing personality keywords', () => {
    const prompt = getCharacterPrompt('mira', dummyGameState);
    expect(prompt).toContain('Mira');
    expect(prompt).toContain('wise');
    expect(prompt).toContain('Twilight Hearth');
  });

  it('returns a string for hollow containing personality keywords', () => {
    const prompt = getCharacterPrompt('hollow', dummyGameState);
    expect(prompt).toContain('Hollow');
    expect(prompt).toContain('neglect');
    expect(prompt).toContain('cold');
  });

  it('returns a string for drifter containing narrator keywords', () => {
    const prompt = getCharacterPrompt('drifter', dummyGameState);
    expect(prompt).toContain('Drifter');
    expect(prompt).toContain('narrator');
    expect(prompt).toContain('third person');
  });

  it('throws for an unknown character', () => {
    expect(() => getCharacterPrompt('unknown_npc', dummyGameState)).toThrow(
      'Unknown character: unknown_npc',
    );
  });

  it('includes game state in the prompt', () => {
    const prompt = getCharacterPrompt('axiom', dummyGameState);
    expect(prompt).toContain('CURRENT GAME STATE');
    expect(prompt).toContain('Level: 1');
  });
});

// ===================================================================
// generateDialogue — mocked fetch
// ===================================================================
describe('generateDialogue with mocked fetch', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('calls OpenRouter and returns the assistant response', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'Ah. You again. How thrilling.',
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await generateDialogue(
      'axiom',
      'Hello AXIOM',
      mockGameState,
      'test-api-key',
    );

    expect(result).toBe('Ah. You again. How thrilling.');

    // Verify fetch was called with correct shape
    expect(globalThis.fetch).toHaveBeenCalledOnce();
    const [url, options] = (globalThis.fetch as any).mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(options.method).toBe('POST');

    const headers = options.headers;
    expect(headers['Authorization']).toBe('Bearer test-api-key');
    expect(headers['Content-Type']).toBe('application/json');

    const body = JSON.parse(options.body);
    expect(body.model).toBe('meta-llama/llama-3.1-8b-instruct:free');
    expect(body.max_tokens).toBe(300);
    expect(body.temperature).toBe(0.8);
    expect(body.messages).toBeDefined();
    expect(body.messages.length).toBeGreaterThanOrEqual(2); // system + user
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[body.messages.length - 1].role).toBe('user');
    expect(body.messages[body.messages.length - 1].content).toBe('Hello AXIOM');
  });

  it('includes recent history in the messages array', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Response with context.' } }],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const history = [
      { role: 'user', content: 'Previous question' },
      { role: 'assistant', content: 'Previous answer' },
    ];

    await generateDialogue('axiom', 'Follow up', mockGameState, 'key', history);

    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
    // system + 2 history + 1 user = 4
    expect(body.messages.length).toBe(4);
    expect(body.messages[1].content).toBe('Previous question');
    expect(body.messages[2].content).toBe('Previous answer');
    expect(body.messages[3].content).toBe('Follow up');
  });

  it('returns fallback response when fetch throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await generateDialogue(
      'kael',
      'Hey Kael',
      mockGameState,
      'test-api-key',
    );

    expect(result).toBe(FALLBACK_RESPONSES.kael);
  });

  it('returns fallback response when API returns non-ok status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Rate limited' }),
    });

    const result = await generateDialogue(
      'mira',
      'Hello Mira',
      mockGameState,
      'test-api-key',
    );

    expect(result).toBe(FALLBACK_RESPONSES.mira);
  });

  it('returns fallback response when response has no choices', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [] }),
    });

    const result = await generateDialogue(
      'hollow',
      'Speak',
      mockGameState,
      'test-api-key',
    );

    expect(result).toBe(FALLBACK_RESPONSES.hollow);
  });
});

// ===================================================================
// generateRecapNarrative — mocked fetch
// ===================================================================
describe('generateRecapNarrative with mocked fetch', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockDayResults = {
    missionsCompleted: 4,
    missionsFailed: 1,
    xpEarned: 150,
    goldEarned: 60,
    hpChange: -5,
    streakHeld: true,
    newStreakDays: 8,
    events: ['day_end', 'mission_failed:abc'],
  };

  it('returns parsed narrative, axiomCommentary, and kaelReaction', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              narrative: 'The Drifter fought valiantly through the station corridors.',
              axiomCommentary: 'Performance: marginally above pathetic.',
              kaelReaction: 'Not bad. Still worse than me though.',
            }),
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await generateRecapNarrative(
      { level: 5, hp: 95, debt: 1 },
      mockDayResults,
      'test-api-key',
    );

    expect(result.narrative).toBe('The Drifter fought valiantly through the station corridors.');
    expect(result.axiomCommentary).toBe('Performance: marginally above pathetic.');
    expect(result.kaelReaction).toBe('Not bad. Still worse than me though.');
  });

  it('uses raw text as narrative when JSON parsing fails', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'Just some plain text narrative that is not JSON.',
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await generateRecapNarrative(
      { level: 3 },
      mockDayResults,
      'test-api-key',
    );

    expect(result.narrative).toBe('Just some plain text narrative that is not JSON.');
    // axiomCommentary and kaelReaction should use fallback
    expect(result.axiomCommentary).toBeDefined();
    expect(result.kaelReaction).toBeDefined();
  });

  it('returns fallback recap when fetch throws', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await generateRecapNarrative(
      { level: 1 },
      mockDayResults,
      'test-api-key',
    );

    expect(result.narrative).toBeDefined();
    expect(result.narrative.length).toBeGreaterThan(0);
    expect(result.axiomCommentary).toBeDefined();
    expect(result.kaelReaction).toBeDefined();
  });

  it('returns fallback recap when API returns non-ok status', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' }),
    });

    const result = await generateRecapNarrative(
      { level: 1 },
      mockDayResults,
      'test-api-key',
    );

    expect(result.narrative).toBeDefined();
    expect(result.narrative.length).toBeGreaterThan(0);
    expect(result.axiomCommentary).toBeDefined();
    expect(result.kaelReaction).toBeDefined();
  });

  it('returns correct response shape with all three fields', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              narrative: 'A tale of glory.',
              axiomCommentary: 'Adequate.',
              kaelReaction: 'Meh.',
            }),
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await generateRecapNarrative(
      { level: 10, hp: 50, debt: 5 },
      mockDayResults,
      'test-api-key',
    );

    expect(typeof result.narrative).toBe('string');
    expect(typeof result.axiomCommentary).toBe('string');
    expect(typeof result.kaelReaction).toBe('string');
  });
});
