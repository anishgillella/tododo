import { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { Vector3 } from 'three';
import { useAgent } from '../../../hooks/useAgent';
import { useKeyboardMovement } from '../../../hooks/useKeyboardMovement';
import { usePlayerStore } from '../../../stores/playerStore';
import { useVillageStore } from '../../../stores/villageStore';
import { CharacterEquipment } from './CharacterEquipment';
import { StreakFlame } from './StreakFlame';

const SPEED = 5;
const PROXIMITY_BUILDING = 3;
const PROXIMITY_NPC = 2.5;
const WORLD_BOUNDS = 18;

interface BuildingBound {
  position: [number, number, number];
  size: [number, number, number];
  route: string;
  name: string;
}

interface MovablePlayerProps {
  buildingBounds: BuildingBound[];
}

const NPC_POSITIONS: Record<string, [number, number, number]> = {
  Axiom: [2, 0, 1],
  Kael: [9.5, 0, 4],
  Mira: [-8.5, 0, 4],
  Hollow: [0, 0, -12],
};

export function MovablePlayer({ buildingBounds }: MovablePlayerProps) {
  const groupRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const { data: agent } = useAgent();
  const { getVelocity } = useKeyboardMovement();

  const position = usePlayerStore((s) => s.position);
  const targetPosition = usePlayerStore((s) => s.targetPosition);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const setTargetPosition = usePlayerStore((s) => s.setTargetPosition);
  const setRotation = usePlayerStore((s) => s.setRotation);
  const setIsMoving = usePlayerStore((s) => s.setIsMoving);
  const setNearbyBuilding = usePlayerStore((s) => s.setNearbyBuilding);
  const setNearbyNpc = usePlayerStore((s) => s.setNearbyNpc);
  const openOverlay = useVillageStore((s) => s.openOverlay);

  const tempVec = useRef(new Vector3());
  const walkTime = useRef(0);

  const checkCollision = useCallback((x: number, z: number): boolean => {
    for (const b of buildingBounds) {
      const hw = (b.size[0] + 1) / 2;
      const hd = (b.size[2] + 1) / 2;
      if (
        x > b.position[0] - hw && x < b.position[0] + hw &&
        z > b.position[2] - hd && z < b.position[2] + hd
      ) {
        return true;
      }
    }
    return false;
  }, [buildingBounds]);

  useFrame((_state, delta) => {
    if (!groupRef.current) return;

    let currentX = position[0];
    let currentZ = position[2];
    let moving = false;

    // Keyboard movement
    const vel = getVelocity();
    if (vel.x !== 0 || vel.z !== 0) {
      const nextX = currentX + vel.x * SPEED * delta;
      const nextZ = currentZ + vel.z * SPEED * delta;

      // Clamp to world bounds
      const clampedX = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, nextX));
      const clampedZ = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, nextZ));

      // Try to move; allow sliding along walls
      if (!checkCollision(clampedX, currentZ)) currentX = clampedX;
      if (!checkCollision(currentX, clampedZ)) currentZ = clampedZ;

      // Face movement direction
      const angle = Math.atan2(vel.x, vel.z);
      setRotation(angle);
      groupRef.current.rotation.y = angle;

      moving = true;
      setTargetPosition(null); // keyboard overrides click-to-move
    }
    // Click-to-move
    else if (targetPosition) {
      tempVec.current.set(targetPosition[0] - currentX, 0, targetPosition[2] - currentZ);
      const dist = tempVec.current.length();

      if (dist < 0.2) {
        setTargetPosition(null);
      } else {
        tempVec.current.normalize().multiplyScalar(SPEED * delta);
        const nextX = currentX + tempVec.current.x;
        const nextZ = currentZ + tempVec.current.z;

        const clampedX = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, nextX));
        const clampedZ = Math.max(-WORLD_BOUNDS, Math.min(WORLD_BOUNDS, nextZ));

        if (!checkCollision(clampedX, currentZ)) currentX = clampedX;
        if (!checkCollision(currentX, clampedZ)) currentZ = clampedZ;

        const angle = Math.atan2(tempVec.current.x, tempVec.current.z);
        setRotation(angle);
        groupRef.current.rotation.y = angle;

        moving = true;
      }
    }

    // Idle breathing
    if (!moving) {
      groupRef.current.position.y = Math.sin(_state.clock.elapsedTime * 1.5) * 0.05;
    }

    // Walking animation — oscillate legs
    if (moving) {
      walkTime.current += delta * 10;
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(walkTime.current) * 0.4;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(walkTime.current) * 0.4;
    } else {
      walkTime.current = 0;
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.9;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.9;
    }

    // Update position
    groupRef.current.position.x = currentX;
    groupRef.current.position.z = currentZ;
    setPosition([currentX, 0, currentZ]);
    setIsMoving(moving);

    // Proximity detection — buildings
    let closestBuilding: string | null = null;
    for (const b of buildingBounds) {
      const dx = currentX - b.position[0];
      const dz = currentZ - b.position[2];
      if (Math.sqrt(dx * dx + dz * dz) < PROXIMITY_BUILDING) {
        closestBuilding = b.name;
        break;
      }
    }
    setNearbyBuilding(closestBuilding);

    // Proximity detection — NPCs
    let closestNpc: string | null = null;
    for (const [name, npcPos] of Object.entries(NPC_POSITIONS)) {
      const dx = currentX - npcPos[0];
      const dz = currentZ - npcPos[2];
      if (Math.sqrt(dx * dx + dz * dz) < PROXIMITY_NPC) {
        closestNpc = name;
        break;
      }
    }
    setNearbyNpc(closestNpc);
  });

  // Handle "E" key for interaction
  useFrame(() => {
    // This is handled in a separate effect; useFrame here just maintains the loop
  });

  const streakTier = agent?.streakTier ?? 'none';

  return (
    <group ref={groupRef} position={[position[0], 0, position[2]]}>
      {/* Body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.7, 8, 16]} />
        <meshStandardMaterial color="#3a3a6a" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.1, 2.05, 0.24]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[0.1, 2.05, 0.24]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.45, 1.1, 0]} rotation={[0, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color="#3a3a6a" roughness={0.6} />
      </mesh>
      <mesh position={[0.45, 1.1, 0]} rotation={[0, 0, -0.15]} castShadow>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
        <meshStandardMaterial color="#3a3a6a" roughness={0.6} />
      </mesh>

      {/* Left leg — animated */}
      <group ref={leftLegRef} position={[-0.15, 0.5, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
          <meshStandardMaterial color="#2a2a4a" roughness={0.7} />
        </mesh>
      </group>

      {/* Right leg — animated */}
      <group ref={rightLegRef} position={[0.15, 0.5, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
          <meshStandardMaterial color="#2a2a4a" roughness={0.7} />
        </mesh>
      </group>

      {/* Equipment visuals */}
      <CharacterEquipment />

      {/* Streak flame aura */}
      {streakTier !== 'none' && <StreakFlame tier={streakTier} />}

      {/* Player light */}
      <pointLight position={[0, 2.5, 0.5]} intensity={0.5} distance={4} color="#a78bfa" />
    </group>
  );
}
