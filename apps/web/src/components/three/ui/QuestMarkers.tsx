import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useMissions } from '../../../hooks/useMissions';

/**
 * Floating quest markers (!) over buildings that have active quests.
 * Guild Hall always shows if there are any active missions.
 */

const BUILDING_QUEST_MAP: { route: string; position: [number, number, number]; height: number }[] = [
  { route: '/command-deck',      position: [0, 0, 0],    height: 5.5 },  // Guild Hall
  { route: '/rift-gate',         position: [0, 0, -12],  height: 7.0 },  // Rift Gate
];

export function QuestMarkers() {
  const { data: missions = [] } = useMissions();
  const activeMissions = missions.filter((m) => m.status === 'active');

  if (activeMissions.length === 0) return null;

  return (
    <group>
      {/* Guild Hall marker — shows when there are active missions */}
      {activeMissions.length > 0 && (
        <QuestMarker
          position={[
            BUILDING_QUEST_MAP[0].position[0],
            BUILDING_QUEST_MAP[0].height,
            BUILDING_QUEST_MAP[0].position[2],
          ]}
          count={activeMissions.length}
          color="#fbbf24"
        />
      )}

      {/* Rift Gate marker — shows when there are overdue/carried missions */}
      {activeMissions.some((m) => m.carryOverCount > 0) && (
        <QuestMarker
          position={[
            BUILDING_QUEST_MAP[1].position[0],
            BUILDING_QUEST_MAP[1].height,
            BUILDING_QUEST_MAP[1].position[2],
          ]}
          color="#ef4444"
        />
      )}
    </group>
  );
}

function QuestMarker({
  position,
  count,
  color = '#fbbf24',
}: {
  position: [number, number, number];
  count?: number;
  color?: string;
}) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2;
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Exclamation mark — diamond shape */}
      <mesh>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Dot below */}
      <mesh position={[0, -0.4, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* Glow */}
      <pointLight color={color} intensity={0.5} distance={3} />
    </group>
  );
}
