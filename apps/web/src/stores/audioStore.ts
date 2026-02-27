import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioStore {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  setMasterVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  toggleMute: () => void;
}

export const useAudioStore = create<AudioStore>()(
  persist(
    (set) => ({
      masterVolume: 0.7,
      musicVolume: 0.5,
      sfxVolume: 0.8,
      isMuted: false,
      setMasterVolume: (v) => set({ masterVolume: v }),
      setMusicVolume: (v) => set({ musicVolume: v }),
      setSfxVolume: (v) => set({ sfxVolume: v }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
    }),
    { name: 'tododo-audio' },
  ),
);
