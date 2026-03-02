import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMissionsByDate, useCreateMission, useCompleteMission, useDeleteMission } from '../hooks/useMissions';
import { useCategories } from '../hooks/useCategories';
import { useAgent } from '../hooks/useAgent';
import { useTriggerEndOfDay } from '../hooks/useRecap';
import type { EndOfDayReport } from '../hooks/useRecap';
import { useHabits, useCreateHabit, useCompleteHabit, useDeleteHabit } from '../hooks/useHabits';
import { useMissionStore } from '../stores/missionStore';
import { MiniHud } from '../components/hud/MiniHud';
import { MissionForm } from '../components/missions/MissionForm';
import { BulkMissionInput } from '../components/missions/BulkMissionInput';
import { CategorySection } from '../components/missions/CategorySection';
import { MissionList } from '../components/missions/MissionList';
import { CompletionToast } from '../components/missions/CompletionToast';
import { DateNavigator } from '../components/missions/DateNavigator';
import { HabitCard } from '../components/missions/HabitCard';
import { HabitForm } from '../components/missions/HabitForm';

export function CommandDeck() {
  const { data: agent, isLoading: agentLoading } = useAgent();
  const selectedDate = useMissionStore((s) => s.selectedDate);
  const { data: dateResponse, isLoading: missionsLoading } = useMissionsByDate(selectedDate);
  const missions = dateResponse?.missions ?? [];
  const isToday = dateResponse?.isToday ?? true;
  const isPast = dateResponse?.isPast ?? false;
  const isFuture = dateResponse?.isFuture ?? false;
  const { data: categories = [] } = useCategories();
  const createMission = useCreateMission();
  const completeMission = useCompleteMission();
  const deleteMission = useDeleteMission();

  const { data: habits = [] } = useHabits();
  const createHabit = useCreateHabit();
  const completeHabit = useCompleteHabit();
  const deleteHabit = useDeleteHabit();

  const [activeTab, setActiveTab] = useState<'tasks' | 'habits'>('tasks');
  const [inputMode, setInputMode] = useState<'single' | 'bulk'>('single');
  const [showEndDayConfirm, setShowEndDayConfirm] = useState(false);
  const [endDayReport, setEndDayReport] = useState<EndOfDayReport | null>(null);

  const triggerEndOfDay = useTriggerEndOfDay();

  const lastCompletion = useMissionStore((s) => s.lastCompletion);
  const setLastCompletion = useMissionStore((s) => s.setLastCompletion);
  const clearLastCompletion = useMissionStore((s) => s.clearLastCompletion);

  // For today: show active + completed. For past/future: show all returned missions.
  const activeMissions = isToday
    ? missions.filter((m) => m.status === 'active')
    : missions;
  // Completed missions for today view (shown separately with read-only badges)
  const completedToday = isToday
    ? missions.filter((m) => m.status === 'completed')
    : [];

  // Group missions by category
  const groupedMissions = useMemo(() => {
    const groups: Record<string, typeof activeMissions> = {};
    const uncategorized: typeof activeMissions = [];

    for (const mission of activeMissions) {
      const catId = mission.category_id ?? mission.categoryId;
      if (catId) {
        if (!groups[catId]) groups[catId] = [];
        groups[catId].push(mission);
      } else {
        uncategorized.push(mission);
      }
    }

    return { groups, uncategorized };
  }, [activeMissions]);

  // Sort categories for display
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [categories]);

  const handleCreateMission = useCallback(
    (data: { title: string; description?: string; difficulty: number; categoryId?: string; isRecurring?: boolean; dueDate?: string }) => {
      createMission.mutate({
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        categoryId: data.categoryId,
        isRecurring: data.isRecurring,
        dueDate: data.dueDate,
      });
    },
    [createMission],
  );

  const handleCompleteMission = useCallback(
    (id: string) => {
      if (!isToday) return;
      completeMission.mutate(id, {
        onSuccess: (result) => {
          setLastCompletion({
            missionId: id,
            xpGained: result.xpGained,
            goldGained: result.goldGained,
            wasCrit: result.wasCrit,
            comboBonus: result.comboBonus,
            leveledUp: result.leveledUp,
            newLevel: result.newLevel,
          });
        },
      });
    },
    [completeMission, setLastCompletion, isToday],
  );

  const handleDeleteMission = useCallback(
    (id: string) => {
      deleteMission.mutate(id);
    },
    [deleteMission],
  );

  const hasCategories = categories.length > 0;
  const hasGroupedMissions = Object.keys(groupedMissions.groups).length > 0 || groupedMissions.uncategorized.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col px-4 pt-6 pb-4"
    >
      {/* Header */}
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-widest text-parchment uppercase">
          Quest Board
        </h1>
        <p className="mt-1 font-mono text-sm tracking-wide text-ash">
          Your daily quests await
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-arcane via-steel to-transparent" />
      </header>

      {/* Date navigator */}
      <div className="mb-4">
        <DateNavigator />
      </div>

      {/* Contextual banners */}
      {isPast && (
        <div className="mb-4 rounded-lg border border-steel bg-void-lighter px-4 py-2 text-center font-mono text-xs text-ash">
          Viewing past log. Read-only.
        </div>
      )}
      {isFuture && (
        <div className="mb-4 rounded-lg border border-drift/30 bg-drift/5 px-4 py-2 text-center font-mono text-xs text-drift-light">
          Planning ahead.
        </div>
      )}

      {/* Agent HUD */}
      <div className="mb-6">
        <MiniHud agent={agent ?? null} isLoading={agentLoading} />
      </div>

      {/* Tasks / Habits tab switcher */}
      <div className="mb-4 flex gap-1 rounded-lg border border-steel bg-void-light p-0.5">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all ${
            activeTab === 'tasks'
              ? 'bg-arcane/15 text-arcane-light'
              : 'text-steel-light hover:text-ash'
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('habits')}
          className={`flex-1 rounded-md px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-all ${
            activeTab === 'habits'
              ? 'bg-arcane/15 text-arcane-light'
              : 'text-steel-light hover:text-ash'
          }`}
        >
          Habits {habits.length > 0 && `(${habits.length})`}
        </button>
      </div>

      {activeTab === 'habits' ? (
        /* ─── Habits Tab ─── */
        <div className="flex flex-1 flex-col">
          <div className="mb-4">
            <HabitForm
              onSubmit={(data) => createHabit.mutate(data)}
              isLoading={createHabit.isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <AnimatePresence>
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onComplete={(id) => {
                    completeHabit.mutate(id, {
                      onSuccess: (result) => {
                        setLastCompletion({
                          missionId: id,
                          xpGained: result.xpGained,
                          goldGained: result.goldGained,
                          wasCrit: false,
                          comboBonus: 0,
                          leveledUp: false,
                        });
                      },
                    });
                  }}
                  onDelete={(id) => deleteHabit.mutate(id)}
                />
              ))}
            </AnimatePresence>
            {habits.length === 0 && (
              <p className="py-8 text-center font-mono text-xs text-steel-light">
                No habits yet. Add a daily habit above.
              </p>
            )}
          </div>
        </div>
      ) : (
      /* ─── Tasks Tab ─── */
      <>
      {/* Mission input — toggle between single and bulk (hidden for past dates) */}
      {!isPast && (
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setInputMode('single')}
            className={`font-mono text-xs uppercase tracking-wider transition-colors ${
              inputMode === 'single' ? 'text-arcane-light' : 'text-steel-light hover:text-ash'
            }`}
          >
            + New Quest
          </button>
          <span className="text-steel-light">/</span>
          <button
            type="button"
            onClick={() => setInputMode('bulk')}
            className={`font-mono text-xs uppercase tracking-wider transition-colors ${
              inputMode === 'bulk' ? 'text-arcane-light' : 'text-steel-light hover:text-ash'
            }`}
          >
            Paste Task List
          </button>
        </div>

        {inputMode === 'single' ? (
          <MissionForm
            onSubmit={handleCreateMission}
            isLoading={createMission.isPending}
            categories={categories}
            defaultDueDate={isFuture ? selectedDate : undefined}
          />
        ) : (
          <BulkMissionInput
            categories={categories}
            onDone={() => setInputMode('single')}
            defaultDueDate={isFuture ? selectedDate : undefined}
          />
        )}
      </div>
      )}

      {/* Active missions count */}
      {!missionsLoading && activeMissions.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ash">
            {isPast ? 'Quests' : isFuture ? 'Scheduled Quests' : 'Active Quests'}
          </h2>
          <span className="font-mono text-xs text-steel-light">
            [{activeMissions.length}]
          </span>
        </div>
      )}

      {/* Mission list — grouped by category or flat */}
      <section className="flex flex-1 flex-col">
        {missionsLoading ? (
          <MissionList
            missions={[]}
            onComplete={handleCompleteMission}
            onDelete={handleDeleteMission}
            isLoading={true}
          />
        ) : hasCategories && hasGroupedMissions ? (
          <>
            {/* Grouped sections */}
            {sortedCategories.map((cat) => {
              const catMissions = groupedMissions.groups[cat.id];
              if (!catMissions || catMissions.length === 0) return null;
              return (
                <CategorySection
                  key={cat.id}
                  name={cat.name}
                  emoji={cat.emoji}
                  color={cat.color}
                  missions={catMissions}
                  onComplete={handleCompleteMission}
                  onDelete={handleDeleteMission}
                  readOnly={isPast}
                  canComplete={isToday}
                />
              );
            })}

            {/* Uncategorized missions */}
            {groupedMissions.uncategorized.length > 0 && (
              <CategorySection
                name="Uncategorized"
                emoji={'\u2731'}
                color="#6B7280"
                missions={groupedMissions.uncategorized}
                onComplete={handleCompleteMission}
                onDelete={handleDeleteMission}
                readOnly={isPast}
                canComplete={isToday}
              />
            )}
          </>
        ) : (
          <MissionList
            missions={activeMissions}
            onComplete={handleCompleteMission}
            onDelete={handleDeleteMission}
            isLoading={false}
            readOnly={isPast}
            canComplete={isToday}
          />
        )}

        {/* Completed missions section (today only) */}
        {isToday && completedToday.length > 0 && (
          <>
            <div className="mt-4 mb-3 flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-wider text-ash">
                Completed Today
              </h2>
              <span className="font-mono text-xs text-steel-light">
                [{completedToday.length}]
              </span>
            </div>
            <MissionList
              missions={completedToday}
              onComplete={handleCompleteMission}
              onDelete={handleDeleteMission}
              isLoading={false}
              readOnly
            />
          </>
        )}
      </section>
      </>
      )}

      {/* End Day — only shown when viewing today */}
      {!missionsLoading && isToday && (
        <div className="mt-6 mb-4">
          <div className="h-px bg-gradient-to-r from-transparent via-steel to-transparent mb-4" />
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowEndDayConfirm(true)}
            disabled={triggerEndOfDay.isPending}
            className="w-full rounded-lg border border-verdant bg-verdant/15 px-6 py-3.5 font-display text-sm uppercase tracking-wider text-verdant-light transition-colors hover:bg-verdant/25 hover:shadow-[0_0_16px_rgba(16,185,129,0.15)] disabled:opacity-50"
          >
            {triggerEndOfDay.isPending ? 'Processing...' : 'End Day'}
          </motion.button>
          {triggerEndOfDay.isError && (
            <p className="mt-2 text-center font-mono text-xs text-rift-light">
              Failed to process end of day.
            </p>
          )}
        </div>
      )}

      {/* End Day Confirmation Dialog */}
      <AnimatePresence>
        {showEndDayConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-xl border border-steel bg-void-light p-6"
            >
              <h3 className="font-display text-base tracking-wider text-parchment uppercase">
                End Day?
              </h3>
              <p className="mt-2 text-sm text-ash">
                This will process all remaining missions, calculate consequences, and generate
                your daily log. Incomplete missions will carry over with penalties.
              </p>
              {activeMissions.length > 0 && (
                <p className="mt-2 font-mono text-xs text-ember-light">
                  {activeMissions.length} active quest{activeMissions.length > 1 ? 's' : ''} will be marked incomplete.
                </p>
              )}
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowEndDayConfirm(false)}
                  className="flex-1 rounded-lg border border-steel bg-void-lighter px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-ash transition-colors hover:bg-steel/20"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    triggerEndOfDay.mutate(undefined, {
                      onSuccess: (report) => {
                        setShowEndDayConfirm(false);
                        setEndDayReport(report);
                      },
                      onError: () => setShowEndDayConfirm(false),
                    });
                  }}
                  disabled={triggerEndOfDay.isPending}
                  className="flex-1 rounded-lg border border-verdant bg-verdant/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-verdant-light transition-colors hover:bg-verdant/20 disabled:opacity-50"
                >
                  {triggerEndOfDay.isPending ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End Day Results Popup */}
      <AnimatePresence>
        {endDayReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEndDayReport(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/85 px-4"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-xl border border-steel bg-void-light"
            >
              {/* Header */}
              <div className="border-b border-steel bg-verdant/10 px-5 py-4 text-center">
                <h3 className="font-display text-lg tracking-widest text-verdant-light uppercase">
                  Day Complete
                </h3>
                <p className="mt-1 font-mono text-xs text-ash">
                  {new Date(endDayReport.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2 px-5 py-4">
                <div className="flex flex-col items-center rounded-lg border border-steel bg-void px-2 py-2">
                  <span className="font-mono text-base font-bold text-verdant">{endDayReport.missionsCompleted}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-steel-light">Done</span>
                </div>
                <div className="flex flex-col items-center rounded-lg border border-steel bg-void px-2 py-2">
                  <span className="font-mono text-base font-bold text-rift-light">{endDayReport.missionsFailed}</span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-steel-light">Failed</span>
                </div>
                <div className="flex flex-col items-center rounded-lg border border-steel bg-void px-2 py-2">
                  <span className={`font-mono text-base font-bold ${endDayReport.consequences.hpDamage > 0 ? 'text-rift-light' : 'text-verdant'}`}>
                    {endDayReport.consequences.hpDamage > 0 ? `-${endDayReport.consequences.hpDamage}` : '0'}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-steel-light">HP</span>
                </div>
                <div className="flex flex-col items-center rounded-lg border border-steel bg-void px-2 py-2">
                  <span className="font-mono text-base font-bold text-ember-light">
                    {endDayReport.agentSnapshot.streakDays}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-steel-light">Streak</span>
                </div>
              </div>

              {/* Streak status */}
              <div className="px-5">
                <div className={`rounded-lg px-3 py-2 text-center font-mono text-xs ${
                  endDayReport.consequences.streakResult.held
                    ? 'bg-verdant/10 text-verdant-light'
                    : 'bg-rift/10 text-rift-light'
                }`}>
                  {endDayReport.consequences.streakResult.held
                    ? `Streak held! ${endDayReport.agentSnapshot.streakDays} day${endDayReport.agentSnapshot.streakDays !== 1 ? 's' : ''} strong`
                    : endDayReport.consequences.streakResult.shieldUsed
                      ? 'Streak shield used! Close call.'
                      : 'Streak broken.'}
                </div>
              </div>

              {/* Narrative */}
              {endDayReport.narrative && (
                <div className="px-5 pt-3">
                  <p className="rounded-lg bg-void-lighter px-3 py-2 text-sm italic leading-relaxed text-bone">
                    {endDayReport.narrative}
                  </p>
                </div>
              )}

              {/* NPC Reactions */}
              <div className="space-y-2 px-5 pt-3">
                {endDayReport.axiomCommentary && (
                  <div className="rounded-lg border border-drift/20 bg-drift/5 px-3 py-2">
                    <p className="text-xs leading-relaxed text-drift-light">
                      <span className="font-display text-[9px] tracking-widest uppercase text-drift">AXIOM: </span>
                      {endDayReport.axiomCommentary}
                    </p>
                  </div>
                )}
                {endDayReport.kaelReaction && (
                  <div className="rounded-lg border border-ember/20 bg-ember/5 px-3 py-2">
                    <p className="text-xs leading-relaxed text-ember-light">
                      <span className="font-display text-[9px] tracking-widest uppercase text-ember">Kael: </span>
                      {endDayReport.kaelReaction}
                    </p>
                  </div>
                )}
              </div>

              {/* Hollow warning */}
              {endDayReport.consequences.hollowStageChange && (
                <div className="mx-5 mt-3 rounded-lg border border-rift/30 bg-rift/10 px-3 py-2 text-center">
                  <p className="font-mono text-xs text-rift-light">
                    The Hollow shifts: {endDayReport.consequences.hollowStageChange.from} &rarr; {endDayReport.consequences.hollowStageChange.to}
                  </p>
                </div>
              )}

              {/* Dismiss */}
              <div className="px-5 py-4">
                <button
                  onClick={() => setEndDayReport(null)}
                  className="w-full rounded-lg border border-steel bg-void-lighter px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-ash transition-colors hover:bg-steel/20 hover:text-parchment"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion toast */}
      {lastCompletion && (
        <CompletionToast
          xpGained={lastCompletion.xpGained}
          goldGained={lastCompletion.goldGained}
          wasCrit={lastCompletion.wasCrit}
          comboBonus={lastCompletion.comboBonus}
          leveledUp={lastCompletion.leveledUp}
          newLevel={lastCompletion.newLevel}
          onDismiss={clearLastCompletion}
        />
      )}
    </motion.div>
  );
}
