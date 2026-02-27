import { useEffect, useRef } from 'react';
import { useVillageStore } from '../stores/villageStore';

const MOVE_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);

/**
 * Track WASD / arrow key presses. Returns a ref containing the current velocity vector.
 * Disabled when an overlay is open.
 */
export function useKeyboardMovement() {
  const keysPressed = useRef(new Set<string>());
  const velocity = useRef({ x: 0, z: 0 });
  const activeOverlay = useVillageStore((s) => s.activeOverlay);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (MOVE_KEYS.has(key)) {
        e.preventDefault();
        keysPressed.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current.delete(key);
    };

    // Clear keys on blur
    const handleBlur = () => {
      keysPressed.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Update velocity from current keys
  const getVelocity = () => {
    // Disable movement when overlay is open
    if (activeOverlay) {
      return { x: 0, z: 0 };
    }

    const keys = keysPressed.current;
    let x = 0;
    let z = 0;

    if (keys.has('w') || keys.has('arrowup')) z -= 1;
    if (keys.has('s') || keys.has('arrowdown')) z += 1;
    if (keys.has('a') || keys.has('arrowleft')) x -= 1;
    if (keys.has('d') || keys.has('arrowright')) x += 1;

    // Normalize diagonal movement
    if (x !== 0 && z !== 0) {
      const len = Math.sqrt(x * x + z * z);
      x /= len;
      z /= len;
    }

    velocity.current.x = x;
    velocity.current.z = z;
    return velocity.current;
  };

  return { getVelocity };
}
