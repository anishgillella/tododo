import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { NpcBubble } from './NpcBubble';

interface NpcCharacterProps {
  position: [number, number, number];
  bodyColor: string;
  headColor?: string;
  glowColor?: string;
  name: string;
  quote: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function NpcCharacter({
  position,
  bodyColor,
  headColor,
  glowColor,
  name,
  quote,
  onClick,
  children,
}: NpcCharacterProps) {
  const groupRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);

  // Idle bob
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.06;
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={onClick}
      onPointerOver={() => {
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {children ?? (
        <>
          {/* Default humanoid body */}
          <mesh position={[0, 0.9, 0]} castShadow>
            <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
            <meshStandardMaterial color={bodyColor} roughness={0.6} />
          </mesh>

          {/* Head */}
          <mesh position={[0, 1.75, 0]} castShadow>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial color={headColor ?? '#d4a574'} roughness={0.7} />
          </mesh>

          {/* Arms */}
          <mesh position={[-0.38, 0.9, 0]} rotation={[0, 0, 0.2]} castShadow>
            <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={0.6} />
          </mesh>
          <mesh position={[0.38, 0.9, 0]} rotation={[0, 0, -0.2]} castShadow>
            <capsuleGeometry args={[0.07, 0.4, 4, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={0.6} />
          </mesh>

          {/* Legs */}
          <mesh position={[-0.12, 0.25, 0]} castShadow>
            <capsuleGeometry args={[0.08, 0.35, 4, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={0.7} />
          </mesh>
          <mesh position={[0.12, 0.25, 0]} castShadow>
            <capsuleGeometry args={[0.08, 0.35, 4, 8]} />
            <meshStandardMaterial color={bodyColor} roughness={0.7} />
          </mesh>
        </>
      )}

      {/* Glow when hovered */}
      {glowColor && hovered && (
        <pointLight
          position={[0, 1.5, 0]}
          color={glowColor}
          intensity={1.5}
          distance={4}
        />
      )}

      {/* Speech bubble */}
      <NpcBubble name={name} text={quote} visible={hovered} />
    </group>
  );
}
