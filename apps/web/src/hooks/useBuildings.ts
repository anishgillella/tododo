import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface BuildingUpgrade {
  tier: number;
  name: string;
  cost: number;
  description: string;
}

interface BuildingInfo {
  id: string;
  currentTier: number;
  nextUpgrade: BuildingUpgrade | null;
  maxTier: number;
}

interface BuildingsResponse {
  buildings: BuildingInfo[];
  gold: number;
}

export function useBuildings() {
  return useQuery({
    queryKey: ['buildings'],
    queryFn: () => api.get<BuildingsResponse>('/api/buildings'),
  });
}

export function useUpgradeBuilding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (buildingId: string) =>
      api.post<{ success: boolean; newTier: number; tierName: string; goldSpent: number }>(
        `/api/buildings/${buildingId}/upgrade`,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buildings'] });
      qc.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}
