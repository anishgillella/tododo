import { useState } from 'react';
import { motion } from 'framer-motion';

interface HabitFormProps {
  onSubmit: (data: { title: string; difficulty: number }) => void;
  isLoading: boolean;
}

const DIFFICULTIES = [
  { value: 1, label: 'Trivial', color: 'border-steel-light text-steel-light' },
  { value: 2, label: 'Easy', color: 'border-verdant text-verdant' },
  { value: 3, label: 'Medium', color: 'border-arcane text-arcane-light' },
  { value: 4, label: 'Hard', color: 'border-ember text-ember' },
  { value: 5, label: 'Epic', color: 'border-rift text-rift-light' },
];

export function HabitForm({ onSubmit, isLoading }: HabitFormProps) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), difficulty });
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-steel bg-void-light p-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New daily habit..."
        className="w-full rounded-lg border border-steel bg-void px-3 py-2 text-sm text-parchment placeholder:text-steel-light focus:border-arcane focus:outline-none"
      />

      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              className={`rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-all ${
                difficulty === d.value
                  ? `${d.color} bg-current/10`
                  : 'border-transparent text-steel-light hover:text-ash'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.95 }}
          disabled={!title.trim() || isLoading}
          className="rounded-lg border border-arcane bg-arcane/10 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-arcane-light transition-colors hover:bg-arcane/20 disabled:border-steel disabled:text-steel-light disabled:opacity-50"
        >
          Add
        </motion.button>
      </div>
    </form>
  );
}
