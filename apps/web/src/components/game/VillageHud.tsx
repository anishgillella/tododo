import { useAgent } from '../../hooks/useAgent';
import { useAudioStore } from '../../stores/audioStore';
import { useVillageStore } from '../../stores/villageStore';
import { useMissionStore } from '../../stores/missionStore';

/**
 * Fixed-position screen HUD — rendered outside the game canvas
 * so it stays pinned to corners regardless of camera movement.
 */
export function VillageHud() {
  const { data: agent } = useAgent();
  const toggleMute = useAudioStore((s) => s.toggleMute);
  const isMuted = useAudioStore((s) => s.isMuted);
  const setShowHowToPlay = useVillageStore((s) => s.setShowHowToPlay);
  const selectedDate = useMissionStore((s) => s.selectedDate);

  if (!agent) return null;

  const today = new Date().toISOString().slice(0, 10);
  const isViewingOtherDate = selectedDate !== today;
  const viewingLabel = isViewingOtherDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  const xpPct = agent.xpToNext > 0 ? (agent.xp / agent.xpToNext) * 100 : 0;

  return (
    <>
      {/* Stats panel — fixed top-left */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 rounded-xl border border-steel bg-void-light/90 p-3 backdrop-blur-sm">
        <div className="font-display text-xs tracking-wider text-arcane-light uppercase">
          Lv.{agent.level} Adventurer
        </div>

        {/* HP bar */}
        <div className="flex items-center gap-2">
          <span className="w-6 text-[10px] text-rift-light font-mono">HP</span>
          <div className="h-1.5 w-24 rounded-full bg-void-lighter overflow-hidden">
            <div
              className="h-full rounded-full bg-rift transition-all"
              style={{ width: `${(agent.hp / agent.maxHp) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-ash font-mono">{agent.hp}/{agent.maxHp}</span>
        </div>

        {/* XP bar */}
        <div className="flex items-center gap-2">
          <span className="w-6 text-[10px] text-arcane-light font-mono">XP</span>
          <div className="h-1.5 w-24 rounded-full bg-void-lighter overflow-hidden">
            <div
              className="h-full rounded-full bg-arcane transition-all"
              style={{ width: `${xpPct}%` }}
            />
          </div>
          <span className="text-[10px] text-ash font-mono">{agent.xp}/{agent.xpToNext}</span>
        </div>

        {/* Gold */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-ember font-mono">Gold: {agent.gold}</span>
        </div>

        {/* Streak */}
        {agent.streakDays > 0 && (
          <div className="text-[10px] text-spark font-mono">
            Streak: {agent.streakDays}d ({agent.streakTier})
          </div>
        )}

        {/* Date indicator — shown when viewing a date other than today */}
        {viewingLabel && (
          <div className="mt-1 rounded-md border border-drift/30 bg-drift/5 px-2 py-1 text-center">
            <span className="font-mono text-[10px] text-drift-light">
              Viewing: {viewingLabel}
            </span>
          </div>
        )}
      </div>

      {/* Buttons — fixed top-right */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <button
          onClick={() => setShowHowToPlay(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-steel bg-void-light/90 text-ash backdrop-blur-sm hover:border-arcane hover:text-arcane-light transition-colors"
          title="How to Play"
        >
          <span className="font-mono text-sm">?</span>
        </button>
        <button
          onClick={toggleMute}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-steel bg-void-light/90 text-ash backdrop-blur-sm hover:border-arcane hover:text-arcane-light transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <span className="text-sm">{isMuted ? '\u{1F507}' : '\u{1F509}'}</span>
        </button>
      </div>
    </>
  );
}
