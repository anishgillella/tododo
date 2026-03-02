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
    category_name?: string | null;
    category_emoji?: string | null;
    category_color?: string | null;
    dueDate?: string | null;
    due_date?: string | null;
  };
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  canComplete?: boolean;
}

const difficultyLabel = (d: number): string =>
  MISSION_DIFFICULTIES[d as MissionDifficulty]?.label ?? 'Unknown';

function formatDueDate(dateStr: string): { label: string; isOverdue: boolean; isToday: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isToday: false };
  if (diffDays === 0) return { label: 'Today', isOverdue: false, isToday: true };
  if (diffDays === 1) return { label: 'Tomorrow', isOverdue: false, isToday: false };
  if (diffDays <= 7) return { label: `${diffDays}d left`, isOverdue: false, isToday: false };
  return { label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isOverdue: false, isToday: false };
}

function statusBadge(status: string): { label: string; className: string } | null {
  switch (status) {
    case 'completed':
      return { label: 'Completed', className: 'bg-verdant/15 text-verdant-light' };
    case 'failed':
      return { label: 'Failed', className: 'bg-rift/15 text-rift-light' };
    case 'carried_over':
      return { label: 'Carried Over', className: 'bg-rift/15 text-rift-light' };
    default:
      return null;
  }
}

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

export function MissionCard({ mission, onComplete, onDelete, readOnly = false, canComplete = true }: MissionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const badge = readOnly ? statusBadge(mission.status) : null;
  const showActions = !readOnly;
  const showComplete = showActions && canComplete;
  const showDelete = showActions;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group relative flex items-start justify-between gap-3 rounded-lg border border-steel bg-void-lighter p-4 transition-colors hover:border-steel-light ${readOnly ? 'opacity-80' : ''}`}
    >
      {/* Left content */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {/* Difficulty stars + label + category badge + status badge */}
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyStars difficulty={mission.difficulty} />
          <span className="text-xs text-ash">{difficultyLabel(mission.difficulty)}</span>
          {mission.category_name && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${mission.category_color ?? '#6B7280'}20`,
                color: mission.category_color ?? '#6B7280',
              }}
            >
              {mission.category_emoji} {mission.category_name}
            </span>
          )}
          {badge && (
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${badge.className}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-body text-base font-medium leading-snug text-parchment">
          {mission.title}
        </h3>

        {/* Optional description */}
        {mission.description && (
          <p className="text-sm leading-relaxed text-ash">{mission.description}</p>
        )}

        {/* Reward badges + due date */}
        <div className="flex items-center gap-3 pt-1">
          <span className="inline-flex items-center rounded-md bg-arcane/15 px-2 py-0.5 font-mono text-xs font-semibold text-arcane-light">
            +{mission.xpReward} XP
          </span>
          <span className="inline-flex items-center rounded-md bg-ember/15 px-2 py-0.5 font-mono text-xs font-semibold text-ember-light">
            +{mission.goldReward} G
          </span>
          {(() => {
            const raw = mission.dueDate ?? mission.due_date;
            if (!raw) return null;
            const { label, isOverdue, isToday } = formatDueDate(raw);
            return (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${
                  isOverdue
                    ? 'bg-rift/15 text-rift-light'
                    : isToday
                      ? 'bg-verdant/15 text-verdant-light'
                      : 'bg-drift/15 text-drift-light'
                }`}
              >
                {'\u{1F4C5}'} {label}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Right side actions */}
      {(showComplete || showDelete) && (
        <div
          className={`flex flex-col items-center gap-2 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'
          }`}
          style={{ minWidth: '2.5rem' }}
        >
          {showComplete && (
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
          )}

          {showDelete && (
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
          )}
        </div>
      )}

      {/* Always show actions on touch devices */}
      {(showComplete || showDelete) && (
        <style>{`
          @media (hover: none) {
            .group [style*="min-width"] {
              opacity: 1 !important;
            }
          }
        `}</style>
      )}
    </motion.div>
  );
}
