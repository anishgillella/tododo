import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

interface BattleCameraProps {
  phase: 'intro' | 'fighting' | 'result';
  victory?: boolean;
}

const CAMERA_POSITIONS = {
  intro:   new Vector3(0, 4, 10),
  fighting: new Vector3(0, 3, 8),
  victory: new Vector3(0, 5, 6),
  defeat:  new Vector3(0, 2, 9),
};

const LOOK_AT = new Vector3(0, 1.5, 0);

export function BattleCamera({ phase, victory }: BattleCameraProps) {
  const { camera } = useThree();
  const targetPos = useRef(new Vector3());
  const shakeIntensity = useRef(0);

  useEffect(() => {
    if (phase === 'intro') {
      targetPos.current.copy(CAMERA_POSITIONS.intro);
    } else if (phase === 'fighting') {
      targetPos.current.copy(CAMERA_POSITIONS.fighting);
      shakeIntensity.current = 0.15;
    } else if (phase === 'result') {
      targetPos.current.copy(victory ? CAMERA_POSITIONS.victory : CAMERA_POSITIONS.defeat);
      shakeIntensity.current = 0;
    }
  }, [phase, victory]);

  useFrame((_state, delta) => {
    // Smooth camera movement
    camera.position.lerp(targetPos.current, delta * 2);
    camera.lookAt(LOOK_AT);

    // Camera shake during fighting
    if (shakeIntensity.current > 0) {
      camera.position.x += (Math.random() - 0.5) * shakeIntensity.current;
      camera.position.y += (Math.random() - 0.5) * shakeIntensity.current * 0.5;
      shakeIntensity.current = Math.max(0, shakeIntensity.current - delta * 0.05);
    }
  });

  return null;
}
