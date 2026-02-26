interface TreeProps {
  position: [number, number, number];
}

export function Tree({ position }: TreeProps) {
  const scale = 0.7 + Math.random() * 0.6;

  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 2, 6]} />
        <meshStandardMaterial color="#5a3825" roughness={0.9} />
      </mesh>

      {/* Foliage — stacked cones */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <coneGeometry args={[1.2, 1.8, 6]} />
        <meshStandardMaterial color="#1a6b3a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.8, 0]} castShadow>
        <coneGeometry args={[0.9, 1.5, 6]} />
        <meshStandardMaterial color="#228b4a" roughness={0.8} />
      </mesh>
      <mesh position={[0, 4.6, 0]} castShadow>
        <coneGeometry args={[0.6, 1.2, 6]} />
        <meshStandardMaterial color="#2aa55a" roughness={0.8} />
      </mesh>
    </group>
  );
}
