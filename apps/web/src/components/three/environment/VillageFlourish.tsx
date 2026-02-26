import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { Mesh, PointLight } from 'three';
import { useAgent } from '../../../hooks/useAgent';

/**
 * Village flourishing at high streak:
 * - streak >= flame: flowers around buildings
 * - streak >= blaze: hanging lanterns/banners
 * - streak >= inferno: warm golden village lighting
 * - streak = eternal_fire: divine purple-gold glow, banners everywhere
 */

const STREAK_LEVELS: Record<string, number> = {
  none: 0,
  spark: 1,
  flame: 2,
  blaze: 3,
  inferno: 4,
  eternal_fire: 5,
};

export function VillageFlourish() {
  const { data: agent } = useAgent();
  const streakTier = agent?.streakTier ?? 'none';
  const level = STREAK_LEVELS[streakTier] ?? 0;

  if (level < 2) return null;

  return (
    <group>
      {/* Flowers around buildings */}
      {level >= 2 && <FlowerClusters count={level * 4} />}

      {/* Lanterns */}
      {level >= 3 && <Lanterns count={level * 2} />}

      {/* Warm ambient light */}
      {level >= 4 && <VillageGlow intensity={level >= 5 ? 1.5 : 0.8} />}

      {/* Golden sparkle motes */}
      {level >= 3 && (
        <Sparkles
          count={level * 12}
          scale={[25, 5, 25]}
          size={1.5}
          speed={0.2}
          opacity={0.4}
          color={level >= 5 ? '#a855f7' : '#fbbf24'}
        />
      )}

      {/* Banner poles */}
      {level >= 5 && <Banners />}
    </group>
  );
}

function FlowerClusters({ count }: { count: number }) {
  const colors = ['#ef4444', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4'];

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 5 + Math.random() * 10;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const color = colors[i % colors.length];
        return (
          <group key={i} position={[x, 0, z]}>
            {/* Stem */}
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
              <meshStandardMaterial color="#228b4a" roughness={0.8} />
            </mesh>
            {/* Flower head */}
            <mesh position={[0, 0.35, 0]}>
              <sphereGeometry args={[0.08, 6, 6]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Lanterns({ count }: { count: number }) {
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 4 + Math.random() * 5;
        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        return (
          <group key={i} position={[x, 3 + Math.random(), z]}>
            {/* Lantern body */}
            <mesh>
              <boxGeometry args={[0.2, 0.3, 0.2]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#f59e0b"
                emissiveIntensity={0.8}
                transparent
                opacity={0.85}
              />
            </mesh>
            {/* Light */}
            <pointLight color="#f59e0b" intensity={0.3} distance={4} />
          </group>
        );
      })}
    </group>
  );
}

function VillageGlow({ intensity }: { intensity: number }) {
  const lightRef = useRef<PointLight>(null);

  useFrame((state) => {
    if (!lightRef.current) return;
    lightRef.current.intensity = intensity + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
  });

  return (
    <pointLight
      ref={lightRef}
      position={[0, 6, 0]}
      color="#fbbf24"
      intensity={intensity}
      distance={25}
    />
  );
}

function Banners() {
  const positions: [number, number, number][] = [
    [-3, 0, 2], [3, 0, 2], [-5, 0, -3], [5, 0, -3],
    [0, 0, -6], [-8, 0, 0], [8, 0, 0],
  ];

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          {/* Pole */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 5, 6]} />
            <meshStandardMaterial color="#5a3825" roughness={0.9} />
          </mesh>
          {/* Banner */}
          <mesh position={[0.2, 4, 0]} castShadow>
            <planeGeometry args={[0.5, 0.8]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#7c3aed' : '#fbbf24'}
              roughness={0.6}
              side={2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
