import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useAgent } from '../../../hooks/useAgent';
import { CharacterEquipment } from './CharacterEquipment';
import { StreakFlame } from './StreakFlame';

interface PlayerCharacterProps {
  position?: [number, number, number];
}

export function PlayerCharacter({ position = [0, 0, 3] }: PlayerCharacterProps) {
  const groupRef = useRef<Group>(null);
  const { data: agent } = useAgent();

  // Idle breathing animation
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
  });

  const streakTier = agent?.streakTier ?? 'none';

  return (
    <group ref={groupRef} position={position}>
      {/* Body — capsule shape (cylinder + sphere caps) */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.7, 8, 16]} />
        <meshStandardMaterial color="#3a3a6a" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.1, 2.05, 0.24]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[0.1, 2.05, 0.24]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.45, 1.1, 0]} rotation={[0, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color="#3a3a6a" roughness={0.6} />
      </mesh>

      {/* Right arm */}
      <mesh position={[0.45, 1.1, 0]} rotation={[0, 0, -0.15]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color="#3a3a6a" roughness={0.6} />
      </mesh>

      {/* Left leg */}
      <mesh position={[-0.15, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
        <meshStandardMaterial color="#2a2a4a" roughness={0.7} />
      </mesh>

      {/* Right leg */}
      <mesh position={[0.15, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
        <meshStandardMaterial color="#2a2a4a" roughness={0.7} />
      </mesh>

      {/* Equipment visuals */}
      <CharacterEquipment />

      {/* Streak flame aura */}
      {streakTier !== 'none' && <StreakFlame tier={streakTier} />}

      {/* Player light */}
      <pointLight position={[0, 2.5, 0.5]} intensity={0.5} distance={4} color="#a78bfa" />
    </group>
  );
}
