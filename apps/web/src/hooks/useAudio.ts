import { useEffect } from 'react';
import { audioManager } from '../services/audioManager';
import { useAudioStore } from '../stores/audioStore';

/**
 * Start ambient sound on mount, update volumes on change.
 */
export function useAudio() {
  const isMuted = useAudioStore((s) => s.isMuted);
  const masterVolume = useAudioStore((s) => s.masterVolume);
  const musicVolume = useAudioStore((s) => s.musicVolume);
  const sfxVolume = useAudioStore((s) => s.sfxVolume);

  // Start ambient on first user interaction
  useEffect(() => {
    const startAudio = () => {
      audioManager.playAmbient();
      document.removeEventListener('click', startAudio);
      document.removeEventListener('keydown', startAudio);
    };
    document.addEventListener('click', startAudio);
    document.addEventListener('keydown', startAudio);
    return () => {
      document.removeEventListener('click', startAudio);
      document.removeEventListener('keydown', startAudio);
    };
  }, []);

  // Sync mute state
  useEffect(() => {
    audioManager.setMuted(isMuted);
  }, [isMuted]);

  // Sync volumes
  useEffect(() => {
    audioManager.updateVolumes();
  }, [masterVolume, musicVolume, sfxVolume, isMuted]);
}
