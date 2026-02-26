import { Sparkles } from '@react-three/drei';

export function AmbientParticles() {
  return (
    <Sparkles
      count={60}
      scale={[30, 10, 30]}
      size={2}
      speed={0.3}
      opacity={0.5}
      color="#fbbf24"
    />
  );
}
