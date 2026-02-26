import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MISSION_DIFFICULTIES } from '@tododo/shared';
import type { MissionDifficulty } from '@tododo/shared';
import type { Category } from '../../hooks/useCategories';

interface MissionFormProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    difficulty: number;
    categoryId?: string;
    isRecurring?: boolean;
    dueDate?: string;
  }) => void;
  isLoading?: boolean;
  categories?: Category[];
}

const difficulties: MissionDifficulty[] = [1, 2, 3, 4, 5];

export function MissionForm({ onSubmit, isLoading = false, categories = [] }: MissionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<MissionDifficulty>(2);
  const [categoryId, setCategoryId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isLoading) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      difficulty,
      categoryId: categoryId || undefined,
      isRecurring: isRecurring || undefined,
      dueDate: dueDate || undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDifficulty(2);
    setCategoryId('');
    setIsRecurring(false);
    setDueDate('');
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setDifficulty(2);
    setCategoryId('');
    setIsRecurring(false);
    setDueDate('');
    setIsOpen(false);
  };

  return (
    <div>
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(true)}
            className="w-full rounded-lg border border-dashed border-steel p-4 text-center font-mono text-sm text-ash transition-colors hover:border-steel-light hover:bg-void-lighter hover:text-parchment"
          >
            + New Mission
          </motion.button>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-lg border border-steel bg-void-lighter p-4"
          >
            <div className="flex flex-col gap-4">
              {/* Title input */}
              <div>
                <label htmlFor="mission-title" className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ash">
                  Objective
                </label>
                <input
                  id="mission-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter mission objective..."
                  autoFocus
                  className="w-full rounded-lg border border-steel bg-void px-3 py-2 font-body text-sm text-parchment placeholder-steel-light outline-none transition-colors focus:border-arcane"
                />
              </div>

              {/* Description textarea */}
              <div>
                <label htmlFor="mission-desc" className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ash">
                  Intel <span className="text-steel-light">(optional)</span>
                </label>
                <textarea
                  id="mission-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional intel..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-steel bg-void px-3 py-2 font-body text-sm text-parchment placeholder-steel-light outline-none transition-colors focus:border-arcane"
                />
              </div>

              {/* Category selector */}
              {categories.length > 0 && (
                <div>
                  <label htmlFor="mission-category" className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ash">
                    Category
                  </label>
                  <select
                    id="mission-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-lg border border-steel bg-void px-3 py-2 font-body text-sm text-parchment outline-none transition-colors focus:border-arcane"
                  >
                    <option value="">Auto-detect (AI)</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Difficulty selector */}
              <div>
                <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ash">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  {difficulties.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 rounded-lg border px-2 py-2 text-center text-sm transition-all ${
                        difficulty === d
                          ? 'border-arcane bg-arcane/20 text-arcane-light'
                          : 'border-steel bg-void-lighter text-ash hover:border-steel-light hover:text-bone'
                      }`}
                    >
                      {Array.from({ length: d }, () => '\u2605').join('')}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-center font-mono text-xs text-ash">
                  {MISSION_DIFFICULTIES[difficulty].label}
                  <span className="text-steel-light">
                    {' '}&mdash; {MISSION_DIFFICULTIES[difficulty].timeEstimate}
                  </span>
                </p>
              </div>

              {/* Due date */}
              <div>
                <label htmlFor="mission-due" className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ash">
                  Due Date <span className="text-steel-light">(optional)</span>
                </label>
                <input
                  id="mission-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-steel bg-void px-3 py-2 font-mono text-sm text-parchment outline-none transition-colors focus:border-arcane [color-scheme:dark]"
                />
              </div>

              {/* Recurring daily toggle */}
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="h-4 w-4 rounded border-steel bg-void accent-arcane"
                  />
                  <span className="font-mono text-xs uppercase tracking-wider text-ash">
                    Recurring Daily
                  </span>
                </label>
                {isRecurring && (
                  <span className="font-mono text-xs text-steel-light">
                    Auto-creates each day
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <motion.button
                  type="submit"
                  disabled={!title.trim() || isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 rounded-lg bg-arcane px-4 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-parchment transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isLoading ? 'Deploying...' : 'Deploy Mission'}
                </motion.button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-steel px-4 py-2.5 font-mono text-xs text-ash transition-colors hover:border-steel-light hover:text-parchment"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
