import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isDefault: boolean | number;
  sortOrder: number;
  is_default?: number;
  sort_order?: number;
}

// Normalize DB snake_case to camelCase
function normalizeCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    color: c.color,
    isDefault: c.isDefault ?? c.is_default ?? false,
    sortOrder: c.sortOrder ?? c.sort_order ?? 0,
  };
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await api.get<{ categories: any[] }>('/api/categories');
      return data.categories.map(normalizeCategory);
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; emoji?: string; color?: string }) =>
      api.post<{ category: Category }>('/api/categories', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.del<void>(`/api/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}
