import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { Group, Mesh } from 'three';

interface HollowBossProps {
  debt: number;
  phase: 'intro' | 'fighting' | 'result';
  defeated?: boolean;
}

export function HollowBoss({ debt, phase, defeated }: HollowBossProps) {
  const groupRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const scale = 1.0 + Math.min(debt / 10, 1) * 0.8;

  useFrame((state, delta) => {
    if (!groupRef.current || !coreRef.current) return;

    if (defeated) {
      // Shrink on defeat
      groupRef.current.scale.lerp(
        { x: 0.01, y: 0.01, z: 0.01 } as any,
        delta * 2
      );
      return;
    }

    // Ominous rotation
    coreRef.current.rotation.y += delta * 0.5;
    coreRef.current.rotation.x += delta * 0.2;

    // Pulsing during fight
    if (phase === 'fighting') {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
      groupRef.current.scale.set(scale * pulse, scale * pulse, scale * pulse);
    }
  });

  return (
    <group ref={groupRef} position={[3, 1.5, 0]} scale={scale}>
      {/* Core mass */}
      <mesh ref={coreRef} castShadow>
        <dodecahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color="#0a0005"
          roughness={0.8}
          metalness={0.4}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.2} />
      </mesh>

      {/* Eye */}
      <mesh position={[0, 0.3, 0.9]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={3}
        />
      </mesh>

      {/* Tendrils — floating spikes */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * 1.3;
        const z = Math.sin(angle) * 1.3;
        return (
          <mesh key={i} position={[x, -0.3, z]} rotation={[0.5, angle, 0]} castShadow>
            <coneGeometry args={[0.1, 0.8, 4]} />
            <meshStandardMaterial color="#1a0505" roughness={0.9} />
          </mesh>
        );
      })}

      {/* Dark particles */}
      <Sparkles
        count={30}
        scale={[3, 3, 3]}
        size={3}
        speed={1.5}
        opacity={0.6}
        color="#ef4444"
      />

      {/* Boss light */}
      <pointLight color="#ef4444" intensity={2 + debt * 0.3} distance={8} />
    </group>
  );
}
