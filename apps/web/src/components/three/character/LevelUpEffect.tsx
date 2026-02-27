import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Html } from '@react-three/drei';
import type { PointLight, Group } from 'three';
import { useMissionStore } from '../../../stores/missionStore';
import { usePlayerStore } from '../../../stores/playerStore';

export function LevelUpEffect() {
  const lightRef = useRef<PointLight>(null);
  const ringRef = useRef<Group>(null);
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'burst' | 'glow' | 'fade'>('burst');
  const lastCompletion = useMissionStore((s) => s.lastCompletion);
  const playerPosition = usePlayerStore((s) => s.position);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (lastCompletion?.leveledUp) {
      setActive(true);
      setPhase('burst');
      setElapsed(0);
      const glowTimer = setTimeout(() => setPhase('glow'), 800);
      const fadeTimer = setTimeout(() => setPhase('fade'), 2500);
      const endTimer = setTimeout(() => setActive(false), 4000);
      return () => {
        clearTimeout(glowTimer);
        clearTimeout(fadeTimer);
        clearTimeout(endTimer);
      };
    }
  }, [lastCompletion]);

  useFrame((_state, delta) => {
    if (!active) return;
    setElapsed((prev) => prev + delta);

    // Pulse the light
    if (lightRef.current) {
      if (phase === 'burst') {
        lightRef.current.intensity = 12;
      } else if (phase === 'glow') {
        lightRef.current.intensity = 6 + Math.sin(elapsed * 8) * 3;
      } else {
        lightRef.current.intensity = Math.max(0, lightRef.current.intensity - delta * 4);
      }
    }

    // Spin the ring
    if (ringRef.current) {
      ringRef.current.rotation.y += delta * 2;
      if (phase === 'fade') {
        ringRef.current.scale.setScalar(Math.max(0, ringRef.current.scale.x - delta));
      }
    }
  });

  if (!active) return null;

  return (
    <group position={[playerPosition[0], 1, playerPosition[2]]}>
      {/* Inner golden burst */}
      <Sparkles
        count={60}
        scale={[4, 6, 4]}
        size={5}
        speed={4}
        opacity={0.9}
        color="#fbbf24"
      />

      {/* Outer arcane ring */}
      <Sparkles
        count={30}
        scale={[6, 2, 6]}
        size={3}
        speed={2}
        opacity={0.7}
        color="#a78bfa"
      />

      {/* Rising pillar */}
      <Sparkles
        count={20}
        scale={[1.5, 10, 1.5]}
        size={3}
        speed={6}
        opacity={0.6}
        color="#fef3c7"
      />

      {/* Spinning ring of light */}
      <group ref={ringRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.5, 0.05, 8, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={phase === 'fade' ? 0.3 : 0.8} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.5, 0.03, 8, 32]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={phase === 'fade' ? 0.2 : 0.5} />
        </mesh>
      </group>

      {/* Flash light */}
      <pointLight
        ref={lightRef}
        color="#fbbf24"
        intensity={12}
        distance={15}
      />

      {/* Floating "LEVEL UP!" text */}
      <Html
        position={[0, 3 + elapsed * 0.5, 0]}
        center
        distanceFactor={10}
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex flex-col items-center gap-1 animate-in fade-in duration-300">
          <span className="font-display text-lg font-bold text-spark drop-shadow-lg tracking-widest uppercase">
            Level Up!
          </span>
          {lastCompletion && (
            <span className="font-mono text-xs text-arcane-light drop-shadow-lg">
              Level {(lastCompletion as Record<string, unknown>).newLevel ?? '??'}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}
