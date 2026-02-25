import { motion } from 'framer-motion';

interface StreakCounterProps {
  days: number;
  tier: string; // 'none' | 'spark' | 'flame' | 'blaze' | 'inferno' | 'eternal_fire'
}

const tierConfig: Record<
  string,
  { color: string; label: string; pulseSpeed: number; glowColor: string }
> = {
  none: {
    color: 'text-steel-light',
    label: '',
    pulseSpeed: 0,
    glowColor: 'transparent',
  },
  spark: {
    color: 'text-spark',
    label: 'Spark',
    pulseSpeed: 2,
    glowColor: 'rgba(251,191,36,0.2)',
  },
  flame: {
    color: 'text-flame',
    label: 'Flame',
    pulseSpeed: 1.5,
    glowColor: 'rgba(249,115,22,0.25)',
  },
  blaze: {
    color: 'text-blaze',
    label: 'Blaze',
    pulseSpeed: 1,
    glowColor: 'rgba(239,68,68,0.3)',
  },
  inferno: {
    color: 'text-inferno',
    label: 'Inferno',
    pulseSpeed: 0.7,
    glowColor: 'rgba(220,38,38,0.35)',
  },
  eternal_fire: {
    color: 'text-eternal',
    label: 'Eternal',
    pulseSpeed: 0.5,
    glowColor: 'rgba(124,58,237,0.4)',
  },
};

export function StreakCounter({ days, tier }: StreakCounterProps) {
  const config = tierConfig[tier] ?? tierConfig.none;
  const isActive = tier !== 'none' && days > 0;
  const hasGlow = ['blaze', 'inferno', 'eternal_fire'].includes(tier);

  if (!isActive) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-sm opacity-40">🔥</span>
        <span className="font-mono text-xs text-steel-light">No streak</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`flex items-center gap-1.5 ${config.color}`}
        style={
          hasGlow
            ? {
                textShadow: `0 0 10px ${config.glowColor}, 0 0 20px ${config.glowColor}`,
              }
            : undefined
        }
      >
        {/* Pulsing fire emoji */}
        <motion.span
          className="text-sm"
          role="img"
          aria-label="Streak fire"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: config.pulseSpeed,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          🔥
        </motion.span>

        {/* Day count */}
        <motion.span
          className="font-mono text-xs font-semibold"
          key={days}
          initial={{ scale: 1.3, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {days}
        </motion.span>
      </div>

      {/* Tier label */}
      {config.label && (
        <span
          className={`font-mono text-[9px] uppercase tracking-widest ${config.color} opacity-70`}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}
