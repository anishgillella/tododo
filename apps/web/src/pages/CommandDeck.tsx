import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMissions, useCreateMission, useCompleteMission, useDeleteMission } from '../hooks/useMissions';
import { useAgent } from '../hooks/useAgent';
import { useMissionStore } from '../stores/missionStore';
import { MiniHud } from '../components/hud/MiniHud';
import { MissionForm } from '../components/missions/MissionForm';
import { MissionList } from '../components/missions/MissionList';
import { CompletionToast } from '../components/missions/CompletionToast';

export function CommandDeck() {
  const { data: agent, isLoading: agentLoading } = useAgent();
  const { data: missions = [], isLoading: missionsLoading } = useMissions();
  const createMission = useCreateMission();
  const completeMission = useCompleteMission();
  const deleteMission = useDeleteMission();

  const lastCompletion = useMissionStore((s) => s.lastCompletion);
  const setLastCompletion = useMissionStore((s) => s.setLastCompletion);
  const clearLastCompletion = useMissionStore((s) => s.clearLastCompletion);

  // Filter to only active missions
  const activeMissions = missions.filter((m) => m.status === 'active');

  const handleCreateMission = useCallback(
    (data: { title: string; description?: string; difficulty: number }) => {
      createMission.mutate({
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
      });
    },
    [createMission],
  );

  const handleCompleteMission = useCallback(
    (id: string) => {
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
    [completeMission, setLastCompletion],
  );

  const handleDeleteMission = useCallback(
    (id: string) => {
      deleteMission.mutate(id);
    },
    [deleteMission],
  );

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
          Command Deck
        </h1>
        <p className="mt-1 font-mono text-sm tracking-wide text-ash">
          // Mission Control
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-arcane via-steel to-transparent" />
      </header>

      {/* Agent HUD */}
      <div className="mb-6">
        <MiniHud agent={agent ?? null} isLoading={agentLoading} />
      </div>

      {/* Mission form */}
      <div className="mb-4">
        <MissionForm
          onSubmit={handleCreateMission}
          isLoading={createMission.isPending}
        />
      </div>

      {/* Active missions count */}
      {!missionsLoading && activeMissions.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ash">
            Active Missions
          </h2>
          <span className="font-mono text-xs text-steel-light">
            [{activeMissions.length}]
          </span>
        </div>
      )}

      {/* Mission list */}
      <section className="flex flex-1 flex-col">
        <MissionList
          missions={activeMissions}
          onComplete={handleCompleteMission}
          onDelete={handleDeleteMission}
          isLoading={missionsLoading}
        />
      </section>

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
