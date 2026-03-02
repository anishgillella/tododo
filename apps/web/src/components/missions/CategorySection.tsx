import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MissionCard } from './MissionCard';

interface Mission {
  id: string;
  title: string;
  description?: string | null;
  difficulty: number;
  status: string;
  xpReward: number;
  goldReward: number;
  category_id?: string | null;
  category_name?: string | null;
  category_emoji?: string | null;
  category_color?: string | null;
}

interface CategorySectionProps {
  name: string;
  emoji: string;
  color: string;
  missions: Mission[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  canComplete?: boolean;
}

export function CategorySection({
  name,
  emoji,
  color,
  missions,
  onComplete,
  onDelete,
  readOnly,
  canComplete,
}: CategorySectionProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-4">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-void-lighter"
      >
        <span className="text-base">{emoji}</span>
        <span
          className="font-display text-xs font-bold uppercase tracking-wider"
          style={{ color }}
        >
          {name}
        </span>
        <span className="font-mono text-xs text-steel-light">
          [{missions.length}]
        </span>
        <div className="flex-1" />
        <motion.span
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-steel-light"
        >
          {'\u25BC'}
        </motion.span>
      </button>

      {/* Accent line */}
      <div
        className="mx-3 mb-2 h-px opacity-30"
        style={{ backgroundColor: color }}
      />

      {/* Missions */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 px-1">
              <AnimatePresence mode="popLayout">
                {missions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    readOnly={readOnly}
                    canComplete={canComplete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
