import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { Mesh } from 'three';
import { useHollowStatus } from '../../../hooks/useBossFight';

/**
 * Visual decay that appears when debt > 6:
 * - Dark cracks on the ground spreading from the Rift Gate
 * - Withered patches replacing grass
 * - Dark particle wisps
 */

export function VillageDecay() {
  const { data: hollow } = useHollowStatus();
  const debt = hollow?.debt ?? 0;

  if (debt < 4) return null;

  const severity = Math.min((debt - 3) / 7, 1); // 0..1 from debt 4-10

  return (
    <group>
      {/* Ground cracks — dark lines spreading from Rift Gate */}
      {debt >= 4 && <GroundCracks severity={severity} />}

      {/* Withered ground patches */}
      {debt >= 6 && <WitheredPatches severity={severity} />}

      {/* Dark wisps */}
      <Sparkles
        count={Math.floor(severity * 40)}
        scale={[20, 3, 20]}
        size={1.5}
        speed={0.3}
        opacity={severity * 0.5}
        color="#1a0510"
        position={[0, 1, -4]}
      />
    </group>
  );
}

function GroundCracks({ severity }: { severity: number }) {
  const cracks = Math.floor(3 + severity * 8);

  return (
    <group>
      {Array.from({ length: cracks }).map((_, i) => {
        const angle = (i / cracks) * Math.PI * 2;
        const dist = 3 + severity * 8;
        const x = Math.sin(angle) * dist * (0.3 + Math.random() * 0.7);
        const z = -6 + Math.cos(angle) * dist * (0.3 + Math.random() * 0.7);
        const len = 1 + severity * 3;
        return (
          <mesh
            key={i}
            position={[x, 0.02, z]}
            rotation={[-Math.PI / 2, 0, angle + Math.random()]}
          >
            <planeGeometry args={[0.08, len]} />
            <meshBasicMaterial
              color="#1a0510"
              transparent
              opacity={0.4 + severity * 0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function WitheredPatches({ severity }: { severity: number }) {
  const patches = Math.floor(2 + severity * 6);

  return (
    <group>
      {Array.from({ length: patches }).map((_, i) => {
        const x = (Math.random() - 0.5) * 20;
        const z = (Math.random() - 0.5) * 20;
        const size = 0.8 + Math.random() * 1.5;
        return (
          <mesh
            key={i}
            position={[x, 0.01, z]}
            rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}
          >
            <circleGeometry args={[size, 8]} />
            <meshBasicMaterial
              color="#1a1208"
              transparent
              opacity={0.3 + severity * 0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}
