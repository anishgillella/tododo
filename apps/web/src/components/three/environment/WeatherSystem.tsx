import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points } from 'three';
import { useAgent } from '../../../hooks/useAgent';
import { useHollowStatus } from '../../../hooks/useBossFight';
import { useWeatherStore } from '../../../stores/weatherStore';
import { SnowParticles } from './SnowParticles';
import { CloudLayer } from './CloudLayer';

/**
 * Weather particles combining game state + real weather:
 * - Game: High debt → rain, Strong streak → sunshine motes
 * - Real: rain/snow/cloudy overlaid regardless of game state
 */

export function WeatherSystem() {
  const { data: agent } = useAgent();
  const { data: hollow } = useHollowStatus();
  const realWeather = useWeatherStore((s) => s.realWeather);

  const debt = hollow?.debt ?? 0;
  const streakTier = agent?.streakTier ?? 'none';

  const showGameRain = debt >= 4;
  const showGameSunshine = !showGameRain && ['blaze', 'inferno', 'eternal_fire'].includes(streakTier);

  // Real weather overlays
  const showRealRain = realWeather === 'rain';
  const showRealSnow = realWeather === 'snow';
  const showClouds = realWeather === 'cloudy' || realWeather === 'fog' || realWeather === 'rain';

  // Amplify sunshine on clear real weather
  const amplifiedSunshine = showGameSunshine && realWeather === 'clear';

  return (
    <>
      {/* Game-state rain (debt-driven) */}
      {showGameRain && <Rain intensity={Math.min(debt / 10, 1)} />}

      {/* Real-weather rain (even if debt is 0) */}
      {showRealRain && !showGameRain && <Rain intensity={0.4} />}

      {/* Game-state sunshine motes */}
      {showGameSunshine && <SunshineMotes tier={streakTier} amplified={amplifiedSunshine} />}

      {/* Real snow particles */}
      {showRealSnow && <SnowParticles intensity={0.6} />}

      {/* Cloud layer for overcast real weather */}
      {showClouds && <CloudLayer density={realWeather === 'fog' ? 0.8 : 0.5} />}
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
    const posAttr = ref.current.geometry.getAttribute('position');
    for (let i = 0; i < count; i++) {
      const y = posAttr.getY(i) - delta * 15 * (0.8 + intensity * 0.4);
      posAttr.setY(i, y < 0 ? 20 : y);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
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

function SunshineMotes({ tier, amplified }: { tier: string; amplified: boolean }) {
  const ref = useRef<Points>(null);
  const baseCount = tier === 'eternal_fire' ? 80 : tier === 'inferno' ? 50 : 30;
  const count = amplified ? Math.floor(baseCount * 1.5) : baseCount;

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
    const posAttr = ref.current.geometry.getAttribute('position');
    for (let i = 0; i < count; i++) {
      const baseY = posAttr.getY(i);
      posAttr.setY(i, baseY + Math.sin(state.clock.elapsedTime + i) * 0.002);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#fbbf24"
        size={amplified ? 0.15 : 0.12}
        transparent
        opacity={amplified ? 0.8 : 0.6}
        sizeAttenuation
      />
    </points>
  );
}
