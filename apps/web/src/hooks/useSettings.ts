import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface UserSettings {
  username: string;
  difficultyMode: string;
  hasApiKey: boolean;
}

interface UpdateSettingsInput {
  username?: string;
  difficultyMode?: string;
  openrouterApiKey?: string;
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const data = await api.get<{ settings: UserSettings }>('/api/settings');
      return data.settings;
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSettingsInput) =>
      api.put<{ settings: UserSettings }>('/api/settings', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
