import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface HollowStatus {
  debt: number;
  stage: 'dormant' | 'whispers' | 'presence' | 'confrontation' | 'forced';
  strength: number;
  canFight: boolean;
  winChance: number;
}

export interface BossFightResult {
  victory: boolean;
  narrative: string;
  debtBefore: number;
  debtAfter: number;
  hpChange: number;
  xpReward: number;
  goldReward: number;
  specialDrop: string | null;
}

export function useHollowStatus() {
  return useQuery({
    queryKey: ['hollow-status'],
    queryFn: async () => {
      const data = await api.get<HollowStatus>('/api/game/hollow-status');
      return data;
    },
  });
}

export function useBossFight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      api.post<BossFightResult>('/api/game/boss-fight'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
      queryClient.invalidateQueries({ queryKey: ['hollow-status'] });
    },
  });
}
