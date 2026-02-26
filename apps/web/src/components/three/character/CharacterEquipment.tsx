import { useInventory } from '../../../hooks/useInventory';

export function CharacterEquipment() {
  const { data } = useInventory();
  const equipped = (data?.items ?? []).filter((i) => i.equipped);

  const hasSword = equipped.some((i) => i.effect === 'crit_rate');
  const hasCloak = equipped.some((i) => i.effect === 'xp_boost');
  const hasCharm = equipped.some((i) => i.effect === 'gold_boost');

  return (
    <group>
      {/* Sword — on right hand */}
      {hasSword && (
        <group position={[0.55, 1.0, 0.1]} rotation={[0.3, 0, -0.4]}>
          {/* Blade */}
          <mesh>
            <boxGeometry args={[0.06, 0.7, 0.02]} />
            <meshStandardMaterial color="#c0c0d0" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Hilt */}
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[0.2, 0.06, 0.06]} />
            <meshStandardMaterial color="#8b4513" roughness={0.8} />
          </mesh>
          {/* Pommel */}
          <mesh position={[0, -0.45, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#fbbf24" metalness={0.6} />
          </mesh>
        </group>
      )}

      {/* Cloak — draped on back */}
      {hasCloak && (
        <mesh position={[0, 1.2, -0.25]} castShadow>
          <boxGeometry args={[0.7, 1.0, 0.08]} />
          <meshStandardMaterial
            color="#4c1d95"
            roughness={0.5}
            metalness={0.1}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Charm — glowing orb near chest */}
      {hasCharm && (
        <group position={[0, 1.5, 0.3]}>
          <mesh>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#fbbf24"
              emissiveIntensity={1.5}
            />
          </mesh>
          <pointLight color="#fbbf24" intensity={0.3} distance={2} />
        </group>
      )}
    </group>
  );
}
