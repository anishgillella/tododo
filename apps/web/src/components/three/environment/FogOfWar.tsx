import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color } from 'three';
import type { Fog } from 'three';
import { useHollowStatus } from '../../../hooks/useBossFight';

/**
 * Dynamic fog that thickens with debt, emanating from the Rift Gate direction.
 *
 * dormant:       far fog, barely visible
 * whispers:      fog creeps closer
 * presence:      medium fog
 * confrontation: thick fog with red tint
 * forced:        heavy oppressive fog
 */

const FOG_CONFIG: Record<string, { near: number; far: number; color: string }> = {
  dormant:       { near: 30, far: 50, color: '#0a0a0f' },
  whispers:      { near: 25, far: 45, color: '#0a0a12' },
  presence:      { near: 18, far: 38, color: '#0f0a12' },
  confrontation: { near: 12, far: 30, color: '#120510' },
  forced:        { near: 8,  far: 22, color: '#0a0005' },
};

export function FogOfWar() {
  const { scene } = useThree();
  const targetColor = useRef(new Color('#0a0a0f'));
  const targetNear = useRef(30);
  const targetFar = useRef(50);

  const { data: hollow } = useHollowStatus();
  const stage = hollow?.stage ?? 'dormant';
  const config = FOG_CONFIG[stage] ?? FOG_CONFIG.dormant;

  targetColor.current.set(config.color);
  targetNear.current = config.near;
  targetFar.current = config.far;

  useFrame((_state, delta) => {
    const fog = scene.fog as Fog | null;
    if (!fog) return;

    // Smoothly transition fog
    fog.color.lerp(targetColor.current, delta * 0.5);
    fog.near += (targetNear.current - fog.near) * delta * 0.5;
    fog.far += (targetFar.current - fog.far) * delta * 0.5;
  });

  return null;
}
