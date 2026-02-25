import { useState, useEffect, useCallback } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const navItems = [
  { to: '/command-deck', label: 'Deck', icon: '\u{1F3AF}' },
  { to: '/tavern', label: 'Tavern', icon: '\u{1F37A}' },
  { to: '/training-grounds', label: 'Train', icon: '\u{2694}\u{FE0F}' },
  { to: '/forge', label: 'Forge', icon: '\u{1F528}' },
  { to: '/rift-gate', label: 'Rift', icon: '\u{1F300}' },
  { to: '/daily-recap', label: 'Recap', icon: '\u{1F4DC}' },
  { to: '/settings', label: 'Config', icon: '\u{2699}\u{FE0F}' },
];

const AXIOM_GREETINGS = [
  'The void does not forget. Neither should you.',
  'Every task completed is a rune inscribed against entropy.',
  'Discipline is the bridge between goals and accomplishment.',
  'The Drift rewards those who persist.',
  'Your streak is your shield. Guard it well.',
  'Even the smallest mission moves the needle.',
  'Rest is earned, not stolen.',
  'The Command Deck awaits your orders.',
  'Gold flows to those who finish what they start.',
  'XP is the measure of action, not intention.',
  'A missed deadline casts a long shadow.',
  'The Ironclad path is not for the faint of heart.',
  'Fortune favors the bold -- and the organized.',
  'Your future self will thank you.',
  'In the Drift, consistency is the ultimate weapon.',
];

function AxiomPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [greeting, setGreeting] = useState('');

  const pickGreeting = useCallback(() => {
    const idx = Math.floor(Math.random() * AXIOM_GREETINGS.length);
    setGreeting(AXIOM_GREETINGS[idx]);
  }, []);

  useEffect(() => {
    pickGreeting();
  }, [pickGreeting]);

  return (
    <div className="fixed top-3 right-3 z-40">
      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (!isOpen) pickGreeting();
          setIsOpen((o) => !o);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-steel bg-void-light/90 text-xs text-arcane-light backdrop-blur-sm transition-colors hover:border-arcane/50 hover:bg-void-lighter"
        title="AXIOM"
      >
        <span className="font-display text-[10px] font-bold">A</span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-10 right-0 w-64 rounded-xl border border-steel bg-void-light/95 p-3 shadow-lg backdrop-blur-md"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-display text-[10px] tracking-widest text-arcane-light uppercase">
                Axiom
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-steel-light transition-colors hover:text-parchment"
              >
                {'\u2715'}
              </button>
            </div>
            <p className="text-xs leading-relaxed text-ash italic">
              &quot;{greeting}&quot;
            </p>
            <div className="mt-2 h-px bg-gradient-to-r from-arcane/30 to-transparent" />
            <button
              onClick={pickGreeting}
              className="mt-1.5 font-mono text-[10px] text-steel-light transition-colors hover:text-arcane-light"
            >
              [another]
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-void">
      {/* AXIOM greeting panel */}
      <AxiomPanel />

      {/* Main content area -- leaves room for the bottom nav */}
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-steel bg-void-light/95 backdrop-blur-md">
        <ul className="mx-auto flex max-w-lg items-center justify-around overflow-x-auto px-1 py-1 scrollbar-none">
          {navItems.map((item) => (
            <li key={item.to} className="shrink-0">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-xs transition-colors duration-200 ${
                    isActive
                      ? 'text-arcane-light'
                      : 'text-ash hover:text-parchment'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="text-lg leading-none">{item.icon}</span>
                    <span
                      className={`font-display text-[10px] tracking-wider uppercase ${
                        isActive ? 'text-arcane-light' : ''
                      }`}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 h-0.5 w-4 rounded-full bg-arcane"
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 35,
                        }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
