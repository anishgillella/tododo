import { motion } from 'framer-motion';
import { StatBar } from './StatBar';
import { LevelBadge } from './LevelBadge';
import { StreakCounter } from './StreakCounter';
import { DebtIndicator } from './DebtIndicator';

interface MiniHudProps {
  agent: {
    level: number;
    xp: number;
    xpToNext: number;
    hp: number;
    maxHp: number;
    gold: number;
    streakDays: number;
    streakTier: string;
    debt?: number;
  } | null;
  hollowStage?: 'dormant' | 'whispers' | 'presence' | 'confrontation' | 'forced';
  isLoading?: boolean;
}

function HudSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-lg bg-void-lighter p-3">
      <div className="h-[52px] w-[52px] rounded-full bg-steel" />
      <div className="h-2 flex-1 rounded-full bg-steel" />
      <div className="h-4 w-16 rounded bg-steel" />
      <div className="h-4 w-16 rounded bg-steel" />
    </div>
  );
}

export function MiniHud({
  agent,
  hollowStage,
  isLoading = false,
}: MiniHudProps) {
  if (isLoading || !agent) {
    return <HudSkeleton />;
  }

  const debt = agent.debt ?? 0;
  const resolvedStage = hollowStage ?? inferStage(debt);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-2 rounded-lg bg-void-lighter p-3"
    >
      {/* Primary row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* Level badge with XP ring */}
        <LevelBadge
          level={agent.level}
          xp={agent.xp}
          xpToNext={agent.xpToNext}
        />

        {/* XP bar */}
        <div className="flex min-w-[100px] flex-1">
          <StatBar
            value={agent.xp}
            max={agent.xpToNext}
            color="arcane"
            label="XP"
            size="md"
          />
        </div>

        {/* HP bar */}
        <div className="flex w-24 items-center gap-1.5">
          <StatBar
            value={agent.hp}
            max={agent.maxHp}
            color="rift"
            label="HP"
            size="sm"
          />
        </div>

        {/* Gold */}
        <div className="flex items-center gap-1">
          <span className="text-sm" role="img" aria-label="Gold">
            {'\u{1FA99}'}
          </span>
          <span className="font-mono text-xs font-semibold text-ember-light">
            {agent.gold}
          </span>
        </div>

        {/* Streak */}
        <StreakCounter days={agent.streakDays} tier={agent.streakTier} />
      </div>

      {/* Hollow debt indicator - shown when debt exists */}
      {debt > 0 && (
        <div className="flex items-center justify-end">
          <DebtIndicator debt={debt} stage={resolvedStage} />
        </div>
      )}
    </motion.div>
  );
}

/**
 * Infer the Hollow stage from debt count when not explicitly provided.
 */
function inferStage(
  debt: number,
): 'dormant' | 'whispers' | 'presence' | 'confrontation' | 'forced' {
  if (debt <= 0) return 'dormant';
  if (debt <= 3) return 'whispers';
  if (debt <= 6) return 'presence';
  if (debt <= 9) return 'confrontation';
  return 'forced';
}
