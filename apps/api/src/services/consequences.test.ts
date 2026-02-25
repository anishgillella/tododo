import { describe, it, expect } from 'vitest';
import {
  calculateEndOfDayConsequences,
  type AgentRow,
  type MissionRow,
} from './consequences';
import type { DifficultyMode } from '@tododo/shared';

// ── Helpers ──────────────────────────────────────────────────────────

function makeAgent(overrides: Partial<AgentRow> = {}): AgentRow {
  return {
    hp: 100,
    maxHp: 100,
    debt: 0,
    streakDays: 5,
    streakTier: 'blaze',
    streakShields: 1,
    consecutiveFailDays: 0,
    ...overrides,
  };
}

function makeMission(overrides: Partial<MissionRow> = {}): MissionRow {
  return {
    id: overrides.id ?? `mission-${Math.random().toString(36).slice(2, 8)}`,
    difficulty: 2,
    carryOverCount: 0,
    title: 'Test Mission',
    ...overrides,
  };
}

// ===================================================================
// HP Damage Calculation
// ===================================================================
describe('HP damage calculation', () => {
  it('calculates HP damage for a single failed mission', () => {
    const agent = makeAgent();
    const failed = [makeMission({ difficulty: 2, carryOverCount: 0 })];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    // (2*5 + 0*3) * 1.0 = 10
    expect(result.hpDamage).toBe(10);
  });

  it('calculates cumulative HP damage for multiple failed missions', () => {
    const agent = makeAgent();
    const failed = [
      makeMission({ difficulty: 1, carryOverCount: 0 }),
      makeMission({ difficulty: 3, carryOverCount: 1 }),
      makeMission({ difficulty: 5, carryOverCount: 0 }),
    ];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    // (1*5 + 0*3) + (3*5 + 1*3) + (5*5 + 0*3) = 5 + 18 + 25 = 48
    expect(result.hpDamage).toBe(48);
  });

  it('applies explorer mode damage reduction (0.5x)', () => {
    const agent = makeAgent();
    const failed = [makeMission({ difficulty: 4, carryOverCount: 0 })];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'explorer');

    // (4*5 + 0*3) * 0.5 = 10
    expect(result.hpDamage).toBe(10);
  });

  it('applies ironclad mode damage amplification (1.5x)', () => {
    const agent = makeAgent();
    const failed = [makeMission({ difficulty: 2, carryOverCount: 0 })];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'ironclad');

    // (2*5 + 0*3) * 1.5 = 15
    expect(result.hpDamage).toBe(15);
  });

  it('increases damage for carried-over missions', () => {
    const agent = makeAgent();
    const failed = [makeMission({ difficulty: 2, carryOverCount: 3 })];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    // (2*5 + 3*3) * 1.0 = 19
    expect(result.hpDamage).toBe(19);
  });
});

// ===================================================================
// Debt Increases
// ===================================================================
describe('Debt changes', () => {
  it('adds 1 debt per failed mission', () => {
    const agent = makeAgent({ debt: 0 });
    const failed = [makeMission(), makeMission(), makeMission()];

    const result = calculateEndOfDayConsequences(agent, 2, failed, 'drifter');

    expect(result.debtChange).toBe(3);
  });

  it('adds no debt when all missions completed', () => {
    const agent = makeAgent();

    const result = calculateEndOfDayConsequences(agent, 5, [], 'drifter');

    expect(result.debtChange).toBe(0);
  });

  it('adds 1 debt for single failed mission', () => {
    const agent = makeAgent();
    const failed = [makeMission()];

    const result = calculateEndOfDayConsequences(agent, 4, failed, 'drifter');

    expect(result.debtChange).toBe(1);
  });
});

// ===================================================================
// Streak Holds (>= 80% completion)
// ===================================================================
describe('Streak holds at >= 80% completion', () => {
  it('holds streak at exactly 80% (4 of 5)', () => {
    const agent = makeAgent({ streakDays: 7 });
    const failed = [makeMission()];

    const result = calculateEndOfDayConsequences(agent, 4, failed, 'drifter');

    expect(result.streakResult.held).toBe(true);
    // Streak increments on successful day
    expect(result.streakResult.newDays).toBe(8);
  });

  it('holds streak at 100% (all complete)', () => {
    const agent = makeAgent({ streakDays: 10 });

    const result = calculateEndOfDayConsequences(agent, 5, [], 'drifter');

    expect(result.streakResult.held).toBe(true);
    expect(result.streakResult.newDays).toBe(11);
  });

  it('holds streak at 90% (9 of 10)', () => {
    const agent = makeAgent({ streakDays: 3 });
    const failed = [makeMission()];

    const result = calculateEndOfDayConsequences(agent, 9, failed, 'drifter');

    expect(result.streakResult.held).toBe(true);
    expect(result.streakResult.newDays).toBe(4);
  });

  it('holds streak with no missions (vacuous truth)', () => {
    const agent = makeAgent({ streakDays: 5 });

    const result = calculateEndOfDayConsequences(agent, 0, [], 'drifter');

    expect(result.streakResult.held).toBe(true);
    // No missions means no increment
    expect(result.streakResult.newDays).toBe(5);
  });
});

// ===================================================================
// Streak Breaks Below 80%
// ===================================================================
describe('Streak breaks below 80% completion', () => {
  it('breaks streak at 75% (3 of 4) in drifter mode', () => {
    const agent = makeAgent({ streakDays: 10, streakShields: 0 });
    const failed = [makeMission()];

    const result = calculateEndOfDayConsequences(agent, 3, failed, 'drifter');

    // 3/4 = 75% < 80% threshold, no shields
    expect(result.streakResult.held).toBe(false);
    // Drifter decay: floor(10 * 0.75) = 7
    expect(result.streakResult.newDays).toBe(7);
    expect(result.events).toContain('streak_broken');
  });

  it('decays streak in explorer mode (50% decay target)', () => {
    const agent = makeAgent({ streakDays: 10, streakShields: 0 });
    const failed = [makeMission(), makeMission()];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'explorer');

    // Explorer decay: floor(10 * 0.5) = 5
    expect(result.streakResult.held).toBe(false);
    expect(result.streakResult.newDays).toBe(5);
  });

  it('resets streak to 0 in ironclad mode (0% decay target)', () => {
    const agent = makeAgent({ streakDays: 20, streakShields: 0 });
    const failed = [makeMission(), makeMission(), makeMission()];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'ironclad');

    // Ironclad decay: floor(20 * 0) = 0
    expect(result.streakResult.held).toBe(false);
    expect(result.streakResult.newDays).toBe(0);
    expect(result.streakResult.newTier).toBe('none');
  });

  it('updates streak tier after decay', () => {
    // Agent was at blaze (7+ days), decays to fewer days
    const agent = makeAgent({ streakDays: 8, streakTier: 'blaze', streakShields: 0 });
    const failed = [makeMission(), makeMission(), makeMission()];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    // Drifter decay: floor(8 * 0.75) = 6 — drops from blaze to flame
    expect(result.streakResult.newDays).toBe(6);
    expect(result.streakResult.newTier).toBe('flame');
  });
});

// ===================================================================
// Streak Shield Usage
// ===================================================================
describe('Streak shield usage', () => {
  it('uses shield to prevent streak break', () => {
    const agent = makeAgent({ streakDays: 10, streakShields: 2 });
    const failed = [makeMission(), makeMission(), makeMission()];

    // 0 completed, 3 failed = 0% < 80%
    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    expect(result.streakResult.held).toBe(true);
    expect(result.streakResult.shieldUsed).toBe(true);
    // Streak preserved (not incremented since below threshold, just preserved)
    expect(result.streakResult.newDays).toBe(10);
    expect(result.events).toContain('streak_shield_used');
    expect(result.events).not.toContain('streak_broken');
  });

  it('does not use shield when streak holds naturally', () => {
    const agent = makeAgent({ streakDays: 5, streakShields: 2 });
    const failed = [makeMission()];

    // 4 completed, 1 failed = 80% >= 80%
    const result = calculateEndOfDayConsequences(agent, 4, failed, 'drifter');

    expect(result.streakResult.held).toBe(true);
    expect(result.streakResult.shieldUsed).toBe(false);
    expect(result.events).not.toContain('streak_shield_used');
  });

  it('breaks streak when no shields remain', () => {
    const agent = makeAgent({ streakDays: 5, streakShields: 0 });
    const failed = [makeMission(), makeMission(), makeMission()];

    // 0 completed, 3 failed = 0%, no shields
    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    expect(result.streakResult.held).toBe(false);
    expect(result.streakResult.shieldUsed).toBe(false);
    expect(result.events).toContain('streak_broken');
  });

  it('does not use shield when streak is already at 0', () => {
    const agent = makeAgent({ streakDays: 0, streakShields: 1 });
    const failed = [makeMission()];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    // No point using shield on a 0-day streak
    expect(result.streakResult.shieldUsed).toBe(false);
    expect(result.streakResult.newDays).toBe(0);
  });
});

// ===================================================================
// Hollow Stage Escalation
// ===================================================================
describe('Hollow stage escalation', () => {
  it('escalates from dormant to whispers when debt increases from 0', () => {
    const agent = makeAgent({ debt: 0 });
    const failed = [makeMission()];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    expect(result.hollowStageChange).toBeDefined();
    expect(result.hollowStageChange!.from).toBe('dormant');
    expect(result.hollowStageChange!.to).toBe('whispers');
    expect(result.events).toContain('hollow_escalated:whispers');
  });

  it('escalates from whispers to presence at debt 4', () => {
    const agent = makeAgent({ debt: 3 });
    const failed = [makeMission()];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    // Debt goes from 3 to 4 -> whispers to presence
    expect(result.hollowStageChange).toBeDefined();
    expect(result.hollowStageChange!.from).toBe('whispers');
    expect(result.hollowStageChange!.to).toBe('presence');
  });

  it('escalates from presence to confrontation at debt 7', () => {
    const agent = makeAgent({ debt: 6 });
    const failed = [makeMission()];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    expect(result.hollowStageChange).toBeDefined();
    expect(result.hollowStageChange!.from).toBe('presence');
    expect(result.hollowStageChange!.to).toBe('confrontation');
  });

  it('escalates to forced at debt 10', () => {
    const agent = makeAgent({ debt: 9 });
    const failed = [makeMission()];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    expect(result.hollowStageChange).toBeDefined();
    expect(result.hollowStageChange!.from).toBe('confrontation');
    expect(result.hollowStageChange!.to).toBe('forced');
  });

  it('has no stage change when debt stays within same tier', () => {
    const agent = makeAgent({ debt: 1 });
    const failed = [makeMission()];

    const result = calculateEndOfDayConsequences(agent, 0, failed, 'drifter');

    // Debt goes from 1 to 2 — still in whispers
    expect(result.hollowStageChange).toBeUndefined();
  });

  it('has no stage change when no debt added', () => {
    const agent = makeAgent({ debt: 5 });

    const result = calculateEndOfDayConsequences(agent, 5, [], 'drifter');

    expect(result.hollowStageChange).toBeUndefined();
  });
});

// ===================================================================
// Empty Day (no missions)
// ===================================================================
describe('Empty day — no missions', () => {
  it('produces no consequences', () => {
    const agent = makeAgent({ streakDays: 5, debt: 0 });

    const result = calculateEndOfDayConsequences(agent, 0, [], 'drifter');

    expect(result.hpDamage).toBe(0);
    expect(result.debtChange).toBe(0);
    expect(result.streakResult.held).toBe(true);
    expect(result.streakResult.newDays).toBe(5); // preserved, not incremented
    expect(result.streakResult.shieldUsed).toBe(false);
    expect(result.hollowStageChange).toBeUndefined();
  });
});

// ===================================================================
// All Missions Complete
// ===================================================================
describe('All missions complete — perfect day', () => {
  it('increments streak, no damage, no debt', () => {
    const agent = makeAgent({ streakDays: 5, debt: 0 });

    const result = calculateEndOfDayConsequences(agent, 3, [], 'drifter');

    expect(result.hpDamage).toBe(0);
    expect(result.debtChange).toBe(0);
    expect(result.streakResult.held).toBe(true);
    expect(result.streakResult.newDays).toBe(6); // incremented
    expect(result.streakResult.shieldUsed).toBe(false);
    expect(result.hollowStageChange).toBeUndefined();
    expect(result.events).toContain('perfect_day');
  });

  it('updates streak tier on increment past threshold', () => {
    // At 6 days (flame), completing tasks should push to 7 (blaze)
    const agent = makeAgent({ streakDays: 6, streakTier: 'flame' });

    const result = calculateEndOfDayConsequences(agent, 2, [], 'drifter');

    expect(result.streakResult.newDays).toBe(7);
    expect(result.streakResult.newTier).toBe('blaze');
  });
});
