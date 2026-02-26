import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { NpcCharacter } from './NpcCharacter';
import { useVillageStore } from '../../../stores/villageStore';

export function AxiomNpc() {
  const crystalRef = useRef<Mesh>(null);
  const openOverlay = useVillageStore((s) => s.openOverlay);

  useFrame((state) => {
    if (!crystalRef.current) return;
    crystalRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    crystalRef.current.position.y = 2.0 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
  });

  return (
    <NpcCharacter
      position={[2, 0, 1]}
      bodyColor="#06b6d4"
      glowColor="#06b6d4"
      name="Axiom"
      quote="Ward sweep complete. Your motivation levels remain... measurable."
      onClick={() => openOverlay('/tavern')}
    >
      {/* Floating crystal instead of humanoid body */}
      <mesh ref={crystalRef} position={[0, 2, 0]} castShadow>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Crystal glow */}
      <pointLight position={[0, 2, 0]} color="#06b6d4" intensity={1} distance={5} />

      {/* Shadow pedestal */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.15} />
      </mesh>
    </NpcCharacter>
  );
}
