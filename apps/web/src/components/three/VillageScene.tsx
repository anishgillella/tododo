import { useMemo } from 'react';
import { Ground } from './Ground';
import { Building } from './Building';
import { AmbientParticles } from './AmbientParticles';
import { RiftGateBuilding } from './RiftGateBuilding';
import { Tree } from './Tree';
import { VillageHud } from './VillageHud';
import { MovablePlayer } from './character/MovablePlayer';
import { LevelUpEffect } from './character/LevelUpEffect';
import { GroundClickTarget } from './GroundClickTarget';
import { AxiomNpc } from './npcs/AxiomNpc';
import { KaelNpc } from './npcs/KaelNpc';
import { MiraNpc } from './npcs/MiraNpc';
import { HollowNpc } from './npcs/HollowNpc';
import { MissionCompleteEffect } from './effects/MissionCompleteEffect';
import { ComboCounter3D } from './effects/ComboCounter3D';
import { OverdriveAura } from './effects/OverdriveAura';
import { HollowCorruption } from './effects/HollowCorruption';
import { SkySystem } from './environment/SkySystem';
import { WeatherSystem } from './environment/WeatherSystem';
import { FogOfWar } from './environment/FogOfWar';
import { VillageDecay } from './environment/VillageDecay';
import { VillageFlourish } from './environment/VillageFlourish';
import { BuildingUpgrade } from './buildings/BuildingUpgrade';
import { QuestMarkers } from './ui/QuestMarkers';
import { useWeatherStore } from '../../stores/weatherStore';

const BUILDINGS = [
  {
    name: 'Guild Hall',
    route: '/command-deck' as const,
    position: [0, 0, 0] as [number, number, number],
    color: '#7c3aed',
    size: [3, 3, 3] as [number, number, number],
  },
  {
    name: 'Twilight Hearth',
    route: '/tavern' as const,
    position: [-8, 0, 3] as [number, number, number],
    color: '#f59e0b',
  },
  {
    name: 'Training Yard',
    route: '/training-grounds' as const,
    position: [8, 0, 3] as [number, number, number],
    color: '#10b981',
  },
  {
    name: "Blacksmith's Forge",
    route: '/forge' as const,
    position: [-6, 0, -5] as [number, number, number],
    color: '#f59e0b',
  },
  {
    name: "Chronicler's Tower",
    route: '/daily-recap' as const,
    position: [6, 0, -5] as [number, number, number],
    color: '#06b6d4',
    size: [1.8, 4, 1.8] as [number, number, number],
  },
  {
    name: "Elder's Study",
    route: '/settings' as const,
    position: [10, 0, -2] as [number, number, number],
    color: '#3a3a52',
  },
];

const TREES = [
  [-4, 0, 5],
  [4, 0, 6],
  [-12, 0, -2],
  [13, 0, 2],
  [-10, 0, -8],
  [12, 0, -8],
  [-3, 0, -9],
  [3, 0, -8],
  [-14, 0, 5],
  [14, 0, 6],
  [-8, 0, -10],
  [9, 0, -10],
] as [number, number, number][];

const TIME_LIGHT_SETTINGS: Record<string, { intensity: number; color: string; ambientIntensity: number }> = {
  morning: { intensity: 0.9, color: '#ffcc88', ambientIntensity: 0.35 },
  midday:  { intensity: 1.2, color: '#ffffff', ambientIntensity: 0.4 },
  evening: { intensity: 0.8, color: '#ff8844', ambientIntensity: 0.3 },
  night:   { intensity: 0.3, color: '#4466aa', ambientIntensity: 0.2 },
};

export function VillageScene() {
  const timeOfDay = useWeatherStore((s) => s.timeOfDay);
  const lightSettings = TIME_LIGHT_SETTINGS[timeOfDay] ?? TIME_LIGHT_SETTINGS.midday;

  const buildingBounds = useMemo(() => BUILDINGS.map((b) => ({
    position: b.position,
    size: b.size ?? [2, 2.5, 2] as [number, number, number],
    route: b.route,
    name: b.name,
  })), []);

  return (
    <>
      {/* Sky dome — changes color based on hollow stage + streak + time */}
      <SkySystem />

      {/* Lighting — adjusted by time of day */}
      <ambientLight intensity={lightSettings.ambientIntensity} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={lightSettings.intensity}
        color={lightSettings.color}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#7c3aed" />

      {/* Dynamic fog — thickens with debt */}
      <FogOfWar />

      {/* Ground */}
      <Ground />

      {/* Environmental state */}
      <VillageDecay />
      <VillageFlourish />
      <WeatherSystem />

      {/* Buildings */}
      {BUILDINGS.map((b) => (
        <Building key={b.name} {...b} />
      ))}

      {/* Rift Gate — special torus building */}
      <RiftGateBuilding />

      {/* Building upgrades (level-based visual tiers) */}
      <BuildingUpgrade />

      {/* Quest markers over buildings */}
      <QuestMarkers />

      {/* Trees */}
      {TREES.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}

      {/* Click-to-move ground target */}
      <GroundClickTarget />

      {/* Player character — movable via WASD/click */}
      <MovablePlayer buildingBounds={buildingBounds} />

      {/* NPCs */}
      <AxiomNpc />
      <KaelNpc />
      <MiraNpc />
      <HollowNpc />

      {/* Visual effects */}
      <MissionCompleteEffect />
      <LevelUpEffect />
      <ComboCounter3D />
      <OverdriveAura />
      <HollowCorruption />

      {/* Firefly particles */}
      <AmbientParticles />

      {/* HUD overlay */}
      <VillageHud />
    </>
  );
}
