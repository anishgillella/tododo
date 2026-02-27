import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Html } from '@react-three/drei';
import type { PointLight } from 'three';
import { useMissionStore } from '../../../stores/missionStore';
import { usePlayerStore } from '../../../stores/playerStore';

export function MissionCompleteEffect() {
  const lightRef = useRef<PointLight>(null);
  const [active, setActive] = useState(false);
  const lastCompletion = useMissionStore((s) => s.lastCompletion);
  const playerPosition = usePlayerStore((s) => s.position);
  const [floatY, setFloatY] = useState(0);

  useEffect(() => {
    if (lastCompletion) {
      setActive(true);
      setFloatY(0);
      const timer = setTimeout(() => setActive(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastCompletion]);

  useFrame((_state, delta) => {
    if (!lightRef.current) return;
    if (active) {
      lightRef.current.intensity = Math.max(0, lightRef.current.intensity - delta * 3);
      setFloatY((prev) => Math.min(prev + delta * 2, 3));
    }
  });

  if (!active || !lastCompletion) return null;

  const isCrit = lastCompletion.wasCrit;
  const color = isCrit ? '#fbbf24' : '#a78bfa';

  return (
    <group position={[playerPosition[0], 2, playerPosition[2]]}>
      {/* XP orbs flying upward */}
      <Sparkles
        count={isCrit ? 30 : 15}
        scale={[2, 4, 2]}
        size={isCrit ? 4 : 2.5}
        speed={3}
        opacity={0.9}
        color={color}
      />
      <pointLight ref={lightRef} color={color} intensity={5} distance={8} />

      {/* Floating "+XP" and "+Gold" text */}
      <Html
        position={[0, floatY, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex flex-col items-center gap-0.5 animate-in fade-in duration-200">
          <span className="font-mono text-sm font-bold text-arcane-light drop-shadow-lg">
            +{lastCompletion.xpGained} XP
          </span>
          {lastCompletion.goldGained > 0 && (
            <span className="font-mono text-xs font-bold text-ember drop-shadow-lg">
              +{lastCompletion.goldGained} Gold
            </span>
          )}
          {isCrit && (
            <span className="font-mono text-xs font-bold text-spark drop-shadow-lg">
              CRITICAL!
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}
