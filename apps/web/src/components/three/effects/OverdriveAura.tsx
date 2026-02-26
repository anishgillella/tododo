import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { PointLight } from 'three';
import { useAgent } from '../../../hooks/useAgent';

export function OverdriveAura() {
  const lightRef = useRef<PointLight>(null);
  const { data: agent } = useAgent();

  // Check if overdrive is active (overdriveUntil is in useGameState but we check via agent)
  // For simplicity we check if combo > 5 as a proxy for overdrive state
  const isOverdrive = (agent?.comboCount ?? 0) >= 5;

  useFrame((state) => {
    if (!lightRef.current || !isOverdrive) return;
    lightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 4) * 0.8;
  });

  if (!isOverdrive) return null;

  return (
    <group position={[0, 0, 3]}>
      {/* Golden aura sparkles */}
      <Sparkles
        count={50}
        scale={[3, 5, 3]}
        size={3}
        speed={2}
        opacity={0.7}
        color="#fbbf24"
      />
      {/* Secondary purple particles */}
      <Sparkles
        count={25}
        scale={[2, 4, 2]}
        size={2}
        speed={1.5}
        opacity={0.5}
        color="#a855f7"
      />
      {/* Golden light */}
      <pointLight
        ref={lightRef}
        color="#fbbf24"
        intensity={2}
        distance={6}
        position={[0, 1.5, 0]}
      />
    </group>
  );
}
