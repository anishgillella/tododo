import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import { useHollowStatus } from '../../../hooks/useBossFight';
import { useAgent } from '../../../hooks/useAgent';

/**
 * Post-processing effects that respond to game state:
 * - Bloom: always on (subtle), stronger during streak
 * - Vignette: stronger during high debt
 * - Chromatic Aberration: during confrontation/forced stages (0 offset otherwise)
 */

export function PostProcessingStack() {
  const { data: hollow } = useHollowStatus();
  const { data: agent } = useAgent();

  const stage = hollow?.stage ?? 'dormant';
  const streakTier = agent?.streakTier ?? 'none';

  // Bloom intensity scales with streak
  const streakBoost =
    streakTier === 'eternal_fire' ? 0.8 :
    streakTier === 'inferno' ? 0.6 :
    streakTier === 'blaze' ? 0.4 :
    streakTier === 'flame' ? 0.25 :
    0.15;

  // Vignette darkness scales with debt
  const vignette =
    stage === 'forced' ? 0.7 :
    stage === 'confrontation' ? 0.55 :
    stage === 'presence' ? 0.4 :
    stage === 'whispers' ? 0.3 :
    0.2;

  // Chromatic aberration — 0 offset when inactive, visible during confrontation+
  const aberrationOffset =
    stage === 'forced' ? 0.003 :
    stage === 'confrontation' ? 0.0015 :
    0;

  return (
    <EffectComposer>
      <Bloom
        intensity={streakBoost}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={vignette}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={new Vector2(aberrationOffset, aberrationOffset)}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
    </EffectComposer>
  );
}
