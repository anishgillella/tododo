import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';

const DIFFICULTY_MODES = [
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Relaxed mode. Lower penalties, more forgiving timelines. Perfect for building habits.',
    icon: '\u{1F30D}',
  },
  {
    id: 'drifter',
    name: 'Drifter',
    description: 'Balanced challenge. Standard XP, gold, and consequences. The intended experience.',
    icon: '\u{2694}\u{FE0F}',
  },
  {
    id: 'ironclad',
    name: 'Ironclad',
    description: 'Hardcore mode. Harsh penalties, no safety nets. Debt spirals faster. For the relentless.',
    icon: '\u{1F480}',
  },
] as const;

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

function SectionHeader({ title, mono }: { title: string; mono: string }) {
  return (
    <div className="mb-3">
      <h2 className="font-display text-sm tracking-wider text-parchment uppercase">{title}</h2>
      <p className="font-mono text-[10px] text-steel-light">{mono}</p>
    </div>
  );
}

export function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  // Local form state
  const [username, setUsername] = useState('');
  const [difficultyMode, setDifficultyMode] = useState('drifter');
  const [apiKey, setApiKey] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  // Dirty tracking
  const [profileDirty, setProfileDirty] = useState(false);

  // Sync server state to local
  useEffect(() => {
    if (settings) {
      setUsername(settings.username ?? '');
      setDifficultyMode(settings.difficultyMode ?? 'drifter');
    }
  }, [settings]);

  const showToast = (t: ToastState) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = () => {
    updateSettings.mutate(
      { username },
      {
        onSuccess: () => {
          setProfileDirty(false);
          showToast({ type: 'success', message: 'Profile updated.' });
        },
        onError: (err) => {
          showToast({ type: 'error', message: err.message || 'Failed to update profile.' });
        },
      },
    );
  };

  const handleSaveDifficulty = (mode: string) => {
    setDifficultyMode(mode);
    updateSettings.mutate(
      { difficultyMode: mode },
      {
        onSuccess: () => {
          showToast({ type: 'success', message: `Difficulty set to ${mode}.` });
        },
        onError: (err) => {
          showToast({ type: 'error', message: err.message || 'Failed to update difficulty.' });
        },
      },
    );
  };

  const handleSetApiKey = () => {
    if (!apiKey.trim()) return;
    updateSettings.mutate(
      { openrouterApiKey: apiKey.trim() },
      {
        onSuccess: () => {
          setApiKey('');
          showToast({ type: 'success', message: 'API key configured.' });
        },
        onError: (err) => {
          showToast({ type: 'error', message: err.message || 'Failed to set API key.' });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-screen items-center justify-center"
      >
        <p className="font-mono text-xs text-steel-light">Loading configuration...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col px-4 pt-6 pb-8"
    >
      {/* Header */}
      <header className="mb-8 shrink-0">
        <h1 className="font-display text-2xl font-bold tracking-widest text-parchment uppercase">
          Settings
        </h1>
        <p className="mt-1 font-mono text-sm tracking-wide text-ash">
          // System Configuration
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-ash via-steel to-transparent" />
      </header>

      <div className="flex flex-col gap-8">
        {/* ─── Profile ─── */}
        <section>
          <SectionHeader title="Profile" mono="// Identity & callsign" />
          <div className="rounded-xl border border-steel bg-void-light p-4">
            <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ash">
              Username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setProfileDirty(true);
                }}
                placeholder="Enter callsign..."
                className="flex-1 rounded-lg border border-steel bg-void px-4 py-2.5 text-sm text-parchment placeholder:text-steel-light focus:border-arcane focus:outline-none"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveProfile}
                disabled={!profileDirty || updateSettings.isPending}
                className="rounded-lg border border-arcane bg-arcane/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-arcane-light transition-colors hover:bg-arcane/20 disabled:border-steel disabled:bg-transparent disabled:text-steel-light disabled:opacity-50"
              >
                Save
              </motion.button>
            </div>
          </div>
        </section>

        {/* ─── Difficulty Mode ─── */}
        <section>
          <SectionHeader title="Difficulty Mode" mono="// How punishing is the drift?" />
          <div className="flex flex-col gap-2">
            {DIFFICULTY_MODES.map((mode) => {
              const isSelected = difficultyMode === mode.id;
              return (
                <motion.button
                  key={mode.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSaveDifficulty(mode.id)}
                  disabled={updateSettings.isPending}
                  className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-arcane bg-arcane/10'
                      : 'border-steel bg-void-light hover:border-steel-light hover:bg-void-lighter'
                  }`}
                >
                  <span className="mt-0.5 text-xl">{mode.icon}</span>
                  <div className="flex-1">
                    <h3
                      className={`font-display text-sm tracking-wider uppercase ${
                        isSelected ? 'text-arcane-light' : 'text-parchment'
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
                      className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-arcane bg-arcane/20"
                    >
                      <div className="h-2 w-2 rounded-full bg-arcane-light" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* ─── AI Companion ─── */}
        <section>
          <SectionHeader title="AI Companion" mono="// Connect the neural link" />
          <div className="rounded-xl border border-steel bg-void-light p-4">
            {settings?.hasApiKey && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-verdant/30 bg-verdant/5 px-3 py-2">
                <span className="text-verdant-light text-xs">{'\u2713'}</span>
                <p className="font-mono text-xs text-verdant-light">Key configured</p>
              </div>
            )}

            <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ash">
              OpenRouter API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings?.hasApiKey ? '••••••••••••' : 'sk-or-...'}
                className="flex-1 rounded-lg border border-steel bg-void px-4 py-2.5 font-mono text-sm text-parchment placeholder:text-steel-light focus:border-arcane focus:outline-none"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSetApiKey}
                disabled={!apiKey.trim() || updateSettings.isPending}
                className="rounded-lg border border-arcane bg-arcane/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-arcane-light transition-colors hover:bg-arcane/20 disabled:border-steel disabled:bg-transparent disabled:text-steel-light disabled:opacity-50"
              >
                Set Key
              </motion.button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-ash">
              Get an API key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-arcane-light underline underline-offset-2 hover:text-arcane"
              >
                openrouter.ai/keys
              </a>
              . This enables AI-powered dialogue, narration, and dynamic story generation.
              Without a key, fallback responses will be used.
            </p>
          </div>
        </section>

        {/* ─── About ─── */}
        <section>
          <SectionHeader title="About" mono="// System manifest" />
          <div className="rounded-xl border border-steel bg-void-light p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-ash">
                  Version
                </span>
                <span className="font-mono text-xs text-parchment">0.1.0-alpha</span>
              </div>
              <div className="h-px bg-steel" />
              <p className="text-xs leading-relaxed text-ash">
                <span className="font-display text-parchment">Tododo</span> is a gamified task
                manager set in a sci-fantasy universe. Complete missions, earn XP, level up your
                agent, and survive the consequences of procrastination. AI companions narrate your
                journey through the Drift.
              </p>
              <div className="h-px bg-steel" />
              <p className="text-center font-mono text-[10px] text-steel-light">
                [MODULE v0.1.0 -- CONFIGURATION SUBSYSTEM]
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          >
            <div
              className={`rounded-lg border px-5 py-2.5 font-mono text-xs ${
                toast.type === 'success'
                  ? 'border-verdant/30 bg-verdant/10 text-verdant-light'
                  : 'border-rift/30 bg-rift/10 text-rift-light'
              }`}
            >
              {toast.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
