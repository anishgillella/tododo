import { useState, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { api } from '../lib/api';

const OnboardingScene = lazy(() =>
  import('../components/three/OnboardingScene').then((m) => ({
    default: m.OnboardingScene,
  })),
);

/**
 * 6-stage guided onboarding:
 * 0. Welcome splash — "Welcome to Drifthollow"
 * 1. Camera flythrough begins — aerial village tour
 * 2. Guild Hall intro — "This is the Guild Hall"
 * 3. Tavern intro — "Meet the villagers"
 * 4. Training Yard intro — "Train your skills"
 * 5. Create first quest prompt
 * 6. Complete → transition to village
 */

const STAGE_TEXT = [
  {
    title: 'Welcome to Drifthollow',
    subtitle: 'A village at the edge of a magical rift',
    body: 'Your productivity shapes this world. Complete quests to push back The Hollow. Neglect them, and darkness grows.',
    button: 'Begin Tour',
  },
  {
    title: 'The Village Awakens',
    subtitle: 'Taking flight over Drifthollow...',
    body: null,
    button: null,
  },
  {
    title: 'The Guild Hall',
    subtitle: 'Your command center',
    body: 'Create and manage quests here. Each task becomes a mission with XP, gold, and narrative rewards.',
    button: 'Continue',
  },
  {
    title: 'The Twilight Hearth',
    subtitle: 'Where stories are told',
    body: 'Talk to Axiom, Kael, and Mira. Each character has a unique personality and remembers your conversations.',
    button: 'Continue',
  },
  {
    title: 'The Training Yard',
    subtitle: 'Forge your strength',
    body: 'Level up skills, build streaks, and unlock abilities. Consistency is your greatest weapon.',
    button: 'Continue',
  },
  {
    title: 'Your First Quest',
    subtitle: 'Every journey begins with a single step',
    body: 'Head to the Guild Hall and create your first quest. Walk with WASD, approach buildings, and press E to enter.',
    button: 'Enter Drifthollow',
  },
];

export function InteractiveOnboarding() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);
  const [flyPlaying, setFlyPlaying] = useState(false);
  const [username, setUsername] = useState('');
  const [difficulty, setDifficulty] = useState('drifter');
  const [showSetup, setShowSetup] = useState(false);

  const handleButtonClick = useCallback(async () => {
    if (stage === 0) {
      // Start flythrough
      setStage(1);
      setFlyPlaying(true);
    } else if (stage < 5) {
      setStage((s) => s + 1);
    } else {
      // Final stage — show quick setup then enter village
      if (!showSetup) {
        setShowSetup(true);
        return;
      }
      // Save settings and enter
      try {
        await api.put('/api/settings', {
          username: username.trim() || 'Drifter',
          difficultyMode: difficulty,
        });
      } catch {
        // Navigate anyway
      }
      navigate('/world', { replace: true });
    }
  }, [stage, showSetup, username, difficulty, navigate]);

  const handleFlythroughComplete = useCallback(() => {
    setFlyPlaying(false);
    setStage(5);
  }, []);

  const handleKeyframeReached = useCallback((index: number) => {
    // Map keyframes to stages: keyframe 2 → Guild Hall (stage 2), 3 → Tavern (stage 3), 4 → Training (stage 4)
    if (index === 2) setStage(2);
    else if (index === 3) setStage(3);
    else if (index === 4) setStage(4);
  }, []);

  const currentText = STAGE_TEXT[stage];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-void">
      {/* 3D Canvas background */}
      <div className="absolute inset-0">
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <div className="font-display text-sm tracking-wider text-arcane-light animate-pulse">
                Awakening Drifthollow...
              </div>
            </div>
          }
        >
          <Canvas shadows camera={{ position: [0, 25, 30], fov: 55 }}>
            <OnboardingScene
              playing={flyPlaying}
              onFlythroughComplete={handleFlythroughComplete}
              onKeyframeReached={handleKeyframeReached}
            />
          </Canvas>
        </Suspense>
      </div>

      {/* Gradient overlay for text readability */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/90 via-void/30 to-transparent" />

      {/* Text overlay */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-12 px-6 pointer-events-none">
        <AnimatePresence mode="wait">
          {currentText && (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center text-center max-w-md pointer-events-auto"
            >
              <h1 className="font-display text-2xl tracking-widest text-parchment uppercase">
                {currentText.title}
              </h1>
              <p className="mt-1 font-mono text-xs text-arcane-light tracking-wider">
                {currentText.subtitle}
              </p>
              {currentText.body && (
                <p className="mt-4 text-sm leading-relaxed text-ash">
                  {currentText.body}
                </p>
              )}

              {/* Quick setup form on final stage */}
              {showSetup && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 w-full max-w-xs space-y-3"
                >
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your callsign..."
                    maxLength={24}
                    className="w-full rounded-lg border border-steel bg-void-light/80 px-4 py-2 text-center font-display text-sm tracking-wider text-parchment placeholder:text-steel-light focus:border-arcane focus:outline-none backdrop-blur-sm"
                  />
                  <div className="flex gap-2 justify-center">
                    {(['explorer', 'drifter', 'ironclad'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`rounded-lg border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                          difficulty === d
                            ? 'border-arcane bg-arcane/20 text-arcane-light'
                            : 'border-steel text-ash hover:border-steel-light'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {currentText.button && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  onClick={handleButtonClick}
                  className="mt-6 rounded-xl border border-arcane bg-arcane/10 px-8 py-3 font-display text-sm tracking-wider text-arcane-light uppercase transition-colors hover:bg-arcane/20 backdrop-blur-sm"
                >
                  {showSetup ? 'Enter Drifthollow' : currentText.button}
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage dots */}
        <div className="mt-6 flex gap-2">
          {STAGE_TEXT.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stage
                  ? 'w-5 bg-arcane-light'
                  : i < stage
                    ? 'w-1.5 bg-arcane/50'
                    : 'w-1.5 bg-steel/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Skip button */}
      <button
        onClick={() => navigate('/world', { replace: true })}
        className="absolute top-6 right-6 font-mono text-xs text-steel-light hover:text-parchment transition-colors"
      >
        Skip
      </button>
    </div>
  );
}
