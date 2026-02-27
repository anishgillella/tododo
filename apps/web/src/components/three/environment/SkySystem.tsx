import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Color as ThreeColor, Mesh } from 'three';
import { Color } from 'three';
import { useAgent } from '../../../hooks/useAgent';
import { useHollowStatus } from '../../../hooks/useBossFight';
import { useWeatherStore } from '../../../stores/weatherStore';

/**
 * Dynamic sky dome that blends:
 * 1. Game state (hollow stage + streak tier)
 * 2. Real-world time of day (morning warm, midday bright, evening orange, night blue)
 *
 * The blend is 70% game state, 30% time-of-day for subtle realism.
 */

const SKY_COLORS: Record<string, string> = {
  dormant:       '#1a1a3e',
  whispers:      '#151530',
  presence:      '#12101e',
  confrontation: '#0f0810',
  forced:        '#080005',
};

const TIME_COLORS: Record<string, string> = {
  morning: '#3d2244',  // warm purple-pink dawn
  midday:  '#1e2a4a',  // brighter blue
  evening: '#3a1a10',  // warm orange-brown
  night:   '#0a0a20',  // deep blue-black
};

const STREAK_BOOST: Record<string, number> = {
  none: 0,
  spark: 0.05,
  flame: 0.1,
  blaze: 0.18,
  inferno: 0.28,
  eternal_fire: 0.4,
};

const TIME_BLEND = 0.3; // 30% real time-of-day influence

export function SkySystem() {
  const meshRef = useRef<Mesh>(null);
  const currentColor = useRef(new Color('#1a1a3e'));
  const targetColor = useRef(new Color('#1a1a3e'));

  const { data: agent } = useAgent();
  const { data: hollow } = useHollowStatus();
  const timeOfDay = useWeatherStore((s) => s.timeOfDay);

  const stage = hollow?.stage ?? 'dormant';
  const streakTier = agent?.streakTier ?? 'none';

  // Compute game-state sky color
  const gameColor = new Color(SKY_COLORS[stage] ?? SKY_COLORS.dormant);
  const boost = STREAK_BOOST[streakTier] ?? 0;
  if (boost > 0) {
    gameColor.lerp(new Color('#2a2050'), boost);
  }

  // Blend with time-of-day color
  const timeColor = new Color(TIME_COLORS[timeOfDay] ?? TIME_COLORS.midday);
  gameColor.lerp(timeColor, TIME_BLEND);

  targetColor.current.copy(gameColor);

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
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
