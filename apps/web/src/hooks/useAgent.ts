import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Agent {
  id: string;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  energy: number;
  maxEnergy: number;
  gold: number;
  streakDays: number;
  streakTier: string;
  streakShields: number;
  debt: number;
  comboCount: number;
  discipline: number;
  courage: number;
  wisdom: number;
  charisma: number;
}

export function useAgent() {
  return useQuery({
    queryKey: ['agent'],
    queryFn: async () => {
      const data = await api.get<{ agent: Agent }>('/api/agent');
      return data.agent;
    },
  });
}
