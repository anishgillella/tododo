import { lazy, Suspense } from 'react';
import { PageOverlay } from './PageOverlay';
import { useVillageStore } from '../../stores/villageStore';
import { useCombatStore } from '../../stores/combatStore';
import { useRealWeather } from '../../hooks/useRealWeather';
import { useAudio } from '../../hooks/useAudio';
import { useNpcBubbles } from '../../hooks/useNpcBubbles';
import { useGameBridge } from '../../hooks/useGameBridge';
import { HowToPlayModal } from '../ui/HowToPlayModal';
import { VillageHud } from '../game/VillageHud';
import CombatHUD from '../combat/CombatHUD';

const GameCanvas = lazy(() =>
  import('../game/GameCanvas').then((m) => ({ default: m.GameCanvas }))
);

export function WorldLayout() {
  const combatActive = useVillageStore((s) => s.combatActive);
  const showHowToPlay = useVillageStore((s) => s.showHowToPlay);
  const activeSession = useCombatStore((s) => s.activeSession);

  // Initialize systems
  useRealWeather();
  useAudio();
  useNpcBubbles();
  useGameBridge();

  const showBattleHud = combatActive || !!activeSession;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
      {/* 2D Phaser Canvas */}
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <div className="font-display text-sm tracking-wider text-arcane-light animate-pulse">
              Entering Drifthollow...
            </div>
          </div>
        }
      >
        <GameCanvas />
      </Suspense>

      {/* Combat HUD overlay */}
      {showBattleHud && <CombatHUD />}

      {/* Fixed screen HUD */}
      <VillageHud />

      {/* Overlay system */}
      <PageOverlay />

      {/* How to Play modal */}
      {showHowToPlay && <HowToPlayModal />}
    </div>
  );
}
