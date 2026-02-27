import { useBuildings } from '../../../hooks/useBuildings';

/**
 * Gold-purchased visual decorations per building.
 * Tier 1: Banner (flag pole)
 * Tier 2: Stained glass (glowing window)
 * Tier 3: Fountain (water feature)
 * Tier 4: Enchanted roof (rune glow on top)
 */

const BUILDING_POSITIONS: Record<string, [number, number, number]> = {
  'guild-hall':        [0, 0, 0],
  'twilight-hearth':   [-8, 0, 3],
  'training-yard':     [8, 0, 3],
  'blacksmiths-forge': [-6, 0, -5],
  'chroniclers-tower': [6, 0, -5],
  'elders-study':      [10, 0, -2],
};

const BANNER_COLORS: Record<string, string> = {
  'guild-hall':        '#7c3aed',
  'twilight-hearth':   '#f59e0b',
  'training-yard':     '#10b981',
  'blacksmiths-forge': '#f59e0b',
  'chroniclers-tower': '#06b6d4',
  'elders-study':      '#6b7280',
};

function Banner({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={[position[0] + 1.3, 0, position[2]]}>
      {/* Pole */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 3, 6]} />
        <meshStandardMaterial color="#8b7355" />
      </mesh>
      {/* Flag */}
      <mesh position={[0.3, 4, 0]}>
        <planeGeometry args={[0.6, 0.4]} />
        <meshStandardMaterial color={color} side={2} />
      </mesh>
    </group>
  );
}

function StainedGlass({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={[position[0], 2.5, position[2] + 1.05]}>
      <mesh>
        <circleGeometry args={[0.3, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.7}
        />
      </mesh>
      <pointLight color={color} intensity={0.3} distance={3} />
    </group>
  );
}

function Fountain({ position }: { position: [number, number, number] }) {
  return (
    <group position={[position[0], 0, position[2] + 2]}>
      {/* Basin */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.6, 0.5, 0.3, 12]} />
        <meshStandardMaterial color="#5a6a7a" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Water */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.05, 12]} />
        <meshStandardMaterial color="#3b82f6" transparent opacity={0.6} />
      </mesh>
      {/* Spout */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 0.4, 8]} />
        <meshStandardMaterial color="#5a6a7a" roughness={0.3} metalness={0.5} />
      </mesh>
      <pointLight position={[0, 0.5, 0]} color="#3b82f6" intensity={0.2} distance={2} />
    </group>
  );
}

function EnchantedRoof({ position }: { position: [number, number, number] }) {
  return (
    <group position={[position[0], 4.2, position[2]]}>
      {/* Glowing rune ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.04, 8, 16]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.6} />
      </mesh>
      {/* Inner glow */}
      <pointLight color="#a78bfa" intensity={0.6} distance={4} />
      {/* Corner gems */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.cos(angle) * 0.9, 0, Math.sin(angle) * 0.9]}
        >
          <octahedronGeometry args={[0.08]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}
    </group>
  );
}

export function DecorationPlots() {
  const { data } = useBuildings();

  if (!data?.buildings) return null;

  return (
    <group>
      {data.buildings.map((building) => {
        const pos = BUILDING_POSITIONS[building.id];
        if (!pos) return null;
        const color = BANNER_COLORS[building.id] ?? '#7c3aed';
        const tier = building.currentTier;

        return (
          <group key={building.id}>
            {tier >= 1 && <Banner position={pos} color={color} />}
            {tier >= 2 && <StainedGlass position={pos} color={color} />}
            {tier >= 3 && <Fountain position={pos} />}
            {tier >= 4 && <EnchantedRoof position={pos} />}
          </group>
        );
      })}
    </group>
  );
}
