import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import type { PointLight } from 'three';

interface DailyTransitionProps {
  active: boolean;
  onComplete: () => void;
}

/**
 * Cinematic "End Day" sequence:
 * 1. Screen dims
 * 2. Stars/sparkles rise
 * 3. Flash of light
 * 4. Returns to normal
 */

export function DailyTransition({ active, onComplete }: DailyTransitionProps) {
  const lightRef = useRef<PointLight>(null);
  const [phase, setPhase] = useState<'dim' | 'rise' | 'flash' | 'done'>('dim');

  useEffect(() => {
    if (!active) {
      setPhase('dim');
      return;
    }

    const t1 = setTimeout(() => setPhase('rise'), 800);
    const t2 = setTimeout(() => setPhase('flash'), 2500);
    const t3 = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active, onComplete]);

  useFrame((_state, delta) => {
    if (!lightRef.current) return;
    if (phase === 'flash') {
      lightRef.current.intensity = Math.max(0, lightRef.current.intensity - delta * 5);
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Rising sparkles during transition */}
      {(phase === 'rise' || phase === 'flash') && (
        <Sparkles
          count={100}
          scale={[20, 15, 20]}
          size={3}
          speed={4}
          opacity={0.8}
          color="#a78bfa"
        />
      )}

      {/* Flash light */}
      {phase === 'flash' && (
        <pointLight
          ref={lightRef}
          position={[0, 10, 0]}
          color="#fbbf24"
          intensity={15}
          distance={50}
        />
      )}

      {/* Overlay text */}
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <div className={`flex h-full items-center justify-center transition-opacity duration-700 ${
          phase === 'dim' ? 'opacity-0' : 'opacity-100'
        }`}>
          <div className={`text-center transition-all duration-500 ${
            phase === 'flash' ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
          }`}>
            <p className="font-display text-lg tracking-widest text-arcane-light uppercase">
              {phase === 'rise' ? 'Day Ends...' : 'A New Dawn'}
            </p>
          </div>
        </div>
      </Html>
    </group>
  );
}
