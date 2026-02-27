import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useNpcBubbleStore } from '../stores/npcBubbleStore';

const POLL_INTERVAL = 30 * 60 * 1000; // 30 min

export function useNpcBubbles() {
  const setBubbles = useNpcBubbleStore((s) => s.setBubbles);

  const { data } = useQuery({
    queryKey: ['npc-bubbles'],
    queryFn: () => api.get<{ bubbles: Record<string, string> }>('/api/npc-bubbles'),
    refetchInterval: POLL_INTERVAL,
    staleTime: POLL_INTERVAL,
  });

  useEffect(() => {
    if (data?.bubbles) {
      setBubbles(data.bubbles);
    }
  }, [data, setBubbles]);
}
