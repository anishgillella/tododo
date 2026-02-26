import { NpcCharacter } from './NpcCharacter';
import { useVillageStore } from '../../../stores/villageStore';

export function MiraNpc() {
  const openOverlay = useVillageStore((s) => s.openOverlay);

  return (
    <NpcCharacter
      position={[-9.5, 0, 4]}
      bodyColor="#10b981"
      headColor="#d4a574"
      glowColor="#10b981"
      name="Mira"
      quote="The fire within you still burns, dear Drifter. That is all that matters."
      onClick={() => openOverlay('/tavern')}
    >
      {/* Mira's body — wise keeper with green robes */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.28, 0.7, 8, 16]} />
        <meshStandardMaterial color="#0d5c3f" roughness={0.5} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.85, 0]} castShadow>
        <sphereGeometry args={[0.23, 16, 16]} />
        <meshStandardMaterial color="#d4a574" roughness={0.7} />
      </mesh>

      {/* Hood */}
      <mesh position={[0, 2.0, -0.08]} castShadow>
        <sphereGeometry args={[0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0d5c3f" roughness={0.5} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.4, 0.9, 0]} rotation={[0, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.07, 0.45, 4, 8]} />
        <meshStandardMaterial color="#0d5c3f" roughness={0.5} />
      </mesh>
      <mesh position={[0.4, 0.9, 0]} rotation={[0, 0, -0.2]} castShadow>
        <capsuleGeometry args={[0.07, 0.45, 4, 8]} />
        <meshStandardMaterial color="#0d5c3f" roughness={0.5} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.12, 0.25, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.35, 4, 8]} />
        <meshStandardMaterial color="#064e3b" roughness={0.7} />
      </mesh>
      <mesh position={[0.12, 0.25, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.35, 4, 8]} />
        <meshStandardMaterial color="#064e3b" roughness={0.7} />
      </mesh>

      {/* Staff — held in right hand */}
      <group position={[0.5, 0.9, 0.15]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.03, 0.04, 2.2, 6]} />
          <meshStandardMaterial color="#5a3825" roughness={0.9} />
        </mesh>
        {/* Staff orb */}
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial
            color="#10b981"
            emissive="#10b981"
            emissiveIntensity={1}
          />
        </mesh>
        <pointLight position={[0, 1.2, 0]} color="#10b981" intensity={0.5} distance={3} />
      </group>
    </NpcCharacter>
  );
}
