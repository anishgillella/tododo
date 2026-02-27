import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import { useVillageStore } from '../stores/villageStore';
import { audioManager } from '../services/audioManager';

/**
 * Fade building sounds based on proximity and active overlay.
 */
export function useProximityAudio() {
  const activeOverlay = useVillageStore((s) => s.activeOverlay);
  const prevOverlay = useRef(activeOverlay);

  useEffect(() => {
    if (activeOverlay && activeOverlay !== prevOverlay.current) {
      // Entering a building — start its sound
      audioManager.playBuildingSound(activeOverlay);
    } else if (!activeOverlay && prevOverlay.current) {
      // Left a building — stop its sound
      audioManager.stopBuildingSound();
    }
    prevOverlay.current = activeOverlay;
  }, [activeOverlay]);
}
