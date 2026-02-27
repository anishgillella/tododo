import { useAgent } from '../../../hooks/useAgent';
import { DecorationPlots } from './DecorationPlots';

/**
 * Visual building upgrades:
 *
 * Level-based (automatic, every 10 levels):
 * - Level 1-9:  base buildings (already rendered)
 * - Level 10-19: stone trim around building bases
 * - Level 20-29: roof lanterns
 * - Level 30+:  arcane runes on walls
 *
 * Gold-purchased (per-building via DecorationPlots):
 * - Tier 1: Banner
 * - Tier 2: Stained glass windows
 * - Tier 3: Fountain
 * - Tier 4: Enchanted roof
 *
 * Positions match the BUILDINGS array in VillageScene.
 */

const BUILDING_POSITIONS: [number, number, number][] = [
  [0, 0, 0],       // Guild Hall
  [-8, 0, 3],      // Twilight Hearth
  [8, 0, 3],       // Training Yard
  [-6, 0, -5],     // Blacksmith's Forge
  [6, 0, -5],      // Chronicler's Tower
  [10, 0, -2],     // Elder's Study
];

export function BuildingUpgrade() {
  const { data: agent } = useAgent();
  const level = agent?.level ?? 1;

  const tier = Math.floor(level / 10); // 0, 1, 2, 3+

  return (
    <group>
      {/* Level-based automatic upgrades */}
      {/* Tier 1 (level 10+): Stone trim foundations */}
      {tier >= 1 && BUILDING_POSITIONS.map((pos, i) => (
        <mesh key={`trim-${i}`} position={[pos[0], 0.05, pos[2]]}>
          <boxGeometry args={[2.6, 0.1, 2.6]} />
          <meshStandardMaterial color="#5a5a6a" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}

      {/* Tier 2 (level 20+): Roof lanterns */}
      {tier >= 2 && BUILDING_POSITIONS.map((pos, i) => (
        <group key={`lantern-${i}`} position={[pos[0], 4.5, pos[2]]}>
          <mesh>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#fbbf24"
              emissiveIntensity={1.5}
            />
          </mesh>
          <pointLight color="#fbbf24" intensity={0.4} distance={3} />
        </group>
      ))}

      {/* Tier 3 (level 30+): Arcane runes on ground near buildings */}
      {tier >= 3 && BUILDING_POSITIONS.map((pos, i) => (
        <mesh
          key={`rune-${i}`}
          position={[pos[0], 0.02, pos[2] + 1.8]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.4, 0.55, 6]} />
          <meshBasicMaterial
            color="#7c3aed"
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}

      {/* Gold-purchased per-building decorations */}
      <DecorationPlots />
    </group>
  );
}
