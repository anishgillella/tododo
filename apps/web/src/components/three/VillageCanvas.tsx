import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { VillageScene } from './VillageScene';
import { CameraController } from './CameraController';
import { PostProcessingStack } from './effects/PostProcessingStack';
import { useVillageStore } from '../../stores/villageStore';

export function VillageCanvas() {
  const activeOverlay = useVillageStore((s) => s.activeOverlay);
  const paused = activeOverlay !== null;

  return (
    <div
      className="three-canvas"
      style={{ pointerEvents: paused ? 'none' : 'auto' }}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop={paused ? 'demand' : 'always'}
        camera={{ position: [0, 15, 20], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 25, 50]} />
        <Suspense fallback={null}>
          <VillageScene />
          <PostProcessingStack />
        </Suspense>
        <CameraController />
      </Canvas>
    </div>
  );
}
