import { motion } from 'framer-motion';
import type { Habit } from '../../hooks/useHabits';

const DIFFICULTY_LABELS = ['', 'Trivial', 'Easy', 'Medium', 'Hard', 'Epic'];
const DIFFICULTY_COLORS = ['', 'text-steel-light', 'text-verdant', 'text-arcane-light', 'text-ember', 'text-rift-light'];

interface HabitCardProps {
  habit: Habit;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HabitCard({ habit, onComplete, onDelete }: HabitCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
        habit.completedToday
          ? 'border-verdant/30 bg-verdant/5'
          : 'border-steel bg-void-light hover:border-steel-light'
      }`}
    >
      {/* Complete button */}
      <button
        onClick={() => !habit.completedToday && onComplete(habit.id)}
        disabled={habit.completedToday}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
          habit.completedToday
            ? 'border-verdant bg-verdant/20 text-verdant-light'
            : 'border-steel hover:border-arcane hover:bg-arcane/10'
        }`}
      >
        {habit.completedToday && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${habit.completedToday ? 'text-ash line-through' : 'text-parchment'}`}>
          {habit.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`font-mono text-[10px] uppercase ${DIFFICULTY_COLORS[habit.difficulty] ?? 'text-steel-light'}`}>
            {DIFFICULTY_LABELS[habit.difficulty] ?? 'Medium'}
          </span>
        </div>
      </div>

      {/* Streak */}
      <div className="flex flex-col items-center shrink-0">
        <span className={`font-mono text-sm font-bold ${habit.habitStreak > 0 ? 'text-spark' : 'text-steel-light'}`}>
          {habit.habitStreak}
        </span>
        <span className="font-mono text-[8px] uppercase tracking-wider text-steel-light">streak</span>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(habit.id)}
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-steel-light hover:text-rift-light"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 3L11 11M3 11L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}
