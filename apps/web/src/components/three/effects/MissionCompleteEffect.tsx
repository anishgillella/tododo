import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { PointLight } from 'three';
import { useMissionStore } from '../../../stores/missionStore';

export function MissionCompleteEffect() {
  const lightRef = useRef<PointLight>(null);
  const [active, setActive] = useState(false);
  const lastCompletion = useMissionStore((s) => s.lastCompletion);

  useEffect(() => {
    if (lastCompletion) {
      setActive(true);
      const timer = setTimeout(() => setActive(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastCompletion]);

  useFrame((_state, delta) => {
    if (!lightRef.current) return;
    if (active) {
      lightRef.current.intensity = Math.max(0, lightRef.current.intensity - delta * 3);
    }
  });

  if (!active || !lastCompletion) return null;

  const isCrit = lastCompletion.wasCrit;
  const color = isCrit ? '#fbbf24' : '#a78bfa';

  return (
    <group position={[0, 2, 3]}>
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
    </group>
  );
}
