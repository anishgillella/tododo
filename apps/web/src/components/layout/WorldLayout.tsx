import { lazy, Suspense, useCallback } from 'react';
import { PageOverlay } from './PageOverlay';
import { useVillageStore } from '../../stores/villageStore';
import type { BossFightResult } from '../../hooks/useBossFight';

const VillageCanvas = lazy(() =>
  import('../three/VillageCanvas').then((m) => ({ default: m.VillageCanvas }))
);

const BattleArena = lazy(() =>
  import('../three/combat/BattleArena').then((m) => ({ default: m.BattleArena }))
);

export function WorldLayout() {
  const combatActive = useVillageStore((s) => s.combatActive);
  const setCombatActive = useVillageStore((s) => s.setCombatActive);

  const handleBattleComplete = useCallback((_result: BossFightResult) => {
    setCombatActive(false);
  }, [setCombatActive]);

  const handleBattleCancel = useCallback(() => {
    setCombatActive(false);
  }, [setCombatActive]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
      {/* 3D Canvas — always rendered behind */}
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center">
            <div className="font-display text-sm tracking-wider text-arcane-light animate-pulse">
              Entering Drifthollow...
            </div>
          </div>
        }
      >
        <VillageCanvas />
      </Suspense>

      {/* 3D Battle Arena — overlays canvas when combat is active */}
      {combatActive && (
        <Suspense
          fallback={
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-void">
              <div className="font-display text-sm tracking-wider text-rift-light animate-pulse">
                Entering the Rift...
              </div>
            </div>
          }
        >
          <BattleArena onComplete={handleBattleComplete} onCancel={handleBattleCancel} />
        </Suspense>
      )}

      {/* Overlay system — slides up over canvas */}
      <PageOverlay />
    </div>
  );
}
