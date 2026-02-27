import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Habit {
  id: string;
  title: string;
  description: string | null;
  difficulty: number;
  categoryId: string | null;
  habitStreak: number;
  lastHabitCompletion: string | null;
  createdAt: string;
  todayInstanceId: string | null;
  completedToday: boolean;
}

interface CreateHabitInput {
  title: string;
  difficulty?: number;
  description?: string;
  categoryId?: string;
}

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const data = await api.get<{ habits: Habit[] }>('/api/habits');
      return data.habits;
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateHabitInput) =>
      api.post<{ habit: Habit }>('/api/habits', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useCompleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (habitTemplateId: string) =>
      api.post<{ habitStreak: number; xpGained: number; goldGained: number }>(
        `/api/habits/${habitTemplateId}/complete`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/api/habits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
