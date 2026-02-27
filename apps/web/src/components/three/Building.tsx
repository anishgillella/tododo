import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group, Mesh } from 'three';
import { FloatingLabel } from './FloatingLabel';
import { useVillageStore, type OverlayRoute } from '../../stores/villageStore';
import { usePlayerStore } from '../../stores/playerStore';

interface BuildingProps {
  name: string;
  route: OverlayRoute;
  position: [number, number, number];
  color: string;
  size?: [number, number, number];
}

export function Building({ name, route, position, color, size = [2, 2.5, 2] }: BuildingProps) {
  const groupRef = useRef<Group>(null);
  const glowRef = useRef<Mesh>(null);
  const doorRef = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const openOverlay = useVillageStore((s) => s.openOverlay);
  const nearbyBuilding = usePlayerStore((s) => s.nearbyBuilding);

  const isNearby = nearbyBuilding === name;

  const [w, h, d] = size;
  const roofHeight = h * 0.5;

  // Handle "E" key to enter building when nearby
  useEffect(() => {
    if (!isNearby) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e') {
        openOverlay(route, [position[0], position[1] + 2, position[2]]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isNearby, openOverlay, route, position]);

  useFrame((_state, delta) => {
    if (!glowRef.current) return;
    // Glow on hover or proximity
    const target = (hovered || isNearby) ? 0.4 : 0;
    const mat = glowRef.current.material as { opacity: number };
    mat.opacity += (target - mat.opacity) * Math.min(delta * 8, 1);

    // Door swing on proximity
    if (doorRef.current) {
      const targetAngle = isNearby ? -Math.PI / 3 : 0;
      doorRef.current.rotation.y += (targetAngle - doorRef.current.rotation.y) * Math.min(delta * 4, 1);
    }
  });

  const handleClick = () => {
    openOverlay(route, [position[0], position[1] + 2, position[2]]);
  };

  return (
    <group
      ref={groupRef}
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
      {/* Base box */}
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Roof cone */}
      <mesh position={[0, h + roofHeight / 2, 0]} castShadow>
        <coneGeometry args={[w * 0.85, roofHeight, 4]} />
        <meshStandardMaterial color="#4a2c1a" roughness={0.8} metalness={0} />
      </mesh>

      {/* Hover/proximity glow */}
      <mesh ref={glowRef} position={[0, h / 2, 0]}>
        <boxGeometry args={[w + 0.3, h + 0.3, d + 0.3]} />
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Door — animated swing on proximity */}
      <group ref={doorRef} position={[-0.35, 0.6, d / 2 + 0.01]}>
        <mesh position={[0.35, 0, 0]}>
          <planeGeometry args={[0.7, 1.2]} />
          <meshStandardMaterial color="#2a1810" roughness={0.9} />
        </mesh>
      </group>

      {/* Label */}
      <FloatingLabel text={name} visible={hovered || isNearby} position={[0, h + roofHeight + 1, 0]} />

      {/* "Press E" prompt on proximity */}
      {isNearby && (
        <Html position={[0, h + roofHeight + 0.3, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="rounded-md bg-void-light/90 px-2 py-1 border border-arcane/40 backdrop-blur-sm">
            <span className="font-mono text-[10px] text-arcane-light tracking-wider">
              Press E to enter
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}
