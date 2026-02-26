import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface DialogueMessage {
  id: string;
  character: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface SendMessageInput {
  character: string;
  message: string;
}

interface SendMessageResponse {
  character: string;
  response: string;
}

export function useDialogueHistory(character: string) {
  return useQuery({
    queryKey: ['dialogue', character],
    queryFn: async () => {
      const data = await api.get<{ messages: DialogueMessage[] }>(
        `/api/dialogue/history?character=${encodeURIComponent(character)}&limit=50`,
      );
      return data.messages ?? [];
    },
    enabled: !!character,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      api.post<SendMessageResponse>('/api/dialogue', input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dialogue', variables.character] });
    },
  });
}
