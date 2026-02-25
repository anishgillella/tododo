import { motion, AnimatePresence } from 'framer-motion';

interface DebtIndicatorProps {
  debt: number;
  stage: 'dormant' | 'whispers' | 'presence' | 'confrontation' | 'forced';
}

export function DebtIndicator({ debt, stage }: DebtIndicatorProps) {
  if (stage === 'dormant') {
    return (
      <span className="font-mono text-[10px] text-verdant/50">All clear</span>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {stage === 'whispers' && (
        <motion.div
          key="whispers"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-2"
        >
          <span className="font-mono text-xs italic text-ash">
            Whispers...
          </span>
          <DebtBadge debt={debt} variant="subtle" />
        </motion.div>
      )}

      {stage === 'presence' && (
        <motion.div
          key="presence"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2"
        >
          <GlitchText
            text="The Hollow stirs..."
            className="font-mono text-xs text-rift"
          />
          <DebtBadge debt={debt} variant="warning" />
        </motion.div>
      )}

      {stage === 'confrontation' && (
        <motion.div
          key="confrontation"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 rounded border border-rift/40 px-2 py-1"
          style={{
            boxShadow: '0 0 12px rgba(239,68,68,0.2)',
          }}
        >
          <motion.span
            className="font-display text-[10px] font-bold uppercase tracking-wider text-rift-light"
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            Confront the Hollow
          </motion.span>
          <DebtBadge debt={debt} variant="danger" />
        </motion.div>
      )}

      {stage === 'forced' && (
        <motion.div
          key="forced"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hollow-glitch flex items-center gap-2 rounded border border-rift px-2 py-1"
          style={{
            boxShadow:
              '0 0 20px rgba(239,68,68,0.4), 0 0 40px rgba(239,68,68,0.15)',
          }}
        >
          <motion.span
            className="font-display text-[10px] font-bold uppercase tracking-wider text-rift-light"
            animate={{
              textShadow: [
                '0 0 4px rgba(248,113,113,0.5)',
                '0 0 12px rgba(248,113,113,0.8)',
                '0 0 4px rgba(248,113,113,0.5)',
              ],
            }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            The Hollow Demands Battle
          </motion.span>
          <DebtBadge debt={debt} variant="critical" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Sub-components ---------- */

function DebtBadge({
  debt,
  variant,
}: {
  debt: number;
  variant: 'subtle' | 'warning' | 'danger' | 'critical';
}) {
  const variantStyles: Record<string, string> = {
    subtle: 'bg-steel text-ash',
    warning: 'bg-rift/20 text-rift',
    danger: 'bg-rift/30 text-rift-light',
    critical: 'bg-rift/50 text-parchment',
  };

  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold ${variantStyles[variant]}`}
    >
      {debt}
    </span>
  );
}

function GlitchText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      animate={{
        x: [0, -1, 1, 0],
        opacity: [1, 0.85, 1, 0.9, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
        times: [0, 0.3, 0.6, 1],
      }}
    >
      {text}
    </motion.span>
  );
}
