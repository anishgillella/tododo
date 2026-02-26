import { useRef } from 'react';
import type { Mesh } from 'three';

export function Ground() {
  const ref = useRef<Mesh>(null);

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#2d5a27" roughness={0.9} metalness={0} />
    </mesh>
  );
}
