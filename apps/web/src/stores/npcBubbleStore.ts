import { create } from 'zustand';

interface NpcBubbleStore {
  bubbles: Record<string, string>;
  setBubble: (character: string, text: string) => void;
  setBubbles: (bubbles: Record<string, string>) => void;
}

export const useNpcBubbleStore = create<NpcBubbleStore>((set) => ({
  bubbles: {},
  setBubble: (character, text) =>
    set((state) => ({ bubbles: { ...state.bubbles, [character]: text } })),
  setBubbles: (bubbles) => set({ bubbles }),
}));
