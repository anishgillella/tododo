import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

interface Cloud {
  x: number;
  z: number;
  y: number;
  scale: number;
  speed: number;
}

export function CloudLayer({ density = 0.5 }: { density?: number }) {
  const groupRef = useRef<Group>(null);
  const count = Math.floor(6 + density * 8);

  const clouds = useMemo<Cloud[]>(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 50,
      z: (Math.random() - 0.5) * 50,
      y: 15 + Math.random() * 5,
      scale: 1.5 + Math.random() * 2,
      speed: 0.3 + Math.random() * 0.5,
    }));
  }, [count]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const cloud = clouds[i];
      if (!cloud) return;
      child.position.x += delta * cloud.speed;
      if (child.position.x > 30) child.position.x = -30;
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <mesh key={i} position={[cloud.x, cloud.y, cloud.z]} scale={cloud.scale}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial
            color="#8888aa"
            transparent
            opacity={0.15 + density * 0.1}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
