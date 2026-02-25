import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecaps, useTriggerEndOfDay } from '../hooks/useRecap';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function StatBadge({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-steel bg-void px-3 py-2">
      <span className={`font-mono text-sm font-bold ${color}`}>{value}</span>
      <span className="font-mono text-[9px] uppercase tracking-wider text-steel-light">
        {label}
      </span>
    </div>
  );
}

function RecapCard({ recap, index }: { recap: ReturnType<typeof useRecaps>['data'] extends (infer T)[] | undefined ? T : never; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="overflow-hidden rounded-xl border border-steel bg-void-light"
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-void-lighter"
      >
        <div>
          <h3 className="font-display text-sm tracking-wider text-parchment">
            {formatDate(recap.date)}
          </h3>
          <div className="mt-1 flex items-center gap-3 font-mono text-[10px] text-ash">
            <span>{recap.missionsCompleted} completed</span>
            <span className="text-steel-light">/</span>
            <span>{recap.missionsFailed} failed</span>
            <span className="text-steel-light">|</span>
            <span className="text-arcane-light">+{recap.xpEarned} XP</span>
          </div>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-steel-light"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </motion.span>
      </button>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-steel px-4 py-4">
              {/* Stats Row */}
              <div className="grid grid-cols-5 gap-2">
                <StatBadge label="Done" value={recap.missionsCompleted} color="text-verdant" />
                <StatBadge label="Failed" value={recap.missionsFailed} color="text-rift-light" />
                <StatBadge label="XP" value={`+${recap.xpEarned}`} color="text-arcane-light" />
                <StatBadge label="Gold" value={`+${recap.goldEarned}`} color="text-ember-light" />
                <StatBadge
                  label="HP"
                  value={`${recap.hpChange >= 0 ? '+' : ''}${recap.hpChange}`}
                  color={recap.hpChange >= 0 ? 'text-verdant' : 'text-rift-light'}
                />
              </div>

              {/* Narrative */}
              {recap.narrative && (
                <div className="rounded-lg bg-void-lighter px-4 py-3">
                  <p className="text-sm italic leading-relaxed text-bone">
                    {recap.narrative}
                  </p>
                </div>
              )}

              {/* AXIOM Commentary */}
              {recap.axiomCommentary && (
                <div className="rounded-lg border border-drift/20 bg-drift/5 px-4 py-3">
                  <p className="text-sm leading-relaxed text-drift-light">
                    <span className="font-display text-[10px] tracking-widest uppercase text-drift">
                      {'\u{1F916}'} AXIOM:{' '}
                    </span>
                    {recap.axiomCommentary}
                  </p>
                </div>
              )}

              {/* Kael Reaction */}
              {recap.kaelReaction && (
                <div className="rounded-lg border border-ember/20 bg-ember/5 px-4 py-3">
                  <p className="text-sm leading-relaxed text-ember-light">
                    <span className="font-display text-[10px] tracking-widest uppercase text-ember">
                      {'\u{2694}\u{FE0F}'} Kael:{' '}
                    </span>
                    {recap.kaelReaction}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function DailyRecap() {
  const { data: recaps = [], isLoading } = useRecaps();
  const triggerEndOfDay = useTriggerEndOfDay();
  const [showConfirm, setShowConfirm] = useState(false);

  // Sort recaps most recent first
  const sortedRecaps = useMemo(
    () => [...recaps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [recaps],
  );

  // Check if we already have a recap for today
  const today = new Date().toISOString().slice(0, 10);
  const alreadyTriggeredToday = sortedRecaps.some(
    (r) => r.date.slice(0, 10) === today,
  );

  const handleEndDay = () => {
    triggerEndOfDay.mutate(undefined, {
      onSuccess: () => setShowConfirm(false),
      onError: () => setShowConfirm(false),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col px-4 pt-6 pb-8"
    >
      {/* Header */}
      <header className="mb-6 shrink-0">
        <h1 className="font-display text-2xl font-bold tracking-widest text-parchment uppercase">
          Daily Recap
        </h1>
        <p className="mt-1 font-mono text-sm tracking-wide text-ash">
          // The Drifter&apos;s Log
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-verdant via-steel to-transparent" />
      </header>

      {/* End Day Button */}
      <div className="mb-6 shrink-0">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowConfirm(true)}
          disabled={alreadyTriggeredToday || triggerEndOfDay.isPending}
          className="w-full rounded-lg border border-verdant bg-verdant/10 px-6 py-3 font-display text-sm uppercase tracking-wider text-verdant-light transition-colors hover:bg-verdant/20 disabled:border-steel disabled:bg-transparent disabled:text-steel-light disabled:opacity-50"
        >
          {triggerEndOfDay.isPending
            ? 'Processing Transmission...'
            : alreadyTriggeredToday
              ? 'Day Already Logged'
              : 'End Day'}
        </motion.button>

        {triggerEndOfDay.isError && (
          <p className="mt-2 text-center font-mono text-xs text-rift-light">
            Error: {triggerEndOfDay.error?.message ?? 'Failed to process end of day'}
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-xl border border-steel bg-void-light p-6"
            >
              <h3 className="font-display text-base tracking-wider text-parchment uppercase">
                End Day?
              </h3>
              <p className="mt-2 text-sm text-ash">
                This will process all remaining missions, calculate consequences, and generate
                your daily log. Incomplete missions may be penalized.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-lg border border-steel bg-void-lighter px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-ash transition-colors hover:bg-steel/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndDay}
                  disabled={triggerEndOfDay.isPending}
                  className="flex-1 rounded-lg border border-verdant bg-verdant/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-verdant-light transition-colors hover:bg-verdant/20 disabled:opacity-50"
                >
                  {triggerEndOfDay.isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recap Cards */}
      <section className="flex flex-1 flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-mono text-xs text-steel-light">Loading transmission logs...</p>
          </div>
        ) : sortedRecaps.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="text-5xl">{'\u{1F4DC}'}</div>
            <p className="font-display text-sm tracking-wider text-verdant-light uppercase">
              No transmissions received
            </p>
            <p className="max-w-xs text-xs text-ash">
              Complete a day to generate your first log. The Drifter&apos;s journey begins with a
              single entry.
            </p>
            <div className="mt-2 rounded-md border border-steel bg-void-lighter px-6 py-3">
              <p className="font-mono text-xs text-steel-light">
                [AWAITING END-OF-DAY TRANSMISSION]
              </p>
            </div>
          </div>
        ) : (
          sortedRecaps.map((recap, i) => (
            <RecapCard key={recap.id} recap={recap} index={i} />
          ))
        )}
      </section>
    </motion.div>
  );
}
