import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface CameraKeyframe {
  position: [number, number, number];
  lookAt: [number, number, number];
  duration: number; // seconds to travel to this keyframe
}

interface CameraRailProps {
  keyframes: CameraKeyframe[];
  playing: boolean;
  onComplete?: () => void;
  onKeyframeReached?: (index: number) => void;
}

/**
 * Keyframe-based camera path interpolation.
 * Smoothly moves the camera through a sequence of positions.
 */
export function CameraRail({ keyframes, playing, onComplete, onKeyframeReached }: CameraRailProps) {
  const progressRef = useRef(0);
  const currentKeyframeRef = useRef(0);
  const completedRef = useRef(false);
  const lastReportedRef = useRef(-1);

  useFrame(({ camera }, delta) => {
    if (!playing || keyframes.length < 2 || completedRef.current) return;

    const idx = currentKeyframeRef.current;
    if (idx >= keyframes.length - 1) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return;
    }

    const from = keyframes[idx];
    const to = keyframes[idx + 1];
    const duration = to.duration;

    progressRef.current += delta / duration;

    // Smooth easing (ease in-out cubic)
    const t = Math.min(progressRef.current, 1);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Interpolate position
    const pos = new THREE.Vector3(
      THREE.MathUtils.lerp(from.position[0], to.position[0], eased),
      THREE.MathUtils.lerp(from.position[1], to.position[1], eased),
      THREE.MathUtils.lerp(from.position[2], to.position[2], eased),
    );
    camera.position.copy(pos);

    // Interpolate lookAt
    const look = new THREE.Vector3(
      THREE.MathUtils.lerp(from.lookAt[0], to.lookAt[0], eased),
      THREE.MathUtils.lerp(from.lookAt[1], to.lookAt[1], eased),
      THREE.MathUtils.lerp(from.lookAt[2], to.lookAt[2], eased),
    );
    camera.lookAt(look);

    // Report keyframe reached
    if (idx !== lastReportedRef.current) {
      lastReportedRef.current = idx;
      onKeyframeReached?.(idx);
    }

    // Move to next keyframe
    if (t >= 1) {
      progressRef.current = 0;
      currentKeyframeRef.current = idx + 1;

      // Report the arrival at the destination keyframe
      if (idx + 1 < keyframes.length) {
        onKeyframeReached?.(idx + 1);
      }
    }
  });

  return null;
}
