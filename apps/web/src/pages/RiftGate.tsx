import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../hooks/useAgent';
import { useHollowStatus, useBossFight } from '../hooks/useBossFight';
import type { HollowStatus, BossFightResult } from '../hooks/useBossFight';

/* ---------- Portal visualization per stage ---------- */

function DormantPortal() {
  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="h-32 w-32 rounded-full border border-steel/30 bg-void-lighter"
        animate={{ opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute h-20 w-20 rounded-full border border-steel/20 bg-void"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute flex items-center justify-center">
        <span className="font-mono text-xs text-steel-light">SEALED</span>
      </div>
    </div>
  );
}

function WhispersPortal() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring */}
      <motion.div
        className="h-36 w-36 rounded-full border border-rift/20 bg-void-lighter"
        animate={{
          scale: [1, 1.03, 1],
          borderColor: ['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.35)', 'rgba(239,68,68,0.2)'],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner void */}
      <motion.div
        className="absolute h-24 w-24 rounded-full border border-rift/15 bg-void"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
      {/* Glitch text */}
      <motion.div
        className="absolute"
        animate={{ x: [-1, 1, -1, 0], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
      >
        <span className="font-mono text-xs text-rift/60">...</span>
      </motion.div>
    </div>
  );
}

function PresencePortal() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Glow ring */}
      <motion.div
        className="absolute h-44 w-44 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Outer ring */}
      <motion.div
        className="h-40 w-40 rounded-full border-2 border-rift/30 bg-void-lighter"
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            '0 0 20px rgba(239,68,68,0.1)',
            '0 0 40px rgba(239,68,68,0.2)',
            '0 0 20px rgba(239,68,68,0.1)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Middle ring */}
      <motion.div
        className="absolute h-28 w-28 rounded-full border border-rift/25 bg-void"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Core */}
      <motion.div
        className="absolute h-14 w-14 rounded-full bg-rift/10"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.span
        className="absolute text-2xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        &#x1F441;&#xFE0F;
      </motion.span>
    </div>
  );
}

function ConfrontationPortal() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Radiant pulse */}
      <motion.div
        className="absolute h-56 w-56 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 60%)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Outer ring */}
      <motion.div
        className="glow-rift h-44 w-44 rounded-full border-2 border-rift/50 bg-void-lighter"
        animate={{
          scale: [1, 1.06, 1],
          boxShadow: [
            '0 0 30px rgba(239,68,68,0.2)',
            '0 0 60px rgba(239,68,68,0.4)',
            '0 0 30px rgba(239,68,68,0.2)',
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Spinning ring */}
      <motion.div
        className="absolute h-36 w-36 rounded-full border border-rift/40"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{
          borderTopColor: 'transparent',
          borderRightColor: 'transparent',
        }}
      />
      {/* Inner core */}
      <motion.div
        className="absolute h-24 w-24 rounded-full border border-rift/30 bg-void"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.div
        className="absolute h-12 w-12 rounded-full bg-rift/20"
        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      <motion.span
        className="hollow-glitch absolute text-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        &#x1F441;&#xFE0F;
      </motion.span>
    </div>
  );
}

function ForcedPortal() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Overwhelming radiance */}
      <motion.div
        className="absolute h-64 w-64 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.25) 0%, rgba(153,27,27,0.1) 40%, transparent 65%)' }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Outer ring */}
      <motion.div
        className="glow-rift h-48 w-48 rounded-full border-2 border-rift bg-void-lighter"
        animate={{
          scale: [1, 1.08, 1],
          boxShadow: [
            '0 0 40px rgba(239,68,68,0.3)',
            '0 0 80px rgba(239,68,68,0.6)',
            '0 0 40px rgba(239,68,68,0.3)',
          ],
        }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Double spinning rings */}
      <motion.div
        className="absolute h-40 w-40 rounded-full border-2 border-rift/50"
        animate={{ rotate: 360 }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        style={{ borderTopColor: 'transparent', borderBottomColor: 'transparent' }}
      />
      <motion.div
        className="absolute h-32 w-32 rounded-full border border-rift/40"
        animate={{ rotate: -360 }}
        transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        style={{ borderLeftColor: 'transparent', borderRightColor: 'transparent' }}
      />
      {/* Pulsing core */}
      <motion.div
        className="absolute h-20 w-20 rounded-full border-2 border-rift/60 bg-void"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      <motion.div
        className="absolute h-10 w-10 rounded-full bg-rift/30"
        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 0.6, repeat: Infinity }}
      />
      <motion.span
        className="hollow-glitch absolute text-4xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        &#x1F441;&#xFE0F;
      </motion.span>
    </div>
  );
}

function PortalVisualization({ stage }: { stage: HollowStatus['stage'] }) {
  switch (stage) {
    case 'dormant':
      return <DormantPortal />;
    case 'whispers':
      return <WhispersPortal />;
    case 'presence':
      return <PresencePortal />;
    case 'confrontation':
      return <ConfrontationPortal />;
    case 'forced':
      return <ForcedPortal />;
    default:
      return <DormantPortal />;
  }
}

/* ---------- Stage message ---------- */
function getStageMessage(stage: HollowStatus['stage'], debt: number): { title: string; desc: string } {
  switch (stage) {
    case 'dormant':
      return {
        title: 'The rift is sealed.',
        desc: 'Your discipline holds. The Hollow has no power here.',
      };
    case 'whispers':
      return {
        title: 'You hear whispers...',
        desc: `The Hollow stirs with ${debt} debt. Finish your missions to silence it.`,
      };
    case 'presence':
      return {
        title: 'A presence looms.',
        desc: `Debt has risen to ${debt}. The Hollow grows stronger. It watches.`,
      };
    case 'confrontation':
      return {
        title: 'THE HOLLOW DEMANDS CONFRONTATION',
        desc: `Debt at ${debt}. You may now challenge The Hollow. Prepare yourself.`,
      };
    case 'forced':
      return {
        title: 'BATTLE REQUIRED',
        desc: `Debt has reached ${debt}. The Hollow will not wait. You must fight or suffer its wrath.`,
      };
    default:
      return { title: 'Status unknown.', desc: '' };
  }
}

/* ---------- Win chance bar ---------- */
function WinChanceBar({ chance }: { chance: number }) {
  const clampedChance = Math.max(0, Math.min(100, chance));
  const barColor =
    clampedChance >= 70
      ? 'bg-verdant'
      : clampedChance >= 40
        ? 'bg-ember'
        : 'bg-rift';

  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between">
        <span className="font-mono text-[10px] text-ash uppercase">Win Chance</span>
        <span className={`font-mono text-xs font-bold ${
          clampedChance >= 70 ? 'text-verdant-light' : clampedChance >= 40 ? 'text-ember-light' : 'text-rift-light'
        }`}>
          {clampedChance}%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-void">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedChance}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ---------- Battle sequence animation ---------- */
function BattleSequence({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState(0); // 0=charge, 1=clash, 2=resolve

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 1000),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => onComplete(), 3000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col items-center justify-center gap-6"
    >
      {/* Battle portal */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="h-48 w-48 rounded-full border-2 border-rift"
          animate={{
            scale: phase === 0 ? [1, 1.2, 1] : phase === 1 ? [1.2, 0.8, 1.5] : [1.5, 1],
            boxShadow:
              phase < 2
                ? [
                    '0 0 40px rgba(239,68,68,0.3)',
                    '0 0 100px rgba(239,68,68,0.8)',
                    '0 0 40px rgba(239,68,68,0.3)',
                  ]
                : ['0 0 100px rgba(239,68,68,0.8)', '0 0 0px rgba(239,68,68,0)'],
            borderColor:
              phase === 2 ? ['rgba(239,68,68,1)', 'rgba(239,68,68,0)'] : undefined,
          }}
          transition={{ duration: phase === 1 ? 0.6 : 1, repeat: phase < 2 ? Infinity : 0 }}
        />

        {/* Spinning attack rings */}
        {phase >= 1 && (
          <>
            <motion.div
              className="absolute h-36 w-36 rounded-full border-2 border-rift"
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: 720, opacity: [0, 1, 0] }}
              transition={{ duration: 1.2 }}
              style={{ borderTopColor: 'transparent', borderBottomColor: 'transparent' }}
            />
            <motion.div
              className="absolute h-28 w-28 rounded-full border-2 border-arcane"
              initial={{ rotate: 0, opacity: 0 }}
              animate={{ rotate: -720, opacity: [0, 1, 0] }}
              transition={{ duration: 1.2, delay: 0.1 }}
              style={{ borderLeftColor: 'transparent', borderRightColor: 'transparent' }}
            />
          </>
        )}

        {/* Center eye */}
        <motion.span
          className="absolute text-4xl"
          animate={{
            scale: phase === 1 ? [1, 2, 1] : [1, 1.1, 1],
            opacity: phase === 2 ? [1, 0] : 1,
          }}
          transition={{ duration: phase === 1 ? 0.4 : 1, repeat: phase < 2 ? Infinity : 0 }}
        >
          &#x1F441;&#xFE0F;
        </motion.span>
      </div>

      {/* Phase text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="font-display text-sm tracking-widest text-rift-light uppercase"
        >
          {phase === 0 && 'Entering the rift...'}
          {phase === 1 && 'CLASHING WITH THE HOLLOW'}
          {phase === 2 && 'Resolving fate...'}
        </motion.p>
      </AnimatePresence>

      {/* Dramatic dots */}
      <motion.div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="inline-block h-2 w-2 rounded-full bg-rift"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ---------- Battle Result Panel ---------- */
function BattleResultPanel({
  result,
  onReturn,
}: {
  result: BossFightResult;
  onReturn: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-1 flex-col items-center justify-center gap-6 px-2"
    >
      {/* Result icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className={`flex h-24 w-24 items-center justify-center rounded-full border-2 ${
          result.victory
            ? 'border-verdant bg-verdant/10'
            : 'border-rift bg-rift/10'
        }`}
      >
        <span className="text-5xl">
          {result.victory ? '\u{2694}\u{FE0F}' : '\u{1F480}'}
        </span>
      </motion.div>

      {/* Result title */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={`font-display text-xl font-bold tracking-widest uppercase ${
          result.victory ? 'text-verdant-light' : 'text-rift-light'
        }`}
      >
        {result.victory ? 'VICTORY' : 'DEFEAT'}
      </motion.h2>

      {/* Narrative */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="max-w-sm text-center text-sm leading-relaxed text-bone"
      >
        {result.narrative}
      </motion.p>

      {/* Stats changes */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-sm rounded-xl border border-steel bg-void-light p-4"
      >
        <h3 className="mb-3 font-display text-xs tracking-widest text-ash uppercase">
          Battle Results
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Debt change */}
          <div className="rounded-lg bg-void-lighter p-3">
            <p className="font-mono text-[10px] text-ash uppercase">Debt</p>
            <p className="font-mono text-sm">
              <span className="text-rift-light">{result.debtBefore}</span>
              <span className="mx-1 text-steel-light">{'\u2192'}</span>
              <span className={result.debtAfter < result.debtBefore ? 'text-verdant-light' : 'text-rift-light'}>
                {result.debtAfter}
              </span>
            </p>
          </div>

          {/* HP change */}
          <div className="rounded-lg bg-void-lighter p-3">
            <p className="font-mono text-[10px] text-ash uppercase">HP</p>
            <p className={`font-mono text-sm ${result.hpChange >= 0 ? 'text-verdant-light' : 'text-rift-light'}`}>
              {result.hpChange > 0 ? '+' : ''}{result.hpChange}
            </p>
          </div>

          {/* XP reward */}
          {result.xpReward > 0 && (
            <div className="rounded-lg bg-void-lighter p-3">
              <p className="font-mono text-[10px] text-ash uppercase">XP Gained</p>
              <p className="font-mono text-sm text-arcane-light">+{result.xpReward}</p>
            </div>
          )}

          {/* Gold reward */}
          {result.goldReward > 0 && (
            <div className="rounded-lg bg-void-lighter p-3">
              <p className="font-mono text-[10px] text-ash uppercase">Gold Gained</p>
              <p className="font-mono text-sm text-ember-light">+{result.goldReward}</p>
            </div>
          )}
        </div>

        {/* Special drop */}
        {result.specialDrop && (
          <div className="mt-3 rounded-lg border border-arcane/30 bg-arcane/10 p-3 text-center">
            <p className="font-mono text-[10px] text-ash uppercase">Special Drop</p>
            <p className="mt-1 font-display text-sm tracking-wider text-arcane-light">
              {result.specialDrop}
            </p>
          </div>
        )}
      </motion.div>

      {/* Return button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <Link
          to="/"
          onClick={(e) => {
            e.preventDefault();
            onReturn();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-steel bg-void-lighter px-6 py-3 font-display text-xs tracking-wider text-parchment uppercase transition-colors hover:border-arcane hover:bg-arcane/10"
        >
          Return to Command Deck
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Main RiftGate Component ---------- */
type RiftPhase = 'idle' | 'battling' | 'result';

export function RiftGate() {
  const { data: agent, isLoading: agentLoading } = useAgent();
  const { data: hollow, isLoading: hollowLoading } = useHollowStatus();
  const bossFight = useBossFight();

  const [phase, setPhase] = useState<RiftPhase>('idle');
  const [battleResult, setBattleResult] = useState<BossFightResult | null>(null);

  const isLoading = agentLoading || hollowLoading;

  const stage = hollow?.stage ?? 'dormant';
  const debt = hollow?.debt ?? 0;
  const canFight = hollow?.canFight ?? false;
  const stageInfo = getStageMessage(stage, debt);

  const handleFight = useCallback(() => {
    setPhase('battling');
    bossFight.mutate(undefined, {
      onSuccess: (result) => {
        setBattleResult(result);
        // BattleSequence onComplete will transition to result
      },
      onError: () => {
        setPhase('idle');
      },
    });
  }, [bossFight]);

  const handleBattleAnimationComplete = useCallback(() => {
    if (battleResult) {
      setPhase('result');
    }
  }, [battleResult]);

  const handleReturn = useCallback(() => {
    setPhase('idle');
    setBattleResult(null);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col px-4 pt-6 pb-4"
    >
      {/* Header */}
      <header className="mb-6 shrink-0">
        <h1 className="font-display text-2xl font-bold tracking-widest text-parchment uppercase">
          Rift Gate
        </h1>
        <p className="mt-1 font-mono text-sm tracking-wide text-ash">
          // Face The Hollow
        </p>
        <div className="mt-3 h-px bg-gradient-to-r from-rift via-steel to-transparent" />
      </header>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center py-16">
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="font-mono text-xs text-steel-light"
          >
            Scanning rift frequencies...
          </motion.p>
        </div>
      )}

      {/* Main content */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          {/* IDLE - Show portal and stats */}
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col"
            >
              {/* Forced battle warning */}
              {stage === 'forced' && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-lg border border-rift/50 bg-rift/10 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="text-base"
                    >
                      &#x26A0;&#xFE0F;
                    </motion.span>
                    <p className="font-display text-xs font-bold tracking-wider text-rift-light uppercase">
                      WARNING: You cannot leave without fighting The Hollow.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Portal visualization */}
              <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
                <PortalVisualization stage={stage} />

                {/* Stage message */}
                <div className="mt-4 max-w-sm text-center">
                  <h2
                    className={`font-display text-sm font-bold tracking-widest uppercase ${
                      stage === 'dormant'
                        ? 'text-steel-light'
                        : stage === 'whispers'
                          ? 'text-rift/60'
                          : stage === 'presence'
                            ? 'text-rift-light/80'
                            : 'text-rift-light'
                    }`}
                  >
                    {stageInfo.title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-ash">
                    {stageInfo.desc}
                  </p>
                </div>
              </div>

              {/* Stats Panel */}
              {stage !== 'dormant' && agent && hollow && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl border border-steel bg-void-light p-4"
                >
                  <h3 className="mb-3 font-display text-xs tracking-widest text-ash uppercase">
                    Battle Assessment
                  </h3>

                  <div className="mb-4 grid grid-cols-2 gap-4">
                    {/* Your power */}
                    <div>
                      <p className="mb-2 font-mono text-[10px] text-arcane-light uppercase">
                        Your Power
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-ash">Level</span>
                          <span className="font-mono text-xs text-parchment">{agent.level}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-ash">HP</span>
                          <span className="font-mono text-xs text-rift-light">
                            {agent.hp}/{agent.maxHp}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-ash">Streak</span>
                          <span className="font-mono text-xs text-ember-light">
                            {agent.streakDays}d
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Hollow's power */}
                    <div>
                      <p className="mb-2 font-mono text-[10px] text-rift-light uppercase">
                        Hollow&apos;s Power
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-xs text-ash">Debt</span>
                          <span className="font-mono text-xs text-rift-light">{hollow.debt}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-ash">Strength</span>
                          <span className="font-mono text-xs text-rift-light">{hollow.strength}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-ash">Stage</span>
                          <span className="font-mono text-xs capitalize text-rift-light">{hollow.stage}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Win chance */}
                  <WinChanceBar chance={hollow.winChance} />
                </motion.div>
              )}

              {/* Fight button */}
              {canFight && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={handleFight}
                    disabled={bossFight.isPending}
                    className={`glow-rift w-full rounded-xl border-2 py-4 font-display text-sm font-bold tracking-widest uppercase transition-all ${
                      stage === 'forced'
                        ? 'border-rift bg-rift/20 text-rift-light hover:bg-rift/30'
                        : 'border-rift/50 bg-rift/10 text-rift-light hover:border-rift hover:bg-rift/20'
                    }`}
                  >
                    {stage === 'forced' ? (
                      <motion.span
                        animate={{ opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        Battle The Hollow NOW
                      </motion.span>
                    ) : (
                      'Challenge The Hollow'
                    )}
                  </motion.button>
                </motion.div>
              )}

              {/* Dormant - no fight */}
              {stage === 'dormant' && (
                <div className="mb-4 text-center">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 rounded-lg border border-steel bg-void-lighter px-5 py-2.5 font-display text-xs tracking-wider text-ash uppercase transition-colors hover:border-arcane hover:text-parchment"
                  >
                    Return to Command Deck
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* BATTLING - Show battle animation */}
          {phase === 'battling' && (
            <motion.div
              key="battling"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col"
            >
              <BattleSequence onComplete={handleBattleAnimationComplete} />
            </motion.div>
          )}

          {/* RESULT - Show battle outcome */}
          {phase === 'result' && battleResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col"
            >
              <BattleResultPanel result={battleResult} onReturn={handleReturn} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Error state */}
      <AnimatePresence>
        {bossFight.isError && phase === 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed right-4 bottom-4 left-4 z-50 rounded-lg border border-rift/30 bg-rift/10 px-4 py-3"
          >
            <p className="text-xs text-rift-light">
              {bossFight.error?.message ?? 'The Hollow deflected your attack. Try again.'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
