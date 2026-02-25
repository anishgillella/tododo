import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  status: string;
  xpReward: number;
  goldReward: number;
  narrativeFlavor: string | null;
  carryOverCount: number;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface CompleteMissionResponse {
  mission: Mission;
  xpGained: number;
  goldGained: number;
  wasCrit: boolean;
  comboBonus: number;
  leveledUp: boolean;
  newLevel?: number;
}

interface CreateMissionInput {
  title: string;
  description?: string;
  difficulty?: number;
}

interface UpdateMissionInput {
  id: string;
  [key: string]: unknown;
}

export function useMissions() {
  return useQuery({
    queryKey: ['missions'],
    queryFn: async () => {
      const data = await api.get<{ missions: Mission[] }>('/api/missions');
      return data.missions;
    },
  });
}

export function useCreateMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMissionInput) =>
      api.post<{ mission: Mission }>('/api/missions', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}

export function useCompleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<CompleteMissionResponse>(`/api/missions/${id}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

export function useDeleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/api/missions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}

export function useUpdateMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: UpdateMissionInput) =>
      api.put<{ mission: Mission }>(`/api/missions/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}
