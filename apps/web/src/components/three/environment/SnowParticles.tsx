import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points } from 'three';

export function SnowParticles({ intensity = 0.5 }: { intensity?: number }) {
  const ref = useRef<Points>(null);
  const count = Math.floor(150 * intensity);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = Math.random() * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return arr;
  }, [count]);

  useFrame((_state, delta) => {
    if (!ref.current) return;
    const posAttr = ref.current.geometry.getAttribute('position');
    for (let i = 0; i < count; i++) {
      // Slow drift down + horizontal sway
      let y = posAttr.getY(i) - delta * 2 * (0.5 + intensity * 0.3);
      const x = posAttr.getX(i) + Math.sin(Date.now() * 0.001 + i) * delta * 0.3;
      if (y < 0) y = 18 + Math.random() * 2;
      posAttr.setXY(i, x, y);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#e0e8ff"
        size={0.1}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}
