import { useState } from 'react';
import { motion } from 'framer-motion';
import { MISSION_DIFFICULTIES } from '@tododo/shared';
import type { MissionDifficulty } from '@tododo/shared';

interface MissionCardProps {
  mission: {
    id: string;
    title: string;
    description?: string | null;
    difficulty: number;
    status: string;
    xpReward: number;
    goldReward: number;
  };
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const difficultyLabel = (d: number): string =>
  MISSION_DIFFICULTIES[d as MissionDifficulty]?.label ?? 'Unknown';

function DifficultyStars({ difficulty }: { difficulty: number }) {
  return (
    <span className="inline-flex gap-0.5 text-sm" aria-label={`Difficulty ${difficulty} of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < difficulty ? 'text-arcane-light' : 'text-steel-light'}
        >
          {i < difficulty ? '\u2605' : '\u2606'}
        </span>
      ))}
    </span>
  );
}

export function MissionCard({ mission, onComplete, onDelete }: MissionCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative flex items-start justify-between gap-3 rounded-lg border border-steel bg-void-lighter p-4 transition-colors hover:border-steel-light"
    >
      {/* Left content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Difficulty stars + label */}
        <div className="flex items-center gap-2">
          <DifficultyStars difficulty={mission.difficulty} />
          <span className="text-xs text-ash">{difficultyLabel(mission.difficulty)}</span>
        </div>

        {/* Title */}
        <h3 className="font-body text-base font-medium leading-snug text-parchment">
          {mission.title}
        </h3>

        {/* Optional description */}
        {mission.description && (
          <p className="text-sm leading-relaxed text-ash">{mission.description}</p>
        )}

        {/* Reward badges */}
        <div className="flex items-center gap-3 pt-1">
          <span className="inline-flex items-center rounded-md bg-arcane/15 px-2 py-0.5 font-mono text-xs font-semibold text-arcane-light">
            +{mission.xpReward} XP
          </span>
          <span className="inline-flex items-center rounded-md bg-ember/15 px-2 py-0.5 font-mono text-xs font-semibold text-ember-light">
            +{mission.goldReward} G
          </span>
        </div>
      </div>

      {/* Right side actions */}
      <div
        className={`flex flex-col items-center gap-2 transition-opacity duration-200 ${
          isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'
        }`}
        style={{ minWidth: '2.5rem' }}
      >
        {/* Complete button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onComplete(mission.id)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-verdant/40 bg-verdant/10 text-verdant transition-all hover:border-verdant hover:bg-verdant/20 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          aria-label="Complete mission"
          title="Complete mission"
        >
          <span className="text-lg leading-none">{'\u2713'}</span>
        </motion.button>

        {/* Delete button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onDelete(mission.id)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-rift/40 bg-rift/10 text-rift transition-all hover:border-rift hover:bg-rift/20 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
          aria-label="Delete mission"
          title="Delete mission"
        >
          <span className="text-lg leading-none">{'\u00D7'}</span>
        </motion.button>
      </div>

      {/* Always show actions on touch devices */}
      <style>{`
        @media (hover: none) {
          .group [style*="min-width"] {
            opacity: 1 !important;
          }
        }
      `}</style>
    </motion.div>
  );
}
