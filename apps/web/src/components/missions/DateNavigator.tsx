import { useRef } from 'react';
import { useMissionStore } from '../../stores/missionStore';

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function DateNavigator() {
  const selectedDate = useMissionStore((s) => s.selectedDate);
  const setSelectedDate = useMissionStore((s) => s.setSelectedDate);
  const goToPreviousDay = useMissionStore((s) => s.goToPreviousDay);
  const goToNextDay = useMissionStore((s) => s.goToNextDay);
  const goToToday = useMissionStore((s) => s.goToToday);
  const pickerRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === today;

  const handleDateClick = () => {
    pickerRef.current?.showPicker();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDate(e.target.value);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={goToPreviousDay}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-steel bg-void-lighter text-ash transition-colors hover:border-steel-light hover:text-parchment"
        aria-label="Previous day"
      >
        {'\u2039'}
      </button>

      <button
        onClick={handleDateClick}
        className="flex-1 cursor-pointer rounded-lg px-2 py-1 text-center font-mono text-sm tracking-wide text-parchment transition-colors hover:bg-void-lighter hover:text-arcane-light"
        title="Click to pick a date"
      >
        {formatDisplayDate(selectedDate)}
      </button>

      {/* Hidden native date picker */}
      <input
        ref={pickerRef}
        type="date"
        value={selectedDate}
        onChange={handleDateChange}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        tabIndex={-1}
      />

      <button
        onClick={goToNextDay}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-steel bg-void-lighter text-ash transition-colors hover:border-steel-light hover:text-parchment"
        aria-label="Next day"
      >
        {'\u203A'}
      </button>

      {isToday ? (
        <span className="rounded-md bg-verdant/15 px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-verdant-light">
          Today
        </span>
      ) : (
        <button
          onClick={goToToday}
          className="rounded-md border border-drift/40 bg-drift/10 px-2.5 py-1 font-mono text-xs uppercase tracking-wider text-drift-light transition-colors hover:bg-drift/20"
        >
          Today
        </button>
      )}
    </div>
  );
}
