import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { PointLight } from 'three';
import { useMissionStore } from '../../../stores/missionStore';

export function LevelUpEffect() {
  const lightRef = useRef<PointLight>(null);
  const [active, setActive] = useState(false);
  const lastCompletion = useMissionStore((s) => s.lastCompletion);

  useEffect(() => {
    if (lastCompletion?.leveledUp) {
      setActive(true);
      const timer = setTimeout(() => setActive(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastCompletion]);

  useFrame((_state, delta) => {
    if (!lightRef.current || !active) return;
    // Pulse the light then fade out
    lightRef.current.intensity = Math.max(0, lightRef.current.intensity - delta * 2);
  });

  if (!active) return null;

  return (
    <group position={[0, 1.5, 3]}>
      {/* Burst of sparkles */}
      <Sparkles
        count={40}
        scale={[3, 4, 3]}
        size={4}
        speed={2}
        opacity={0.8}
        color="#fbbf24"
      />
      {/* Flash light */}
      <pointLight
        ref={lightRef}
        color="#fbbf24"
        intensity={8}
        distance={10}
      />
    </group>
  );
}
