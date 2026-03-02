import { AnimatePresence } from 'framer-motion';
import { MissionCard } from './MissionCard';

type Mission = {
  id: string;
  title: string;
  description?: string | null;
  difficulty: number;
  status: string;
  xpReward: number;
  goldReward: number;
};

interface MissionListProps {
  missions: Mission[];
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
  readOnly?: boolean;
  canComplete?: boolean;
}

function SkeletonCard() {
  return (
    <div className="h-20 animate-pulse rounded-lg border border-steel bg-void-lighter" />
  );
}

export function MissionList({
  missions,
  onComplete,
  onDelete,
  isLoading = false,
  readOnly,
  canComplete,
}: MissionListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // Empty state
  if (missions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-steel bg-void-lighter">
          <span className="font-display text-xl text-steel-light">{'\u2731'}</span>
        </div>
        <div>
          <p className="font-display text-sm uppercase tracking-wider text-parchment">
            No active missions
          </p>
          <p className="mt-1 text-sm text-ash">The void awaits your command.</p>
        </div>
      </div>
    );
  }

  // Mission list
  return (
    <div className="flex flex-col gap-3">
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
  );
}
