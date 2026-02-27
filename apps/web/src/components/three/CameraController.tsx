import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3, MathUtils } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useVillageStore } from '../../stores/villageStore';
import { usePlayerStore } from '../../stores/playerStore';

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraTarget = useVillageStore((s) => s.cameraTarget);
  const activeOverlay = useVillageStore((s) => s.activeOverlay);
  const playerPosition = usePlayerStore((s) => s.position);
  const targetVec = useRef(new Vector3(0, 0, 3));
  const isOverlayAnimating = useRef(false);

  // When overlay opens, zoom camera to building
  useEffect(() => {
    if (cameraTarget) {
      targetVec.current.set(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
      isOverlayAnimating.current = true;
    }
  }, [cameraTarget]);

  useFrame((_state, delta) => {
    if (!controlsRef.current) return;

    const controls = controlsRef.current;
    const current = controls.target;

    if (isOverlayAnimating.current) {
      // Animate to building target with smooth damping
      current.x = MathUtils.damp(current.x, targetVec.current.x, 4, delta);
      current.y = MathUtils.damp(current.y, targetVec.current.y, 4, delta);
      current.z = MathUtils.damp(current.z, targetVec.current.z, 4, delta);

      if (current.distanceTo(targetVec.current) < 0.1) {
        isOverlayAnimating.current = false;
      }
    } else if (!activeOverlay) {
      // Follow player position with smooth damping
      current.x = MathUtils.damp(current.x, playerPosition[0], 3, delta);
      current.z = MathUtils.damp(current.z, playerPosition[2], 3, delta);
      current.y = MathUtils.damp(current.y, 0, 3, delta);
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.5}
      minDistance={8}
      maxDistance={30}
      target={[0, 0, 3]}
    />
  );
}
