import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'equipment' | 'cosmetic';
  price: number;
  levelRequired: number;
  effect: string;
  duration: number | null;
  stackable: boolean;
  maxStack: number;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  name: string;
  description: string;
  type: 'consumable' | 'equipment' | 'cosmetic';
  quantity: number;
  equipped: boolean;
  effect: string;
}

interface InventoryResponse {
  items: InventoryItem[];
}

interface CatalogResponse {
  items: ItemDef[];
}

interface BuyItemInput {
  itemId: string;
  quantity?: number;
}

interface BuyItemResponse {
  item: InventoryItem;
  goldSpent: number;
}

interface UseItemInput {
  inventoryItemId: string;
}

interface UseItemResponse {
  message: string;
  effect: string;
}

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const data = await api.get<InventoryResponse>('/api/inventory');
      return data;
    },
  });
}

export function useItemCatalog() {
  return useQuery({
    queryKey: ['itemCatalog'],
    queryFn: async () => {
      const data = await api.get<CatalogResponse>('/api/inventory/catalog');
      return data;
    },
  });
}

export function useBuyItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BuyItemInput) =>
      api.post<BuyItemResponse>('/api/inventory/buy', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

export function useUseItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UseItemInput) =>
      api.post<UseItemResponse>('/api/inventory/use', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}
