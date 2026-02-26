import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { Group } from 'three';
import { useHollowStatus } from '../../../hooks/useBossFight';

/**
 * Dark tendrils spreading from the Rift Gate as debt grows.
 * Visual corruption: dark line meshes radiating outward + dark particles.
 */

export function HollowCorruption() {
  const groupRef = useRef<Group>(null);
  const { data: hollow } = useHollowStatus();
  const debt = hollow?.debt ?? 0;

  const severity = Math.min(debt / 10, 1);
  const tendrilCount = Math.floor(3 + severity * 9);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Slow ominous rotation
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
  });

  if (debt < 2) return null;

  return (
    <group ref={groupRef} position={[0, 0.05, -12]}>
      {/* Tendrils radiating from Rift Gate */}
      {Array.from({ length: tendrilCount }).map((_, i) => {
        const angle = (i / tendrilCount) * Math.PI + Math.PI / 2; // spread toward village
        const length = 3 + severity * 10;
        return (
          <Tendril
            key={i}
            angle={angle}
            length={length}
            opacity={0.2 + severity * 0.5}
          />
        );
      })}

      {/* Dark corruption particles */}
      <Sparkles
        count={Math.floor(severity * 30)}
        scale={[severity * 15, 2, severity * 15]}
        size={1.5}
        speed={0.4}
        opacity={severity * 0.6}
        color="#200510"
      />

      {/* Red corruption particles */}
      <Sparkles
        count={Math.floor(severity * 15)}
        scale={[severity * 10, 1.5, severity * 10]}
        size={1}
        speed={0.6}
        opacity={severity * 0.4}
        color="#ef4444"
      />
    </group>
  );
}

function Tendril({ angle, length, opacity }: { angle: number; length: number; opacity: number }) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    // Subtle organic wave
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8 + angle * 3) * 0.03;
  });

  const x = Math.cos(angle) * length * 0.5;
  const z = Math.sin(angle) * length * 0.5;

  return (
    <group ref={ref}>
      {/* Main tendril line */}
      <mesh
        position={[x, 0.02, z]}
        rotation={[-Math.PI / 2, 0, angle]}
      >
        <planeGeometry args={[0.12 + Math.random() * 0.08, length]} />
        <meshBasicMaterial color="#0a0005" transparent opacity={opacity} />
      </mesh>

      {/* Secondary thinner tendril */}
      <mesh
        position={[x + Math.cos(angle + 0.3) * 0.5, 0.015, z + Math.sin(angle + 0.3) * 0.5]}
        rotation={[-Math.PI / 2, 0, angle + 0.2]}
      >
        <planeGeometry args={[0.06, length * 0.7]} />
        <meshBasicMaterial color="#150008" transparent opacity={opacity * 0.7} />
      </mesh>
    </group>
  );
}
