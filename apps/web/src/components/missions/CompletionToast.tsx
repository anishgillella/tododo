import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CompletionToastProps {
  xpGained: number;
  goldGained: number;
  wasCrit: boolean;
  comboBonus: number;
  leveledUp: boolean;
  newLevel?: number;
  onDismiss: () => void;
}

export function CompletionToast({
  xpGained,
  goldGained,
  wasCrit,
  comboBonus,
  leveledUp,
  newLevel,
  onDismiss,
}: CompletionToastProps) {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={onDismiss}
        role="status"
        aria-live="polite"
        className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 cursor-pointer rounded-xl border border-steel bg-void-lighter p-4 shadow-lg"
        style={{ minWidth: '260px' }}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          {/* Critical Hit banner */}
          {wasCrit && (
            <motion.p
              initial={{ scale: 0.5 }}
              animate={{ scale: [0.5, 1.2, 1] }}
              transition={{ duration: 0.4 }}
              className="glow-ember font-display text-sm font-bold uppercase tracking-widest text-ember-light"
            >
              Critical Hit!
            </motion.p>
          )}

          {/* Level Up banner */}
          {leveledUp && newLevel != null && (
            <motion.p
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.3, 1], opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-sm font-bold uppercase tracking-widest text-arcane-light"
            >
              Level Up! {'\u2192'} Lv.{newLevel}
            </motion.p>
          )}

          {/* XP and Gold rewards */}
          <div className="flex items-center gap-4">
            <span className="font-mono text-lg font-bold text-arcane-light">
              +{xpGained} XP
            </span>
            <span className="font-mono text-lg font-bold text-ember-light">
              +{goldGained} Gold
            </span>
          </div>

          {/* Combo bonus */}
          {comboBonus > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-mono text-xs font-semibold uppercase tracking-wider text-drift-light"
            >
              Combo +{comboBonus} XP
            </motion.p>
          )}

          {/* Dismiss hint */}
          <p className="mt-1 text-[10px] text-steel-light">tap to dismiss</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
