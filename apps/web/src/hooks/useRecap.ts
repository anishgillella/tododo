import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface RecapEntry {
  id: string;
  date: string;
  missionsCompleted: number;
  missionsFailed: number;
  xpEarned: number;
  goldEarned: number;
  hpChange: number;
  narrative: string;
  axiomCommentary: string;
  kaelReaction: string;
  createdAt: string;
}

export interface EndOfDayReport {
  date: string;
  missionsCompleted: number;
  missionsFailed: number;
  consequences: {
    hpDamage: number;
    debtChange: number;
    streakResult: {
      held: boolean;
      newDays: number;
      newTier: string;
      shieldUsed: boolean;
    };
    hollowStageChange?: { from: string; to: string };
    events: string[];
  };
  narrative?: string;
  axiomCommentary?: string;
  kaelReaction?: string;
  agentSnapshot: {
    level: number;
    xp: number;
    hp: number;
    maxHp: number;
    gold: number;
    streakDays: number;
    streakTier: string;
    debt: number;
  };
}

export function useRecaps() {
  return useQuery({
    queryKey: ['recaps'],
    queryFn: async () => {
      const data = await api.get<{ recaps: RecapEntry[] }>('/api/game/recaps');
      return data.recaps;
    },
  });
}

export function useTriggerEndOfDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<EndOfDayReport>('/api/game/end-of-day'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recaps'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
    },
  });
}
