import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  category: 'discipline' | 'courage' | 'wisdom' | 'luck';
  maxLevel: number;
  baseCost: number;
  costPerLevel: number;
  levelRequired: number;
  prerequisiteSkillId: string | null;
  effect: string;
}

export interface AgentSkill {
  skillId: string;
  level: number;
  purchasedAt: string;
}

interface SkillsResponse {
  skills: SkillDef[];
  mySkills: AgentSkill[];
}

interface PurchaseSkillInput {
  skillId: string;
}

interface PurchaseSkillResponse {
  skill: AgentSkill;
  xpSpent: number;
  newLevel: number;
}

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const data = await api.get<SkillsResponse>('/api/skills');
      return data;
    },
  });
}

export function usePurchaseSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PurchaseSkillInput) =>
      api.post<PurchaseSkillResponse>('/api/skills/purchase', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}
