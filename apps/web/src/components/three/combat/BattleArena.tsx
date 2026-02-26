import { Suspense, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { BattleCamera } from './BattleCamera';
import { HollowBoss } from './HollowBoss';
import { CombatEffects } from './CombatEffects';
import { BattlePlayerModel } from './BattlePlayerModel';
import { useHollowStatus, useBossFight } from '../../../hooks/useBossFight';
import type { BossFightResult } from '../../../hooks/useBossFight';

interface BattleArenaProps {
  onComplete: (result: BossFightResult) => void;
  onCancel: () => void;
}

type BattlePhase = 'intro' | 'fighting' | 'result';

export function BattleArena({ onComplete, onCancel }: BattleArenaProps) {
  const { data: hollow } = useHollowStatus();
  const bossFight = useBossFight();
  const [phase, setPhase] = useState<BattlePhase>('intro');
  const [result, setResult] = useState<BossFightResult | null>(null);
  const debt = hollow?.debt ?? 1;

  // Start fight after intro
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('fighting');
      bossFight.mutate(undefined, {
        onSuccess: (res) => {
          setResult(res);
          setTimeout(() => setPhase('result'), 2000);
        },
        onError: () => {
          onCancel();
        },
      });
    }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReturn = useCallback(() => {
    if (result) onComplete(result);
  }, [result, onComplete]);

  return (
    <div className="absolute inset-0 z-40">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 4, 10], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#050008']} />
        <fog attach="fog" args={['#050008', 15, 30]} />

        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.15} />
          <directionalLight position={[5, 8, 5]} intensity={0.5} color="#a78bfa" castShadow />

          {/* Arena floor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <circleGeometry args={[12, 32]} />
            <meshStandardMaterial color="#0a0510" roughness={0.9} />
          </mesh>

          {/* Player */}
          <BattlePlayerModel phase={phase} />

          {/* Boss */}
          <HollowBoss
            debt={debt}
            phase={phase}
            defeated={result?.victory}
          />

          {/* Combat effects */}
          <CombatEffects phase={phase} victory={result?.victory} />

          {/* Camera */}
          <BattleCamera phase={phase} victory={result?.victory} />
        </Suspense>

        {/* Result overlay */}
        {phase === 'result' && result && (
          <Html fullscreen>
            <div className="flex h-full items-center justify-center">
              <div className="rounded-2xl border border-steel bg-void/95 p-6 text-center backdrop-blur-md max-w-sm mx-4">
                <div className="mb-3 text-4xl">
                  {result.victory ? '\u2694\uFE0F' : '\uD83D\uDC80'}
                </div>
                <h2 className={`font-display text-xl font-bold tracking-widest uppercase mb-2 ${
                  result.victory ? 'text-verdant-light' : 'text-rift-light'
                }`}>
                  {result.victory ? 'VICTORY' : 'DEFEAT'}
                </h2>
                <p className="text-sm text-bone mb-4 leading-relaxed">{result.narrative}</p>

                <div className="grid grid-cols-2 gap-2 mb-4 text-left">
                  <div className="rounded-lg bg-void-lighter p-2">
                    <div className="font-mono text-[10px] text-ash uppercase">Debt</div>
                    <div className="font-mono text-sm">
                      <span className="text-rift-light">{result.debtBefore}</span>
                      <span className="mx-1 text-steel-light">{'\u2192'}</span>
                      <span className={result.debtAfter < result.debtBefore ? 'text-verdant-light' : 'text-rift-light'}>
                        {result.debtAfter}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-void-lighter p-2">
                    <div className="font-mono text-[10px] text-ash uppercase">HP</div>
                    <div className={`font-mono text-sm ${result.hpChange >= 0 ? 'text-verdant-light' : 'text-rift-light'}`}>
                      {result.hpChange > 0 ? '+' : ''}{result.hpChange}
                    </div>
                  </div>
                  {result.xpReward > 0 && (
                    <div className="rounded-lg bg-void-lighter p-2">
                      <div className="font-mono text-[10px] text-ash uppercase">XP</div>
                      <div className="font-mono text-sm text-arcane-light">+{result.xpReward}</div>
                    </div>
                  )}
                  {result.goldReward > 0 && (
                    <div className="rounded-lg bg-void-lighter p-2">
                      <div className="font-mono text-[10px] text-ash uppercase">Gold</div>
                      <div className="font-mono text-sm text-ember-light">+{result.goldReward}</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleReturn}
                  className="w-full rounded-lg border border-steel bg-void-lighter px-4 py-2.5 font-display text-xs tracking-wider text-parchment uppercase transition-colors hover:border-arcane hover:bg-arcane/10"
                >
                  Return to Village
                </button>
              </div>
            </div>
          </Html>
        )}
      </Canvas>
    </div>
  );
}
