import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useCombatStore } from '../stores/combatStore';

interface StartCombatInput {
  type: 'encounter' | 'boss';
  creatureId?: string;
}

interface CombatActionInput {
  sessionId: string;
  action: {
    type: 'attack' | 'ability' | 'defend' | 'item' | 'flee';
    abilityId?: string;
    itemId?: string;
  };
}

interface FleeInput {
  sessionId: string;
}

interface ResolveInput {
  sessionId: string;
}

interface ResolveResult {
  xpGained: number;
  goldGained: number;
  lootDrops: string[];
  bestiaryUpdated: boolean;
}

export function useStartCombat() {
  const { startCombat } = useCombatStore();

  return useMutation({
    mutationFn: (input: StartCombatInput) =>
      api.post<Record<string, unknown>>('/api/game/combat/start', input),
    onSuccess: (data, variables) => {
      startCombat(data as any, variables.type);
    },
  });
}

export function useCombatAction() {
  const { updateState } = useCombatStore();

  return useMutation({
    mutationFn: (input: CombatActionInput) =>
      api.post<Record<string, unknown>>('/api/game/combat/action', input),
    onSuccess: (data) => {
      updateState(data as any);
    },
  });
}

export function useFleeCombat() {
  const { updateState } = useCombatStore();

  return useMutation({
    mutationFn: (input: FleeInput) =>
      api.post<Record<string, unknown>>('/api/game/combat/flee', input),
    onSuccess: (data) => {
      updateState(data as any);
    },
  });
}

export function useResolveCombat() {
  const queryClient = useQueryClient();
  const { endCombat } = useCombatStore();

  return useMutation({
    mutationFn: (input: ResolveInput) =>
      api.post<ResolveResult>('/api/game/combat/resolve', input),
    onSuccess: () => {
      endCombat();
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
    },
  });
}
