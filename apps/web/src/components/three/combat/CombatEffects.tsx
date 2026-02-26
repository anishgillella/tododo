import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import type { Mesh, PointLight } from 'three';

interface CombatEffectsProps {
  phase: 'intro' | 'fighting' | 'result';
  victory?: boolean;
}

export function CombatEffects({ phase, victory }: CombatEffectsProps) {
  return (
    <group>
      {/* Fight slash effects */}
      {phase === 'fighting' && <SlashEffects />}

      {/* Victory explosion */}
      {phase === 'result' && victory && <VictoryBurst />}

      {/* Defeat darkness */}
      {phase === 'result' && !victory && <DefeatDarkness />}
    </group>
  );
}

function SlashEffects() {
  const [slashes, setSlashes] = useState<number[]>([]);

  useEffect(() => {
    let id = 0;
    const interval = setInterval(() => {
      setSlashes((prev) => [...prev.slice(-4), id++]);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <group>
      {slashes.map((key) => (
        <SlashArc key={key} />
      ))}
    </group>
  );
}

function SlashArc() {
  const ref = useRef<Mesh>(null);
  const life = useRef(1.0);

  useFrame((_state, delta) => {
    if (!ref.current) return;
    life.current -= delta * 2;
    const mat = ref.current.material as { opacity: number };
    mat.opacity = Math.max(0, life.current);
    ref.current.scale.x += delta * 4;
    ref.current.scale.y += delta * 4;
  });

  const x = (Math.random() - 0.5) * 2;
  const y = 1 + Math.random() * 2;

  return (
    <mesh ref={ref} position={[x, y, 2]} rotation={[0, 0, Math.random() * Math.PI]}>
      <ringGeometry args={[0.3, 0.5, 3, 1, 0, Math.PI]} />
      <meshBasicMaterial color="#a78bfa" transparent opacity={1} depthWrite={false} />
    </mesh>
  );
}

function VictoryBurst() {
  const lightRef = useRef<PointLight>(null);

  useFrame((_state, delta) => {
    if (!lightRef.current) return;
    lightRef.current.intensity = Math.max(0, lightRef.current.intensity - delta * 3);
  });

  return (
    <group position={[0, 2, 0]}>
      <Sparkles
        count={80}
        scale={[8, 8, 8]}
        size={5}
        speed={3}
        opacity={0.9}
        color="#fbbf24"
      />
      <pointLight ref={lightRef} color="#fbbf24" intensity={10} distance={15} />
    </group>
  );
}

function DefeatDarkness() {
  const lightRef = useRef<PointLight>(null);

  useFrame((state) => {
    if (!lightRef.current) return;
    lightRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 3) * 1;
  });

  return (
    <group position={[0, 2, 0]}>
      <Sparkles
        count={40}
        scale={[6, 6, 6]}
        size={3}
        speed={0.5}
        opacity={0.7}
        color="#ef4444"
      />
      <pointLight ref={lightRef} color="#ef4444" intensity={2} distance={10} />
    </group>
  );
}
