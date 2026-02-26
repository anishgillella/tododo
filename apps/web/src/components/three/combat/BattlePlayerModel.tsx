import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

interface BattlePlayerModelProps {
  phase: 'intro' | 'fighting' | 'result';
}

export function BattlePlayerModel({ phase }: BattlePlayerModelProps) {
  const groupRef = useRef<Group>(null);
  const armRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Idle breathing
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;

    // Attack animation during fighting
    if (armRef.current && phase === 'fighting') {
      armRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 6) * 0.8;
    } else if (armRef.current) {
      armRef.current.rotation.x += (0 - armRef.current.rotation.x) * delta * 5;
    }
  });

  return (
    <group ref={groupRef} position={[-3, 0, 0]}>
      {/* Body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.8, 8, 16]} />
        <meshStandardMaterial color="#3a3a6a" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.1, 2.15, 0.26]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[0.1, 2.15, 0.26]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>

      {/* Left arm */}
      <mesh position={[-0.5, 1.1, 0]} rotation={[0, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.09, 0.55, 4, 8]} />
        <meshStandardMaterial color="#3a3a6a" roughness={0.6} />
      </mesh>

      {/* Right arm (sword arm) */}
      <group ref={armRef} position={[0.5, 1.1, 0]}>
        <mesh rotation={[0, 0, -0.15]} castShadow>
          <capsuleGeometry args={[0.09, 0.55, 4, 8]} />
          <meshStandardMaterial color="#3a3a6a" roughness={0.6} />
        </mesh>
        {/* Sword */}
        <group position={[0.15, -0.3, 0.3]} rotation={[-0.5, 0, -0.2]}>
          <mesh>
            <boxGeometry args={[0.06, 0.9, 0.02]} />
            <meshStandardMaterial color="#c0c0d0" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, -0.5, 0]}>
            <boxGeometry args={[0.22, 0.06, 0.06]} />
            <meshStandardMaterial color="#8b4513" roughness={0.8} />
          </mesh>
          {/* Blade glow */}
          <pointLight color="#a78bfa" intensity={0.5} distance={2} />
        </group>
      </group>

      {/* Legs */}
      <mesh position={[-0.17, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.45, 4, 8]} />
        <meshStandardMaterial color="#2a2a4a" roughness={0.7} />
      </mesh>
      <mesh position={[0.17, 0.3, 0]} castShadow>
        <capsuleGeometry args={[0.11, 0.45, 4, 8]} />
        <meshStandardMaterial color="#2a2a4a" roughness={0.7} />
      </mesh>

      {/* Player light */}
      <pointLight position={[0, 2.5, 0.5]} intensity={0.8} distance={5} color="#a78bfa" />
    </group>
  );
}
