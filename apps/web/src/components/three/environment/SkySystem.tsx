import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Color as ThreeColor, Mesh } from 'three';
import { Color } from 'three';
import { useAgent } from '../../../hooks/useAgent';
import { useHollowStatus } from '../../../hooks/useBossFight';

/**
 * Dynamic sky dome that changes color based on hollow stage + streak tier.
 *
 * debt 0 (dormant)        → bright twilight blue
 * debt 1-3 (whispers)     → slight darkening
 * debt 4-6 (presence)     → overcast grey-purple
 * debt 7-9 (confrontation)→ stormy dark red
 * debt 10+ (forced)       → near-black with red tint
 *
 * High streak             → warmer, brighter tones
 */

const SKY_COLORS: Record<string, string> = {
  dormant:       '#1a1a3e',
  whispers:      '#151530',
  presence:      '#12101e',
  confrontation: '#0f0810',
  forced:        '#080005',
};

const STREAK_BOOST: Record<string, number> = {
  none: 0,
  spark: 0.05,
  flame: 0.1,
  blaze: 0.18,
  inferno: 0.28,
  eternal_fire: 0.4,
};

export function SkySystem() {
  const meshRef = useRef<Mesh>(null);
  const currentColor = useRef(new Color('#1a1a3e'));
  const targetColor = useRef(new Color('#1a1a3e'));

  const { data: agent } = useAgent();
  const { data: hollow } = useHollowStatus();

  const stage = hollow?.stage ?? 'dormant';
  const streakTier = agent?.streakTier ?? 'none';

  // Compute target sky color
  const baseColor = new Color(SKY_COLORS[stage] ?? SKY_COLORS.dormant);
  const boost = STREAK_BOOST[streakTier] ?? 0;
  if (boost > 0) {
    // Warm the sky with streak glow
    baseColor.lerp(new Color('#2a2050'), boost);
  }
  targetColor.current.copy(baseColor);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    // Smoothly lerp sky color
    currentColor.current.lerp(targetColor.current, delta * 0.5);
    const mat = meshRef.current.material as unknown as { color: ThreeColor };
    mat.color.copy(currentColor.current);
  });

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[45, 32, 16]} />
      <meshBasicMaterial color={currentColor.current} side={2} fog={false} />
    </mesh>
  );
}
