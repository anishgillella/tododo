import { useState } from 'react';
import { useCombatStore } from '../../stores/combatStore';
import { useCombatAction, useFleeCombat, useResolveCombat } from '../../hooks/useCombat';
import { PLAYER_ABILITIES, getUnlockedAbilities } from '@tododo/shared';

function HPBar({ current, max, label, color }: { current: number; max: number; label: string; color: string }) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-bold">{label}</span>
        <span>{current} / {max}</span>
      </div>
      <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function CombatHUD() {
  const { activeSession } = useCombatStore();
  const combatAction = useCombatAction();
  const fleeCombat = useFleeCombat();
  const resolveCombat = useResolveCombat();
  const [showAbilities, setShowAbilities] = useState(false);
  const [resolveResult, setResolveResult] = useState<{ xpGained: number; goldGained: number; lootDrops: string[] } | null>(null);

  if (!activeSession) return null;

  const { player, enemy, phase, turn, turnLog, cooldowns, sessionId } = activeSession;
  const isPlayerTurn = phase === 'player_turn';
  const isCombatOver = phase === 'victory' || phase === 'defeat' || phase === 'fled';

  const unlockedAbilities = getUnlockedAbilities(player.level);
  const lastLogs = turnLog.slice(-6);

  const handleAttack = () => {
    if (!isPlayerTurn || combatAction.isPending) return;
    combatAction.mutate({ sessionId, action: { type: 'attack' } });
    setShowAbilities(false);
  };

  const handleAbility = (abilityId: string) => {
    if (!isPlayerTurn || combatAction.isPending) return;
    combatAction.mutate({ sessionId, action: { type: 'ability', abilityId } });
    setShowAbilities(false);
  };

  const handleDefend = () => {
    if (!isPlayerTurn || combatAction.isPending) return;
    combatAction.mutate({ sessionId, action: { type: 'defend' } });
    setShowAbilities(false);
  };

  const handleFlee = () => {
    if (!isPlayerTurn || fleeCombat.isPending) return;
    fleeCombat.mutate({ sessionId });
  };

  const handleResolve = async () => {
    try {
      const result = await resolveCombat.mutateAsync({ sessionId });
      setResolveResult(result);
    } catch {
      // still end combat
      useCombatStore.getState().endCombat();
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Top bar: HP bars */}
      <div className="pointer-events-auto absolute top-4 left-4 right-4 flex gap-8">
        <div className="flex-1 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-blue-500/30">
          <HPBar current={player.hp} max={player.maxHp} label={`${player.name} (Lv${player.level})`} color="#3B82F6" />
        </div>
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-600/30 flex items-center">
          <span className="text-sm font-mono text-gray-300">Turn {turn}</span>
        </div>
        <div className="flex-1 bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-red-500/30">
          <HPBar current={enemy.hp} max={enemy.maxHp} label={`${enemy.name}`} color="#EF4444" />
        </div>
      </div>

      {/* Turn indicator */}
      {!isCombatOver && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2">
          <div className={`px-4 py-1 rounded-full text-sm font-bold ${
            isPlayerTurn ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {isPlayerTurn ? 'YOUR TURN' : 'ENEMY TURN'}
          </div>
        </div>
      )}

      {/* Turn log */}
      <div className="pointer-events-auto absolute top-28 left-4 w-80 bg-black/60 backdrop-blur-sm rounded-lg p-3 border border-gray-700/30 max-h-48 overflow-y-auto">
        {lastLogs.map((log, i) => (
          <div
            key={i}
            className={`text-xs py-0.5 ${
              log.actor === 'player' ? 'text-blue-300' : 'text-red-300'
            } ${log.isCrit ? 'font-bold' : ''}`}
          >
            {log.message}
          </div>
        ))}
        {lastLogs.length === 0 && (
          <div className="text-xs text-gray-500">Combat begins...</div>
        )}
      </div>

      {/* Action buttons (bottom) */}
      {isPlayerTurn && !isCombatOver && (
        <div className="pointer-events-auto absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
          {showAbilities && (
            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-purple-500/30 flex flex-wrap gap-2 max-w-md justify-center">
              {unlockedAbilities.map((ability) => {
                const onCooldown = (cooldowns[ability.id] ?? 0) > 0;
                return (
                  <button
                    key={ability.id}
                    onClick={() => handleAbility(ability.id)}
                    disabled={onCooldown || combatAction.isPending}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      onCooldown
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                    title={ability.description}
                  >
                    {ability.name}
                    {onCooldown && ` (${cooldowns[ability.id]})`}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleAttack}
              disabled={combatAction.isPending}
              className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50"
            >
              Attack
            </button>
            <button
              onClick={() => setShowAbilities(!showAbilities)}
              disabled={combatAction.isPending}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50"
            >
              Abilities
            </button>
            <button
              onClick={handleDefend}
              disabled={combatAction.isPending}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50"
            >
              Defend
            </button>
            <button
              onClick={handleFlee}
              disabled={fleeCombat.isPending}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-bold text-sm transition-all disabled:opacity-50"
            >
              Flee
            </button>
          </div>
        </div>
      )}

      {/* Victory/Defeat overlay */}
      {isCombatOver && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
          <div className={`bg-black/80 backdrop-blur-md rounded-2xl p-8 border-2 max-w-md text-center ${
            phase === 'victory'
              ? 'border-yellow-500/50'
              : phase === 'defeat'
              ? 'border-red-500/50'
              : 'border-gray-500/50'
          }`}>
            <h2 className={`text-3xl font-bold mb-4 ${
              phase === 'victory' ? 'text-yellow-400' : phase === 'defeat' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {phase === 'victory' ? 'VICTORY!' : phase === 'defeat' ? 'DEFEAT' : 'ESCAPED'}
            </h2>

            {phase === 'victory' && (
              <div className="text-gray-300 mb-4 space-y-1 text-sm">
                <p>You defeated {enemy.name}!</p>
                {resolveResult && (
                  <>
                    <p className="text-yellow-300">+{resolveResult.xpGained} XP</p>
                    <p className="text-yellow-300">+{resolveResult.goldGained} Gold</p>
                    {resolveResult.lootDrops.length > 0 && (
                      <p className="text-purple-300">Loot: {resolveResult.lootDrops.join(', ')}</p>
                    )}
                  </>
                )}
              </div>
            )}

            {phase === 'defeat' && (
              <p className="text-gray-400 mb-4 text-sm">{enemy.name} was too powerful...</p>
            )}

            {phase === 'fled' && (
              <p className="text-gray-400 mb-4 text-sm">You escaped from {enemy.name}.</p>
            )}

            <button
              onClick={resolveResult ? () => useCombatStore.getState().endCombat() : handleResolve}
              disabled={resolveCombat.isPending}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-all disabled:opacity-50"
            >
              {resolveCombat.isPending ? 'Resolving...' : resolveResult ? 'Return' : 'Collect Rewards'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
