import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface LevelBadgeProps {
  level: number;
  xp: number;
  xpToNext: number;
}

const BADGE_SIZE = 52;
const RING_RADIUS = 22;
const RING_STROKE = 3;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SVG_SIZE = BADGE_SIZE + RING_STROKE * 2;
const CENTER = SVG_SIZE / 2;

export function LevelBadge({ level, xp, xpToNext }: LevelBadgeProps) {
  const prevLevelRef = useRef(level);
  const [didLevelUp, setDidLevelUp] = useState(false);

  const xpPercent = xpToNext > 0 ? Math.min(xp / xpToNext, 1) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - xpPercent);

  useEffect(() => {
    if (prevLevelRef.current !== level) {
      setDidLevelUp(true);
      prevLevelRef.current = level;
      const timeout = setTimeout(() => setDidLevelUp(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [level]);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={
        didLevelUp
          ? { scale: [1, 1.25, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] }
          : { scale: 1 }
      }
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* SVG ring */}
      <svg
        width={SVG_SIZE}
        height={SVG_SIZE}
        className="-rotate-90"
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
      >
        {/* Track ring */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          className="text-steel"
        />
        {/* Progress ring */}
        <motion.circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          className="text-arcane-light"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>

      {/* Inner badge */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-arcane/30 bg-void-lighter">
          <AnimatePresence mode="wait">
            <motion.span
              key={level}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="font-display text-sm font-bold text-arcane-light"
            >
              {level}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
