import { useRef, useEffect } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useVillageStore } from '../../stores/villageStore';

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraTarget = useVillageStore((s) => s.cameraTarget);
  const targetVec = useRef(new Vector3(0, 0, 0));
  const isAnimating = useRef(false);

  useEffect(() => {
    if (cameraTarget) {
      targetVec.current.set(cameraTarget[0], cameraTarget[1], cameraTarget[2]);
      isAnimating.current = true;
    }
  }, [cameraTarget]);

  useFrame(() => {
    if (!controlsRef.current || !isAnimating.current) return;

    const controls = controlsRef.current;
    const current = controls.target;
    current.lerp(targetVec.current, 0.05);
    controls.update();

    if (current.distanceTo(targetVec.current) < 0.1) {
      isAnimating.current = false;
    }
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
      target={[0, 0, 0]}
    />
  );
}
