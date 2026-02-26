import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points } from 'three';
import { Float32BufferAttribute } from 'three';
import { useAgent } from '../../../hooks/useAgent';
import { useHollowStatus } from '../../../hooks/useBossFight';

/**
 * Weather particles:
 * - High debt → rain (falling particles)
 * - Strong streak → sunshine motes (floating golden particles)
 * - Dormant with no streak → calm (nothing)
 */

export function WeatherSystem() {
  const { data: agent } = useAgent();
  const { data: hollow } = useHollowStatus();

  const debt = hollow?.debt ?? 0;
  const streakTier = agent?.streakTier ?? 'none';

  const showRain = debt >= 4;
  const showSunshine = !showRain && ['blaze', 'inferno', 'eternal_fire'].includes(streakTier);

  return (
    <>
      {showRain && <Rain intensity={Math.min(debt / 10, 1)} />}
      {showSunshine && <SunshineMotes tier={streakTier} />}
    </>
  );
}

function Rain({ intensity }: { intensity: number }) {
  const ref = useRef<Points>(null);
  const count = Math.floor(200 * intensity);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = Math.random() * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, [count]);

  useFrame((_state, delta) => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const posAttr = geo.getAttribute('position');
    for (let i = 0; i < count; i++) {
      const y = posAttr.getY(i) - delta * 15 * (0.8 + intensity * 0.4);
      posAttr.setY(i, y < 0 ? 20 : y);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#8888cc"
        size={0.06}
        transparent
        opacity={0.4 + intensity * 0.3}
        sizeAttenuation
      />
    </points>
  );
}

function SunshineMotes({ tier }: { tier: string }) {
  const ref = useRef<Points>(null);
  const count = tier === 'eternal_fire' ? 80 : tier === 'inferno' ? 50 : 30;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = 2 + Math.random() * 10;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const posAttr = geo.getAttribute('position');
    for (let i = 0; i < count; i++) {
      const baseY = posAttr.getY(i);
      posAttr.setY(i, baseY + Math.sin(state.clock.elapsedTime + i) * 0.002);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#fbbf24"
        size={0.12}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}
