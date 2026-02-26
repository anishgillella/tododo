import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Mesh } from 'three';
import { FloatingLabel } from './FloatingLabel';
import { useVillageStore } from '../../stores/villageStore';

export function RiftGateBuilding() {
  const torusRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const openOverlay = useVillageStore((s) => s.openOverlay);
  const position: [number, number, number] = [0, 0, -12];

  useFrame((_state, delta) => {
    if (!torusRef.current) return;
    torusRef.current.rotation.z += delta * 0.2;
    torusRef.current.rotation.x += delta * 0.1;
  });

  const handleClick = () => {
    openOverlay('/rift-gate', [position[0], position[1] + 2, position[2]]);
  };

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Stone pillars */}
      <mesh position={[-2, 2, 0]} castShadow>
        <boxGeometry args={[0.6, 4, 0.6]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.9} />
      </mesh>
      <mesh position={[2, 2, 0]} castShadow>
        <boxGeometry args={[0.6, 4, 0.6]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.9} />
      </mesh>

      {/* Rotating torus */}
      <mesh ref={torusRef} position={[0, 3, 0]}>
        <torusGeometry args={[1.8, 0.15, 16, 32]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={hovered ? 1.5 : 0.8}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Inner glow sphere */}
      <mesh position={[0, 3, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.15} />
      </mesh>

      {/* Point light for rift glow */}
      <pointLight position={[0, 3, 0]} color="#ef4444" intensity={2} distance={8} />

      {/* Label */}
      <FloatingLabel text="Rift Gate" visible={hovered} position={[0, 6, 0]} />
    </group>
  );
}
