import { describe, it, expect, vi } from 'vitest';
import {
  xpForLevel,
  getStreakTier,
  getStreakMultiplier,
  calculateMissionXp,
  calculateMissionGold,
  rollLootDrop,
  getComboBonus,
  calculateFailureDamage,
  calculateHollowStrength,
  getHollowStage,
  calculateBossFightWinChance,
  resolveBossFight,
  shouldStreakHold,
  decayStreak,
  processLevelUp,
} from './formulas';

// ─── xpForLevel ──────────────────────────────────────────────────────────────

describe('xpForLevel', () => {
  it('returns 50 for level 1', () => {
    expect(xpForLevel(1)).toBe(50);
  });

  it('returns floor(50 * 1.12) = 56 for level 2', () => {
    expect(xpForLevel(2)).toBe(Math.floor(50 * 1.12));
    expect(xpForLevel(2)).toBe(56);
  });

  it('returns floor(50 * 1.12^2) = 62 for level 3', () => {
    expect(xpForLevel(3)).toBe(Math.floor(50 * Math.pow(1.12, 2)));
  });

  it('increases with level (monotonically increasing)', () => {
    for (let level = 2; level <= 50; level++) {
      expect(xpForLevel(level)).toBeGreaterThan(xpForLevel(level - 1));
    }
  });

  it('produces correct value for level 10', () => {
    const expected = Math.floor(50 * Math.pow(1.12, 9));
    expect(xpForLevel(10)).toBe(expected);
    expect(xpForLevel(10)).toBeGreaterThan(100);
  });

  it('produces correct value for level 100', () => {
    const expected = Math.floor(50 * Math.pow(1.12, 99));
    expect(xpForLevel(100)).toBe(expected);
    expect(xpForLevel(100)).toBeGreaterThan(5000);
  });

  it('always returns an integer', () => {
    for (let level = 1; level <= 100; level++) {
      expect(Number.isInteger(xpForLevel(level))).toBe(true);
    }
  });
});

// ─── getStreakTier ────────────────────────────────────────────────────────────

describe('getStreakTier', () => {
  it('returns "none" for 0 days', () => {
    expect(getStreakTier(0)).toBe('none');
  });

  it('returns "spark" for 1 day', () => {
    expect(getStreakTier(1)).toBe('spark');
  });

  it('returns "spark" for 2 days', () => {
    expect(getStreakTier(2)).toBe('spark');
  });

  it('returns "flame" for 3 days', () => {
    expect(getStreakTier(3)).toBe('flame');
  });

  it('returns "flame" for days 4-6', () => {
    expect(getStreakTier(4)).toBe('flame');
    expect(getStreakTier(5)).toBe('flame');
    expect(getStreakTier(6)).toBe('flame');
  });

  it('returns "blaze" for 7 days', () => {
    expect(getStreakTier(7)).toBe('blaze');
  });

  it('returns "blaze" for days 8-13', () => {
    expect(getStreakTier(8)).toBe('blaze');
    expect(getStreakTier(13)).toBe('blaze');
  });

  it('returns "inferno" for 14 days', () => {
    expect(getStreakTier(14)).toBe('inferno');
  });

  it('returns "inferno" for days 15-29', () => {
    expect(getStreakTier(15)).toBe('inferno');
    expect(getStreakTier(29)).toBe('inferno');
  });

  it('returns "eternal_fire" for 30 days', () => {
    expect(getStreakTier(30)).toBe('eternal_fire');
  });

  it('returns "eternal_fire" for days above 30', () => {
    expect(getStreakTier(31)).toBe('eternal_fire');
    expect(getStreakTier(100)).toBe('eternal_fire');
    expect(getStreakTier(365)).toBe('eternal_fire');
  });

  it('returns "none" for negative days', () => {
    expect(getStreakTier(-1)).toBe('none');
  });
});

// ─── getStreakMultiplier ─────────────────────────────────────────────────────

describe('getStreakMultiplier', () => {
  it('returns 1.0 for "none"', () => {
    expect(getStreakMultiplier('none')).toBe(1.0);
  });

  it('returns 1.1 for "spark"', () => {
    expect(getStreakMultiplier('spark')).toBe(1.1);
  });

  it('returns 1.2 for "flame"', () => {
    expect(getStreakMultiplier('flame')).toBe(1.2);
  });

  it('returns 1.3 for "blaze"', () => {
    expect(getStreakMultiplier('blaze')).toBe(1.3);
  });

  it('returns 1.5 for "inferno"', () => {
    expect(getStreakMultiplier('inferno')).toBe(1.5);
  });

  it('returns 1.75 for "eternal_fire"', () => {
    expect(getStreakMultiplier('eternal_fire')).toBe(1.75);
  });
});

// ─── calculateMissionXp ─────────────────────────────────────────────────────

describe('calculateMissionXp', () => {
  it('returns an object with xp and wasCrit properties', () => {
    const result = calculateMissionXp(1, 'none');
    expect(result).toHaveProperty('xp');
    expect(result).toHaveProperty('wasCrit');
    expect(typeof result.xp).toBe('number');
    expect(typeof result.wasCrit).toBe('boolean');
  });

  it('computes correct base XP for difficulty 1 with no streak and no crit', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // no crit (>0.05)
    const result = calculateMissionXp(1, 'none');
    expect(result.xp).toBe(15);
    expect(result.wasCrit).toBe(false);
    vi.restoreAllMocks();
  });

  it('computes correct base XP for each difficulty with no streak and no crit', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(calculateMissionXp(1, 'none').xp).toBe(15);
    expect(calculateMissionXp(2, 'none').xp).toBe(30);
    expect(calculateMissionXp(3, 'none').xp).toBe(45);
    expect(calculateMissionXp(4, 'none').xp).toBe(60);
    expect(calculateMissionXp(5, 'none').xp).toBe(75);
    vi.restoreAllMocks();
  });

  it('applies streak multiplier correctly', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // no crit
    const result = calculateMissionXp(2, 'flame'); // baseXp=30, multiplier=1.2
    expect(result.xp).toBe(Math.floor(30 * 1.2));
    expect(result.xp).toBe(36);
    vi.restoreAllMocks();
  });

  it('applies crit multiplier (2x) when random < 0.05', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01); // triggers crit
    const result = calculateMissionXp(1, 'none');
    expect(result.xp).toBe(30); // 15 * 2
    expect(result.wasCrit).toBe(true);
    vi.restoreAllMocks();
  });

  it('applies skill bonus multiplier', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // no crit
    const result = calculateMissionXp(2, 'none', 0.5); // baseXp=30, skillMult=1.5
    expect(result.xp).toBe(Math.floor(30 * 1.0 * 1.5 * 1));
    expect(result.xp).toBe(45);
    vi.restoreAllMocks();
  });

  it('applies streak, skill, and crit all together', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01); // triggers crit
    // difficulty 3 (baseXp=45), eternal_fire (1.75), skill=0.2, crit (2x)
    const result = calculateMissionXp(3, 'eternal_fire', 0.2);
    const expected = Math.floor(45 * 1.75 * 1.2 * 2);
    expect(result.xp).toBe(expected);
    expect(result.wasCrit).toBe(true);
    vi.restoreAllMocks();
  });

  it('always returns an integer for xp', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    for (let diff = 1; diff <= 5; diff++) {
      const result = calculateMissionXp(diff as 1 | 2 | 3 | 4 | 5, 'blaze', 0.33);
      expect(Number.isInteger(result.xp)).toBe(true);
    }
    vi.restoreAllMocks();
  });
});

// ─── calculateMissionGold ────────────────────────────────────────────────────

describe('calculateMissionGold', () => {
  it('returns base gold within expected range for difficulty 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // picks min gold
    expect(calculateMissionGold(1, false, false)).toBe(5);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.999); // picks near max gold
    const gold = calculateMissionGold(1, false, false);
    expect(gold).toBeGreaterThanOrEqual(5);
    expect(gold).toBeLessThanOrEqual(8);
    vi.restoreAllMocks();
  });

  it('returns base gold within expected range for difficulty 5', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(calculateMissionGold(5, false, false)).toBe(25);
    vi.restoreAllMocks();

    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const gold = calculateMissionGold(5, false, false);
    expect(gold).toBeGreaterThanOrEqual(25);
    expect(gold).toBeLessThanOrEqual(40);
    vi.restoreAllMocks();
  });

  it('applies jackpot multiplier (3x)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // min base gold
    const normal = calculateMissionGold(2, false, false); // base=10
    const jackpot = calculateMissionGold(2, true, false); // base=10, *3
    expect(jackpot).toBe(normal * 3);
    vi.restoreAllMocks();
  });

  it('applies overdrive multiplier (2x)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const normal = calculateMissionGold(3, false, false); // base=15
    const overdrive = calculateMissionGold(3, false, true); // base=15, *2
    expect(overdrive).toBe(normal * 2);
    vi.restoreAllMocks();
  });

  it('applies both jackpot and overdrive (3x * 2x = 6x)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const normal = calculateMissionGold(4, false, false); // base=20
    const combined = calculateMissionGold(4, true, true); // base=20, *3*2
    expect(combined).toBe(normal * 6);
    vi.restoreAllMocks();
  });

  it('always returns an integer', () => {
    for (let i = 0; i < 20; i++) {
      const gold = calculateMissionGold(3, true, true);
      expect(Number.isInteger(gold)).toBe(true);
    }
  });
});

// ─── rollLootDrop ────────────────────────────────────────────────────────────

describe('rollLootDrop', () => {
  it('returns a boolean', () => {
    expect(typeof rollLootDrop()).toBe('boolean');
  });

  it('returns true when random < 0.08', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.01);
    expect(rollLootDrop()).toBe(true);
    vi.restoreAllMocks();
  });

  it('returns false when random >= 0.08', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(rollLootDrop()).toBe(false);
    vi.restoreAllMocks();
  });

  it('returns true at the boundary (just under 0.08)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.0799);
    expect(rollLootDrop()).toBe(true);
    vi.restoreAllMocks();
  });

  it('returns false at the boundary (exactly 0.08)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.08);
    expect(rollLootDrop()).toBe(false);
    vi.restoreAllMocks();
  });

  it('has a drop rate approximately 8% over many trials', () => {
    vi.restoreAllMocks();
    const trials = 10000;
    let drops = 0;
    for (let i = 0; i < trials; i++) {
      if (rollLootDrop()) drops++;
    }
    const rate = drops / trials;
    // 8% +/- 3%
    expect(rate).toBeGreaterThan(0.05);
    expect(rate).toBeLessThan(0.11);
  });
});

// ─── getComboBonus ───────────────────────────────────────────────────────────

describe('getComboBonus', () => {
  it('returns 0 for combo count 0', () => {
    expect(getComboBonus(0)).toBe(0);
  });

  it('returns 0 for combo count 1', () => {
    expect(getComboBonus(1)).toBe(0);
  });

  it('returns 5 for combo count 2', () => {
    expect(getComboBonus(2)).toBe(5);
  });

  it('returns 15 for combo count 3', () => {
    expect(getComboBonus(3)).toBe(15);
  });

  it('returns 30 for combo count 4', () => {
    expect(getComboBonus(4)).toBe(30);
  });

  it('returns 50 for combo count 5', () => {
    expect(getComboBonus(5)).toBe(50);
  });

  it('returns 50 for combo counts above 5 (caps at 5)', () => {
    expect(getComboBonus(6)).toBe(50);
    expect(getComboBonus(10)).toBe(50);
    expect(getComboBonus(100)).toBe(50);
  });
});

// ─── calculateFailureDamage ──────────────────────────────────────────────────

describe('calculateFailureDamage', () => {
  it('calculates correctly for difficulty 1, 0 carry-overs, explorer mode', () => {
    // (1*5 + 0*3) * 0.5 = 2.5, floor = 2
    expect(calculateFailureDamage(1, 0, 'explorer')).toBe(2);
  });

  it('calculates correctly for difficulty 3, 0 carry-overs, drifter mode', () => {
    // (3*5 + 0*3) * 1.0 = 15
    expect(calculateFailureDamage(3, 0, 'drifter')).toBe(15);
  });

  it('calculates correctly for difficulty 5, 0 carry-overs, ironclad mode', () => {
    // (5*5 + 0*3) * 1.5 = 37.5, floor = 37
    expect(calculateFailureDamage(5, 0, 'ironclad')).toBe(37);
  });

  it('increases with carry-over count', () => {
    const d0 = calculateFailureDamage(2, 0, 'drifter');
    const d1 = calculateFailureDamage(2, 1, 'drifter');
    const d3 = calculateFailureDamage(2, 3, 'drifter');
    expect(d1).toBeGreaterThan(d0);
    expect(d3).toBeGreaterThan(d1);
  });

  it('scales with carry-over count correctly for drifter', () => {
    // (2*5 + 2*3) * 1.0 = 16
    expect(calculateFailureDamage(2, 2, 'drifter')).toBe(16);
  });

  it('explorer mode halves damage', () => {
    const explorer = calculateFailureDamage(3, 1, 'explorer');
    const drifter = calculateFailureDamage(3, 1, 'drifter');
    // explorer = floor((15+3)*0.5) = 9
    // drifter = floor((15+3)*1.0) = 18
    expect(explorer).toBe(9);
    expect(drifter).toBe(18);
  });

  it('ironclad mode increases damage by 50%', () => {
    const drifter = calculateFailureDamage(4, 2, 'drifter');
    const ironclad = calculateFailureDamage(4, 2, 'ironclad');
    // drifter: floor((20+6)*1.0) = 26
    // ironclad: floor((20+6)*1.5) = 39
    expect(drifter).toBe(26);
    expect(ironclad).toBe(39);
  });

  it('always returns an integer', () => {
    expect(Number.isInteger(calculateFailureDamage(1, 1, 'explorer'))).toBe(true);
    expect(Number.isInteger(calculateFailureDamage(5, 5, 'ironclad'))).toBe(true);
  });
});

// ─── calculateHollowStrength ─────────────────────────────────────────────────

describe('calculateHollowStrength', () => {
  it('returns 0 when debt is 0', () => {
    expect(calculateHollowStrength(0, 0)).toBe(0);
    expect(calculateHollowStrength(0, 5)).toBe(0);
  });

  it('calculates correctly with 0 consecutive fail days', () => {
    // debt * 10 * (1 + 0 * 0.2) = debt * 10
    expect(calculateHollowStrength(5, 0)).toBe(50);
    expect(calculateHollowStrength(1, 0)).toBe(10);
  });

  it('scales with consecutive fail days', () => {
    // 3 * 10 * (1 + 2 * 0.2) = 30 * 1.4 = 42
    expect(calculateHollowStrength(3, 2)).toBe(42);
  });

  it('increases with more consecutive fail days', () => {
    const s0 = calculateHollowStrength(5, 0);
    const s3 = calculateHollowStrength(5, 3);
    const s10 = calculateHollowStrength(5, 10);
    expect(s3).toBeGreaterThan(s0);
    expect(s10).toBeGreaterThan(s3);
  });

  it('matches the formula: debt * 10 * (1 + consecutiveFailDays * 0.2)', () => {
    const debt = 7;
    const failDays = 4;
    const expected = debt * 10 * (1 + failDays * 0.2);
    expect(calculateHollowStrength(debt, failDays)).toBe(expected);
  });
});

// ─── getHollowStage ──────────────────────────────────────────────────────────

describe('getHollowStage', () => {
  it('returns "dormant" for 0 debt', () => {
    expect(getHollowStage(0)).toBe('dormant');
  });

  it('returns "whispers" for debt 1-3', () => {
    expect(getHollowStage(1)).toBe('whispers');
    expect(getHollowStage(2)).toBe('whispers');
    expect(getHollowStage(3)).toBe('whispers');
  });

  it('returns "presence" for debt 4-6', () => {
    expect(getHollowStage(4)).toBe('presence');
    expect(getHollowStage(5)).toBe('presence');
    expect(getHollowStage(6)).toBe('presence');
  });

  it('returns "confrontation" for debt 7-9', () => {
    expect(getHollowStage(7)).toBe('confrontation');
    expect(getHollowStage(8)).toBe('confrontation');
    expect(getHollowStage(9)).toBe('confrontation');
  });

  it('returns "forced" for debt 10+', () => {
    expect(getHollowStage(10)).toBe('forced');
    expect(getHollowStage(15)).toBe('forced');
    expect(getHollowStage(100)).toBe('forced');
  });

  it('returns "dormant" for negative debt', () => {
    expect(getHollowStage(-1)).toBe('dormant');
  });
});

// ─── calculateBossFightWinChance ─────────────────────────────────────────────

describe('calculateBossFightWinChance', () => {
  it('returns a value between 0.4 and 0.8 (inclusive)', () => {
    const chance = calculateBossFightWinChance(10, 80, 100, 50);
    expect(chance).toBeGreaterThanOrEqual(0.4);
    expect(chance).toBeLessThanOrEqual(0.8);
  });

  it('is clamped to minimum 0.4 even when hollow is very strong', () => {
    const chance = calculateBossFightWinChance(1, 1, 100, 999999);
    expect(chance).toBe(0.4);
  });

  it('is clamped to maximum 0.8 even when agent is very powerful', () => {
    const chance = calculateBossFightWinChance(100, 100, 100, 1);
    expect(chance).toBe(0.8);
  });

  it('higher agent level increases win chance', () => {
    const chanceLow = calculateBossFightWinChance(5, 80, 100, 50);
    const chanceHigh = calculateBossFightWinChance(50, 80, 100, 50);
    expect(chanceHigh).toBeGreaterThan(chanceLow);
  });

  it('higher agent HP increases win chance', () => {
    const chanceLow = calculateBossFightWinChance(10, 20, 100, 50);
    const chanceHigh = calculateBossFightWinChance(10, 90, 100, 50);
    expect(chanceHigh).toBeGreaterThan(chanceLow);
  });

  it('higher hollow strength decreases win chance', () => {
    const chanceLow = calculateBossFightWinChance(10, 80, 100, 200);
    const chanceHigh = calculateBossFightWinChance(10, 80, 100, 20);
    expect(chanceHigh).toBeGreaterThan(chanceLow);
  });

  it('computes the ratio correctly before clamping', () => {
    // agentPower = 10*10 + (80/100)*50 = 100 + 40 = 140
    // hollowStrength = 60
    // ratio = 140 / (140 + 60) = 0.7
    const chance = calculateBossFightWinChance(10, 80, 100, 60);
    expect(chance).toBeCloseTo(0.7, 5);
  });
});

// ─── resolveBossFight ────────────────────────────────────────────────────────

describe('resolveBossFight', () => {
  it('returns an object with won, hpChange, and debtChange', () => {
    const result = resolveBossFight(10, 80, 100, 5, 0);
    expect(result).toHaveProperty('won');
    expect(result).toHaveProperty('hpChange');
    expect(result).toHaveProperty('debtChange');
    expect(typeof result.won).toBe('boolean');
    expect(typeof result.hpChange).toBe('number');
    expect(typeof result.debtChange).toBe('number');
  });

  it('on victory: restores 20% maxHP and halves debt (negative debtChange)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // always wins (0 < any winChance >= 0.4)
    const result = resolveBossFight(10, 80, 100, 6, 0);
    expect(result.won).toBe(true);
    expect(result.hpChange).toBe(Math.floor(100 * 0.2)); // 20
    expect(result.debtChange).toBe(-Math.ceil(6 * 0.5)); // -3
    vi.restoreAllMocks();
  });

  it('on victory: debtChange halves and rounds up (ceil)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = resolveBossFight(10, 80, 100, 5, 0);
    expect(result.won).toBe(true);
    expect(result.debtChange).toBe(-Math.ceil(5 * 0.5)); // -3
    vi.restoreAllMocks();
  });

  it('on defeat: loses 30% of maxHP, no debt change', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99); // always loses
    const result = resolveBossFight(10, 80, 100, 5, 0);
    expect(result.won).toBe(false);
    expect(result.hpChange).toBe(-Math.floor(100 * 0.3)); // -30
    expect(result.debtChange).toBe(0);
    vi.restoreAllMocks();
  });

  it('hp restoration on victory is floor-based', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const result = resolveBossFight(10, 50, 75, 4, 0);
    expect(result.hpChange).toBe(Math.floor(75 * 0.2)); // 15
    vi.restoreAllMocks();
  });

  it('hp loss on defeat is floor-based', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const result = resolveBossFight(10, 50, 75, 4, 0);
    expect(result.hpChange).toBe(-Math.floor(75 * 0.3)); // -22
    vi.restoreAllMocks();
  });

  it('takes hollowStrength into account (stronger hollow = less win chance)', () => {
    // With huge consecutive fail days, hollow is very strong, should lose unless very lucky
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // moderate roll
    const result = resolveBossFight(1, 10, 100, 10, 20);
    // hollowStrength = 10 * 10 * (1 + 20*0.2) = 500
    // agentPower = 1*10 + (10/100)*50 = 15
    // ratio = 15/(15+500) = 0.029... < 0.4, clamped to 0.4
    // 0.5 >= 0.4, so loses
    expect(result.won).toBe(false);
    vi.restoreAllMocks();
  });
});

// ─── shouldStreakHold ─────────────────────────────────────────────────────────

describe('shouldStreakHold', () => {
  it('returns true when total is 0 (no tasks)', () => {
    expect(shouldStreakHold(0, 0)).toBe(true);
  });

  it('returns true when exactly 80% completed (4/5)', () => {
    expect(shouldStreakHold(4, 5)).toBe(true);
  });

  it('returns false when below 80% (3/5 = 60%)', () => {
    expect(shouldStreakHold(3, 5)).toBe(false);
  });

  it('returns true when above 80% (5/5 = 100%)', () => {
    expect(shouldStreakHold(5, 5)).toBe(true);
  });

  it('returns true when 80% on the dot with different numbers (8/10)', () => {
    expect(shouldStreakHold(8, 10)).toBe(true);
  });

  it('returns false when just below 80% (7/10 = 70%)', () => {
    expect(shouldStreakHold(7, 10)).toBe(false);
  });

  it('returns true for 1/1 (100%)', () => {
    expect(shouldStreakHold(1, 1)).toBe(true);
  });

  it('returns false for 0/1 (0%)', () => {
    expect(shouldStreakHold(0, 1)).toBe(false);
  });

  it('handles large numbers', () => {
    expect(shouldStreakHold(80, 100)).toBe(true);
    expect(shouldStreakHold(79, 100)).toBe(false);
  });
});

// ─── decayStreak ─────────────────────────────────────────────────────────────

describe('decayStreak', () => {
  it('explorer mode decays to 50% (floor)', () => {
    expect(decayStreak(10, 'explorer')).toBe(5);
    expect(decayStreak(7, 'explorer')).toBe(3);
  });

  it('drifter mode decays to 75% (floor)', () => {
    expect(decayStreak(10, 'drifter')).toBe(7);
    expect(decayStreak(7, 'drifter')).toBe(5);
  });

  it('ironclad mode decays to 0% (full reset)', () => {
    expect(decayStreak(10, 'ironclad')).toBe(0);
    expect(decayStreak(100, 'ironclad')).toBe(0);
  });

  it('returns 0 when current streak is 0', () => {
    expect(decayStreak(0, 'explorer')).toBe(0);
    expect(decayStreak(0, 'drifter')).toBe(0);
    expect(decayStreak(0, 'ironclad')).toBe(0);
  });

  it('always returns an integer (floors)', () => {
    expect(Number.isInteger(decayStreak(3, 'explorer'))).toBe(true); // 3*0.5 = 1.5 -> 1
    expect(decayStreak(3, 'explorer')).toBe(1);
    expect(Number.isInteger(decayStreak(3, 'drifter'))).toBe(true); // 3*0.75 = 2.25 -> 2
    expect(decayStreak(3, 'drifter')).toBe(2);
  });

  it('returns 1 for streak of 1 in explorer mode', () => {
    expect(decayStreak(1, 'explorer')).toBe(0); // floor(1*0.5) = 0
  });

  it('returns 0 for streak of 1 in drifter mode', () => {
    expect(decayStreak(1, 'drifter')).toBe(0); // floor(1*0.75) = 0
  });
});

// ─── processLevelUp ──────────────────────────────────────────────────────────

describe('processLevelUp', () => {
  it('does not level up when XP is below threshold', () => {
    const result = processLevelUp(1, 40); // need 50 for level 1
    expect(result.newLevel).toBe(1);
    expect(result.remainingXp).toBe(40);
    expect(result.leveledUp).toBe(false);
  });

  it('levels up once when XP is exactly at threshold', () => {
    const result = processLevelUp(1, 50); // exactly 50 for level 1
    expect(result.newLevel).toBe(2);
    expect(result.remainingXp).toBe(0);
    expect(result.leveledUp).toBe(true);
  });

  it('levels up once with remaining XP', () => {
    const result = processLevelUp(1, 70); // need 50 for level 1, 20 left
    expect(result.newLevel).toBe(2);
    expect(result.remainingXp).toBe(20);
    expect(result.leveledUp).toBe(true);
  });

  it('handles multi-level up', () => {
    // level 1 needs 50, level 2 needs 56 => total = 106
    const result = processLevelUp(1, 110);
    expect(result.newLevel).toBe(3);
    expect(result.remainingXp).toBe(110 - 50 - 56); // 4
    expect(result.leveledUp).toBe(true);
  });

  it('caps at level 100 (MAX_LEVEL)', () => {
    // xpForLevel(99) is ~3.3M, so we need enough XP to surpass it
    const result = processLevelUp(99, 99999999);
    expect(result.newLevel).toBe(100);
    expect(result.leveledUp).toBe(true);
  });

  it('does not exceed level 100 even with enormous XP', () => {
    const result = processLevelUp(98, 9999999);
    expect(result.newLevel).toBe(100);
    expect(result.leveledUp).toBe(true);
  });

  it('returns remaining XP after reaching level 100', () => {
    const xpFor99 = xpForLevel(99);
    const result = processLevelUp(99, xpFor99 + 100);
    expect(result.newLevel).toBe(100);
    // remaining = (xpFor99 + 100) - xpFor99 = 100
    expect(result.remainingXp).toBe(100);
    expect(result.leveledUp).toBe(true);
  });

  it('does nothing when already at max level', () => {
    const result = processLevelUp(100, 999999);
    expect(result.newLevel).toBe(100);
    expect(result.remainingXp).toBe(999999);
    expect(result.leveledUp).toBe(false);
  });

  it('returns the correct shape', () => {
    const result = processLevelUp(5, 100);
    expect(result).toHaveProperty('newLevel');
    expect(result).toHaveProperty('remainingXp');
    expect(result).toHaveProperty('leveledUp');
    expect(typeof result.newLevel).toBe('number');
    expect(typeof result.remainingXp).toBe('number');
    expect(typeof result.leveledUp).toBe('boolean');
  });

  it('handles level 0 XP correctly (no level up at level 50)', () => {
    const result = processLevelUp(50, 0);
    expect(result.newLevel).toBe(50);
    expect(result.remainingXp).toBe(0);
    expect(result.leveledUp).toBe(false);
  });

  it('remaining XP is always non-negative', () => {
    for (let level = 1; level < 100; level += 10) {
      const result = processLevelUp(level, xpForLevel(level));
      expect(result.remainingXp).toBeGreaterThanOrEqual(0);
    }
  });
});
