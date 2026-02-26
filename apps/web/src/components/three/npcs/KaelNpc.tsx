import { NpcCharacter } from './NpcCharacter';
import { useVillageStore } from '../../../stores/villageStore';

export function KaelNpc() {
  const openOverlay = useVillageStore((s) => s.openOverlay);

  return (
    <NpcCharacter
      position={[9.5, 0, 4]}
      bodyColor="#dc2626"
      headColor="#d4a574"
      glowColor="#f97316"
      name="Kael"
      quote="Oh, you're here? I already cleared three quests today. But sure, take your time."
      onClick={() => openOverlay('/tavern')}
    >
      {/* Kael's body — cocky rival with red outfit */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.27, 0.65, 8, 16]} />
        <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.24, 16, 16]} />
        <meshStandardMaterial color="#c69c6d" roughness={0.7} />
      </mesh>

      {/* Spiky hair */}
      <mesh position={[0, 2.1, 0]} castShadow>
        <coneGeometry args={[0.15, 0.25, 5]} />
        <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
      </mesh>

      {/* Arms */}
      <mesh position={[-0.4, 0.9, 0]} rotation={[0, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.07, 0.45, 4, 8]} />
        <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
      </mesh>
      <mesh position={[0.4, 0.9, 0]} rotation={[0, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.07, 0.45, 4, 8]} />
        <meshStandardMaterial color="#8b1a1a" roughness={0.5} />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.13, 0.25, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.35, 4, 8]} />
        <meshStandardMaterial color="#4a1010" roughness={0.7} />
      </mesh>
      <mesh position={[0.13, 0.25, 0]} castShadow>
        <capsuleGeometry args={[0.09, 0.35, 4, 8]} />
        <meshStandardMaterial color="#4a1010" roughness={0.7} />
      </mesh>

      {/* Sword on back */}
      <group position={[-0.3, 1.2, -0.2]} rotation={[0.2, 0, 0.5]}>
        <mesh>
          <boxGeometry args={[0.05, 0.8, 0.02]} />
          <meshStandardMaterial color="#c0c0d0" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </NpcCharacter>
  );
}
