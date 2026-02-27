import { Ground } from './Ground';
import { Building } from './Building';
import { RiftGateBuilding } from './RiftGateBuilding';
import { Tree } from './Tree';
import { SkySystem } from './environment/SkySystem';
import { AmbientParticles } from './AmbientParticles';
import { CameraRail, type CameraKeyframe } from './CameraRail';

const BUILDINGS = [
  { name: 'Guild Hall', route: '/command-deck' as const, position: [0, 0, 0] as [number, number, number], color: '#7c3aed', size: [3, 3, 3] as [number, number, number] },
  { name: 'Twilight Hearth', route: '/tavern' as const, position: [-8, 0, 3] as [number, number, number], color: '#f59e0b' },
  { name: 'Training Yard', route: '/training-grounds' as const, position: [8, 0, 3] as [number, number, number], color: '#10b981' },
  { name: "Blacksmith's Forge", route: '/forge' as const, position: [-6, 0, -5] as [number, number, number], color: '#f59e0b' },
  { name: "Chronicler's Tower", route: '/daily-recap' as const, position: [6, 0, -5] as [number, number, number], color: '#06b6d4', size: [1.8, 4, 1.8] as [number, number, number] },
  { name: "Elder's Study", route: '/settings' as const, position: [10, 0, -2] as [number, number, number], color: '#3a3a52' },
];

const TREES = [
  [-4, 0, 5], [4, 0, 6], [-12, 0, -2], [13, 0, 2],
  [-10, 0, -8], [12, 0, -8], [-3, 0, -9], [3, 0, -8],
  [-14, 0, 5], [14, 0, 6], [-8, 0, -10], [9, 0, -10],
] as [number, number, number][];

/**
 * Camera flythrough keyframes:
 * 1. High aerial overview
 * 2. Swoop down to Guild Hall
 * 3. Pan to Twilight Hearth
 * 4. Sweep to Training Yard
 * 5. Visit the Rift Gate
 * 6. Circle to starting position
 */
const FLYTHROUGH_KEYFRAMES: CameraKeyframe[] = [
  { position: [0, 25, 30], lookAt: [0, 0, 0], duration: 1 },        // Start high
  { position: [5, 12, 15], lookAt: [0, 2, 0], duration: 3 },        // Swoop down
  { position: [2, 5, 5], lookAt: [0, 1.5, 0], duration: 3 },        // Guild Hall
  { position: [-6, 4, 8], lookAt: [-8, 1.5, 3], duration: 3 },      // Twilight Hearth
  { position: [10, 4, 8], lookAt: [8, 1.5, 3], duration: 3 },       // Training Yard
  { position: [-4, 6, -8], lookAt: [-4, 1, -6], duration: 3 },      // Rift Gate area
  { position: [0, 8, 12], lookAt: [0, 1, 0], duration: 3 },         // Final overview
];

interface OnboardingSceneProps {
  playing: boolean;
  onFlythroughComplete: () => void;
  onKeyframeReached: (index: number) => void;
}

export function OnboardingScene({ playing, onFlythroughComplete, onKeyframeReached }: OnboardingSceneProps) {
  return (
    <>
      <SkySystem />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={1.1}
        color="#ffffff"
        castShadow
      />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#7c3aed" />

      <Ground />

      {BUILDINGS.map((b) => (
        <Building key={b.name} {...b} />
      ))}

      <RiftGateBuilding />

      {TREES.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}

      <AmbientParticles />

      <CameraRail
        keyframes={FLYTHROUGH_KEYFRAMES}
        playing={playing}
        onComplete={onFlythroughComplete}
        onKeyframeReached={onKeyframeReached}
      />
    </>
  );
}
