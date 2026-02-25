import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Agent } from './useAgent';
import type { Mission } from './useMissions';

export interface GameStateResponse {
  agent: Agent;
  activeMissions: Mission[];
  hollowStage: string;
  isJackpotDay: boolean;
  dailyStats: {
    completed: number;
    failed: number;
    total: number;
  };
}

export function useGameState() {
  return useQuery({
    queryKey: ['gameState'],
    queryFn: async () => {
      const data = await api.get<GameStateResponse>('/api/game/state');
      return data;
    },
  });
}
