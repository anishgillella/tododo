import { describe, it, expect, beforeEach } from 'vitest';
import { useMissionStore } from './missionStore';

describe('missionStore', () => {
  beforeEach(() => {
    useMissionStore.setState({ lastCompletion: null });
  });

  it('starts with null lastCompletion', () => {
    const state = useMissionStore.getState();
    expect(state.lastCompletion).toBeNull();
  });

  it('sets lastCompletion', () => {
    const data = {
      missionId: 'test-1',
      xpGained: 45,
      goldGained: 17,
      wasCrit: false,
      comboBonus: 0,
      leveledUp: false,
    };
    useMissionStore.getState().setLastCompletion(data);
    expect(useMissionStore.getState().lastCompletion).toEqual(data);
  });

  it('clears lastCompletion', () => {
    useMissionStore.getState().setLastCompletion({
      missionId: 'test-1',
      xpGained: 45,
      goldGained: 17,
      wasCrit: true,
      comboBonus: 5,
      leveledUp: true,
      newLevel: 2,
    });
    useMissionStore.getState().clearLastCompletion();
    expect(useMissionStore.getState().lastCompletion).toBeNull();
  });

  it('stores crit and level up data', () => {
    const data = {
      missionId: 'test-2',
      xpGained: 90,
      goldGained: 30,
      wasCrit: true,
      comboBonus: 15,
      leveledUp: true,
      newLevel: 3,
    };
    useMissionStore.getState().setLastCompletion(data);
    const stored = useMissionStore.getState().lastCompletion;
    expect(stored?.wasCrit).toBe(true);
    expect(stored?.leveledUp).toBe(true);
    expect(stored?.newLevel).toBe(3);
    expect(stored?.comboBonus).toBe(15);
  });
});
