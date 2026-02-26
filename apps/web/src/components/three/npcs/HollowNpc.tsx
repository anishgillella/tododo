import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { Sparkles } from '@react-three/drei';
import { NpcCharacter } from './NpcCharacter';
import { useVillageStore } from '../../../stores/villageStore';
import { useAgent } from '../../../hooks/useAgent';

export function HollowNpc() {
  const massRef = useRef<Mesh>(null);
  const eyeRef = useRef<Mesh>(null);
  const openOverlay = useVillageStore((s) => s.openOverlay);
  const { data: agent } = useAgent();
  const debt = agent?.debt ?? 0;

  // Only visible when debt > 0
  if (debt <= 0) return null;

  const scale = 0.5 + Math.min(debt / 10, 1) * 1.0;
  const intensity = 0.5 + Math.min(debt / 10, 1) * 3;

  return (
    <NpcCharacter
      position={[0, 0, -10]}
      bodyColor="#1a0a0a"
      glowColor="#ef4444"
      name="The Hollow"
      quote="Each promise you break feeds me... Can you feel it, Drifter?"
      onClick={() => openOverlay('/rift-gate')}
    >
      {/* Dark amorphous mass */}
      <HollowMass massRef={massRef} scale={scale} />

      {/* Red eye */}
      <mesh ref={eyeRef} position={[0, 1.8 * scale, 0.3]}>
        <sphereGeometry args={[0.12 * scale, 12, 12]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Dark particles */}
      <Sparkles
        count={Math.floor(debt * 5)}
        scale={[2 * scale, 3 * scale, 2 * scale]}
        size={2}
        speed={0.8}
        opacity={0.6}
        color="#ef4444"
      />

      {/* Ominous light */}
      <pointLight
        position={[0, 1.5, 0]}
        color="#ef4444"
        intensity={intensity}
        distance={6 * scale}
      />
    </NpcCharacter>
  );
}

function HollowMass({ massRef, scale }: { massRef: React.RefObject<Mesh | null>; scale: number }) {
  useFrame((state) => {
    if (!massRef.current) return;
    // Ominous pulsing
    const s = scale + Math.sin(state.clock.elapsedTime * 2) * 0.08;
    massRef.current.scale.set(s, s, s);
    massRef.current.rotation.y = state.clock.elapsedTime * 0.3;
  });

  return (
    <mesh ref={massRef} position={[0, 1.2, 0]} castShadow>
      <dodecahedronGeometry args={[0.8, 1]} />
      <meshStandardMaterial
        color="#0a0005"
        roughness={0.9}
        metalness={0.3}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}
