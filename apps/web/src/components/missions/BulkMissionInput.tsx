import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MISSION_DIFFICULTIES } from '@tododo/shared';
import type { MissionDifficulty } from '@tododo/shared';
import { useParseTasks, useCreateBatchMissions } from '../../hooks/useMissions';
import type { ParsedTask, CreateMissionInput } from '../../hooks/useMissions';
import type { Category } from '../../hooks/useCategories';

interface BulkMissionInputProps {
  categories: Category[];
  onDone: () => void;
  defaultDueDate?: string;
}

const difficulties: MissionDifficulty[] = [1, 2, 3, 4, 5];

export function BulkMissionInput({ categories, onDone, defaultDueDate: propDueDate }: BulkMissionInputProps) {
  const [text, setText] = useState('');
  const [tasks, setTasks] = useState<ParsedTask[]>([]);
  const [phase, setPhase] = useState<'input' | 'review'>('input');
  const [defaultDueDate, setDefaultDueDate] = useState(propDueDate ?? '');

  const parseMutation = useParseTasks();
  const batchMutation = useCreateBatchMissions();

  const handleParse = async () => {
    if (!text.trim()) return;
    const result = await parseMutation.mutateAsync(text);
    // Apply default due date to all parsed tasks
    const parsed = defaultDueDate
      ? result.parsed.map((t: ParsedTask) => ({ ...t, dueDate: t.dueDate ?? defaultDueDate }))
      : result.parsed;
    setTasks(parsed);
    setPhase('review');
  };

  const applyDateToAll = (date: string) => {
    setTasks((prev) => prev.map((t) => ({ ...t, dueDate: date || undefined })));
  };

  const handleCreateAll = async () => {
    const missionInputs: CreateMissionInput[] = tasks.map((t) => ({
      title: t.title,
      description: t.description,
      difficulty: t.difficulty,
      categoryId: t.categoryId ?? undefined,
      isRecurring: t.isRecurring,
      dueDate: t.dueDate,
    }));
    await batchMutation.mutateAsync(missionInputs);
    // Reset and close
    setText('');
    setTasks([]);
    setPhase('input');
    onDone();
  };

  const updateTask = (index: number, updates: Partial<ParsedTask>) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, ...updates } : t)));
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const addBlankTask = () => {
    setTasks((prev) => [
      ...prev,
      { title: '', difficulty: 2, categoryId: null, isRecurring: false, dueDate: undefined },
    ]);
  };

  const handleBack = () => {
    setPhase('input');
  };

  return (
    <div className="rounded-lg border border-steel bg-void-lighter p-4">
      <AnimatePresence mode="wait">
        {phase === 'input' ? (
          <motion.div
            key="input-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <label
              htmlFor="bulk-text"
              className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-ash"
            >
              Task List
            </label>
            <textarea
              id="bulk-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"Paste your tasks or describe your day...\n\nExamples:\n- Go for a run\n- Buy groceries\n- Review PRs\n- Read for 30 minutes every day"}
              rows={6}
              className="w-full resize-none rounded-lg border border-steel bg-void px-3 py-2 font-body text-sm text-parchment placeholder-steel-light outline-none transition-colors focus:border-arcane"
            />
            {/* Due date — applied to all parsed tasks */}
            <div className="mt-3 flex items-center gap-2">
              <label className="font-mono text-xs uppercase tracking-wider text-ash">
                Due Date
              </label>
              <input
                type="date"
                value={defaultDueDate}
                onChange={(e) => setDefaultDueDate(e.target.value)}
                className="rounded border border-steel bg-void px-2 py-1 font-mono text-xs text-parchment outline-none transition-colors focus:border-arcane [color-scheme:dark]"
              />
              <span className="font-mono text-[10px] text-steel-light">
                (optional — applies to all)
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <motion.button
                type="button"
                onClick={handleParse}
                disabled={!text.trim() || parseMutation.isPending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-lg bg-arcane px-4 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-parchment transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {parseMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-parchment border-t-transparent" />
                    Parsing...
                  </span>
                ) : (
                  'Parse Tasks'
                )}
              </motion.button>
            </div>
            {parseMutation.isError && (
              <p className="mt-2 font-mono text-xs text-rift-light">
                Failed to parse tasks. Please try again.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="review-phase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-mono text-xs uppercase tracking-wider text-ash">
                Review Tasks ({tasks.length})
              </h3>
              <button
                type="button"
                onClick={handleBack}
                className="font-mono text-xs text-steel-light transition-colors hover:text-parchment"
              >
                &larr; Back
              </button>
            </div>

            {/* Shared date picker — apply to all tasks */}
            <div className="mb-3 flex items-center gap-2">
              <label className="font-mono text-xs uppercase tracking-wider text-ash">
                Due Date
              </label>
              <input
                type="date"
                onChange={(e) => applyDateToAll(e.target.value)}
                className="rounded border border-steel bg-void px-2 py-1 font-mono text-xs text-parchment outline-none transition-colors focus:border-arcane [color-scheme:dark]"
              />
              <span className="font-mono text-xs text-steel-light">
                applies to all
              </span>
            </div>

            {tasks.length === 0 ? (
              <p className="py-4 text-center font-mono text-sm text-ash">
                No tasks parsed. Go back and try again.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {tasks.map((task, index) => (
                  <TaskRow
                    key={index}
                    task={task}
                    categories={categories}
                    onChange={(updates) => updateTask(index, updates)}
                    onRemove={() => removeTask(index)}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addBlankTask}
              className="mt-2 w-full rounded-lg border border-dashed border-steel py-1.5 text-center font-mono text-xs text-steel-light transition-colors hover:border-steel-light hover:text-ash"
            >
              + Add another
            </button>

            <div className="mt-3 flex items-center gap-3">
              <motion.button
                type="button"
                onClick={handleCreateAll}
                disabled={tasks.length === 0 || tasks.some((t) => !t.title.trim()) || batchMutation.isPending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 rounded-lg bg-arcane px-4 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-parchment transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {batchMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-parchment border-t-transparent" />
                    Creating...
                  </span>
                ) : (
                  `Create All (${tasks.length})`
                )}
              </motion.button>
              <button
                type="button"
                onClick={handleBack}
                className="rounded-lg border border-steel px-4 py-2.5 font-mono text-xs text-ash transition-colors hover:border-steel-light hover:text-parchment"
              >
                Cancel
              </button>
            </div>
            {batchMutation.isError && (
              <p className="mt-2 font-mono text-xs text-rift-light">
                Failed to create missions. Please try again.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Individual task row in review phase ──────────────────────────────

interface TaskRowProps {
  task: ParsedTask;
  categories: Category[];
  onChange: (updates: Partial<ParsedTask>) => void;
  onRemove: () => void;
}

function TaskRow({ task, categories, onChange, onRemove }: TaskRowProps) {
  const [editingTitle, setEditingTitle] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="flex items-center gap-2 rounded-lg border border-steel bg-void px-3 py-2"
    >
      {/* Title — click to edit */}
      <div className="min-w-0 flex-1">
        {editingTitle ? (
          <input
            type="text"
            value={task.title}
            onChange={(e) => onChange({ title: e.target.value })}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
            autoFocus
            className="w-full rounded border border-arcane bg-void-lighter px-2 py-1 font-body text-sm text-parchment outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="w-full truncate text-left font-body text-sm text-parchment transition-colors hover:text-arcane-light"
            title="Click to edit"
          >
            {task.title || <span className="italic text-steel-light">Untitled</span>}
          </button>
        )}
      </div>

      {/* Category pill */}
      <select
        value={task.categoryId ?? ''}
        onChange={(e) => {
          const catId = e.target.value || null;
          const cat = categories.find((c) => c.id === catId);
          onChange({ categoryId: catId, categoryName: cat?.name });
        }}
        className="rounded border border-steel bg-void-lighter px-1.5 py-1 font-mono text-xs text-ash outline-none transition-colors focus:border-arcane"
      >
        <option value="">Auto</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.emoji} {cat.name}
          </option>
        ))}
      </select>

      {/* Difficulty stars */}
      <div className="flex gap-0.5">
        {difficulties.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange({ difficulty: d })}
            className={`text-xs transition-colors ${
              d <= task.difficulty ? 'text-arcane-light' : 'text-steel-light'
            } hover:text-arcane`}
            title={MISSION_DIFFICULTIES[d].label}
          >
            &#9733;
          </button>
        ))}
      </div>

      {/* Per-task date */}
      <input
        type="date"
        value={task.dueDate ?? ''}
        onChange={(e) => onChange({ dueDate: e.target.value || undefined })}
        className="w-[110px] rounded border border-steel bg-void-lighter px-1.5 py-1 font-mono text-xs text-ash outline-none transition-colors focus:border-arcane [color-scheme:dark]"
        title="Due date"
      />

      {/* Recurring indicator */}
      {task.isRecurring && (
        <span className="font-mono text-xs text-drift-light" title="Recurring daily">
          &#x21BB;
        </span>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 rounded p-1 text-steel-light transition-colors hover:bg-rift/20 hover:text-rift-light"
        title="Remove"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}
