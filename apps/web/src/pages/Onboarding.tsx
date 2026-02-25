import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';

const TOTAL_STEPS = 5;

const DIFFICULTY_MODES = [
  {
    id: 'explorer',
    name: 'Explorer',
    description:
      'Relaxed mode. Lower penalties, more forgiving timelines. Perfect for building habits.',
    icon: '\u{1F30D}',
    accent: 'border-drift bg-drift/10 text-drift-light',
  },
  {
    id: 'drifter',
    name: 'Drifter',
    description:
      'Balanced challenge. Standard XP, gold, and consequences. The intended experience.',
    icon: '\u{2694}\u{FE0F}',
    accent: 'border-arcane bg-arcane/10 text-arcane-light',
  },
  {
    id: 'ironclad',
    name: 'Ironclad',
    description:
      'Hardcore mode. Harsh penalties, no safety nets. Debt spirals faster. For the relentless.',
    icon: '\u{1F480}',
    accent: 'border-rift bg-rift/10 text-rift-light',
  },
] as const;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

function ProgressDots({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 bg-arcane-light'
              : i < current
                ? 'w-2 bg-arcane/60'
                : 'w-2 bg-steel'
          }`}
          layout
        />
      ))}
    </div>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [username, setUsername] = useState('');
  const [difficulty, setDifficulty] = useState('drifter');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, string> = {
        username: username.trim() || 'Drifter',
        difficultyMode: difficulty,
      };
      if (apiKey.trim()) {
        payload.openrouterApiKey = apiKey.trim();
      }
      await api.put('/api/settings', payload);
      navigate('/command-deck', { replace: true });
    } catch {
      // Navigate anyway — settings can be configured later
      navigate('/command-deck', { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-void px-4 py-8">
      {/* Main content area */}
      <div className="w-full max-w-md flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="flex w-full flex-col items-center text-center"
            >
              {/* Decorative line */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '6rem' }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="mb-8 h-px bg-gradient-to-r from-transparent via-arcane to-transparent"
              />

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="font-display text-3xl font-bold tracking-widest text-parchment uppercase"
              >
                Welcome, Drifter
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="mt-4 max-w-sm text-sm leading-relaxed text-ash"
              >
                You have been chosen to pilot the Drifter&apos;s Log -- a
                gamified command system where tasks become missions, productivity
                becomes power, and procrastination has... consequences.
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mt-3 font-mono text-xs text-steel-light"
              >
                [SYSTEM v0.1.0 -- INITIALIZATION SEQUENCE]
              </motion.p>

              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '6rem' }}
                transition={{ delay: 1.0, duration: 0.6 }}
                className="mt-8 h-px bg-gradient-to-r from-transparent via-arcane to-transparent"
              />

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.4 }}
                whileTap={{ scale: 0.97 }}
                onClick={goNext}
                className="mt-8 rounded-xl border border-arcane bg-arcane/10 px-8 py-3 font-display text-sm tracking-wider text-arcane-light uppercase transition-colors hover:bg-arcane/20"
              >
                Begin Your Journey
              </motion.button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="name"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="flex w-full flex-col items-center text-center"
            >
              <h2 className="font-display text-xl font-bold tracking-widest text-parchment uppercase">
                Choose Your Callsign
              </h2>
              <p className="mt-2 text-sm text-ash">
                What shall the system address you as?
              </p>

              <div className="mt-8 w-full max-w-xs">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter callsign..."
                  maxLength={24}
                  className="w-full rounded-xl border border-steel bg-void-light px-5 py-3 text-center font-display text-lg tracking-wider text-parchment placeholder:text-steel-light focus:border-arcane focus:outline-none"
                  autoFocus
                />
                <p className="mt-2 font-mono text-xs text-steel-light">
                  Leave blank to remain &quot;Drifter&quot;
                </p>
              </div>

              <div className="mt-10 flex gap-3">
                <button
                  onClick={goBack}
                  className="rounded-lg border border-steel px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-ash transition-colors hover:border-steel-light hover:text-parchment"
                >
                  Back
                </button>
                <button
                  onClick={goNext}
                  className="rounded-lg border border-arcane bg-arcane/10 px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-arcane-light transition-colors hover:bg-arcane/20"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="difficulty"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="flex w-full flex-col items-center text-center"
            >
              <h2 className="font-display text-xl font-bold tracking-widest text-parchment uppercase">
                Choose Your Path
              </h2>
              <p className="mt-2 text-sm text-ash">
                How punishing should the drift be?
              </p>

              <div className="mt-6 flex w-full flex-col gap-3">
                {DIFFICULTY_MODES.map((mode) => {
                  const isSelected = difficulty === mode.id;
                  return (
                    <motion.button
                      key={mode.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setDifficulty(mode.id)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? mode.accent
                          : 'border-steel bg-void-light hover:border-steel-light'
                      }`}
                    >
                      <span className="mt-0.5 text-xl">{mode.icon}</span>
                      <div className="flex-1">
                        <h3
                          className={`font-display text-sm tracking-wider uppercase ${
                            isSelected ? '' : 'text-parchment'
                          }`}
                        >
                          {mode.name}
                        </h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-ash">
                          {mode.description}
                        </p>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current bg-current/20"
                        >
                          <div className="h-2 w-2 rounded-full bg-current" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={goBack}
                  className="rounded-lg border border-steel px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-ash transition-colors hover:border-steel-light hover:text-parchment"
                >
                  Back
                </button>
                <button
                  onClick={goNext}
                  className="rounded-lg border border-arcane bg-arcane/10 px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-arcane-light transition-colors hover:bg-arcane/20"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="apikey"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="flex w-full flex-col items-center text-center"
            >
              <h2 className="font-display text-xl font-bold tracking-widest text-parchment uppercase">
                Neural Link
              </h2>
              <p className="mt-2 text-sm text-ash">
                Connect an AI companion for dynamic narration and dialogue.
              </p>

              <div className="mt-6 w-full rounded-xl border border-steel bg-void-light p-4">
                <p className="mb-3 text-xs leading-relaxed text-ash">
                  Tododo uses{' '}
                  <span className="text-arcane-light">OpenRouter</span> for
                  AI-powered features: character dialogue, story narration, and
                  personalized recaps. This is entirely optional.
                </p>

                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-..."
                  className="w-full rounded-lg border border-steel bg-void px-4 py-2.5 font-mono text-sm text-parchment placeholder:text-steel-light focus:border-arcane focus:outline-none"
                />

                <p className="mt-2 text-xs text-steel-light">
                  Get a key at{' '}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-arcane-light underline underline-offset-2"
                  >
                    openrouter.ai/keys
                  </a>
                </p>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={goBack}
                  className="rounded-lg border border-steel px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-ash transition-colors hover:border-steel-light hover:text-parchment"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setApiKey('');
                    goNext();
                  }}
                  className="rounded-lg border border-steel px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-ash transition-colors hover:border-steel-light hover:text-parchment"
                >
                  Skip for Now
                </button>
                <button
                  onClick={goNext}
                  disabled={!apiKey.trim()}
                  className="rounded-lg border border-arcane bg-arcane/10 px-6 py-2.5 font-mono text-xs uppercase tracking-wider text-arcane-light transition-colors hover:bg-arcane/20 disabled:border-steel disabled:bg-transparent disabled:text-steel-light disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="ready"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="flex w-full flex-col items-center text-center"
            >
              {/* Arcane burst animation */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: 'easeOut' }}
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-arcane/30 bg-arcane/10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.4,
                    duration: 0.3,
                    type: 'spring',
                    stiffness: 300,
                  }}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-arcane/20"
                >
                  <span className="font-display text-2xl text-arcane-light">
                    T
                  </span>
                </motion.div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="font-display text-xl font-bold tracking-widest text-parchment uppercase"
              >
                Your Journey Begins
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="mt-3 max-w-xs text-sm text-ash"
              >
                Welcome aboard,{' '}
                <span className="font-display text-arcane-light">
                  {username.trim() || 'Drifter'}
                </span>
                . The Command Deck awaits. Your first missions will forge the
                path ahead.
              </motion.p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="mt-2 space-y-1"
              >
                <p className="font-mono text-xs text-steel-light">
                  Mode:{' '}
                  <span className="text-parchment capitalize">{difficulty}</span>
                </p>
                {apiKey.trim() && (
                  <p className="font-mono text-xs text-verdant-light">
                    Neural Link: Connected
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.4 }}
                className="mt-8 flex gap-3"
              >
                <button
                  onClick={goBack}
                  className="rounded-lg border border-steel px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-ash transition-colors hover:border-steel-light hover:text-parchment"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="rounded-xl border border-arcane bg-arcane/10 px-8 py-3 font-display text-sm tracking-wider text-arcane-light uppercase transition-colors hover:bg-arcane/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Initializing...' : 'Enter the Command Deck'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="mt-8 shrink-0">
        <ProgressDots current={step} total={TOTAL_STEPS} />
      </div>

      {/* Footer tag */}
      <p className="mt-4 font-mono text-[10px] text-steel-light">
        [ONBOARDING MODULE -- TODODO v0.1.0]
      </p>
    </div>
  );
}
