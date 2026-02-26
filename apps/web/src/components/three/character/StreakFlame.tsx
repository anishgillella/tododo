import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { PointLight } from 'three';

const STREAK_CONFIG: Record<string, { color: string; size: number; count: number; intensity: number }> = {
  spark:        { color: '#fbbf24', size: 2,  count: 8,   intensity: 0.5  },
  flame:        { color: '#f97316', size: 3,  count: 15,  intensity: 1.0  },
  blaze:        { color: '#ef4444', size: 4,  count: 25,  intensity: 2.0  },
  inferno:      { color: '#dc2626', size: 5,  count: 40,  intensity: 3.5  },
  eternal_fire: { color: '#a855f7', size: 6,  count: 60,  intensity: 5.0  },
};

interface StreakFlameProps {
  tier: string;
}

export function StreakFlame({ tier }: StreakFlameProps) {
  const lightRef = useRef<PointLight>(null);
  const config = STREAK_CONFIG[tier];

  useFrame((state) => {
    if (!lightRef.current || !config) return;
    // Flickering light
    lightRef.current.intensity =
      config.intensity + Math.sin(state.clock.elapsedTime * 8) * config.intensity * 0.3;
  });

  if (!config) return null;

  return (
    <group position={[0, 0.5, 0]}>
      <Sparkles
        count={config.count}
        scale={[1.5, 3, 1.5]}
        size={config.size}
        speed={1.5}
        opacity={0.7}
        color={config.color}
      />
      <pointLight
        ref={lightRef}
        color={config.color}
        intensity={config.intensity}
        distance={6}
        position={[0, 1, 0]}
      />
    </group>
  );
}
