import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '../hooks/useAgent';
import { useSkills, usePurchaseSkill } from '../hooks/useSkills';
import type { SkillDef, AgentSkill } from '../hooks/useSkills';

const CATEGORIES = [
  { id: 'discipline' as const, label: 'Discipline', color: 'drift', icon: '\u{1F9E0}' },
  { id: 'courage' as const, label: 'Courage', color: 'ember', icon: '\u{1F525}' },
  { id: 'wisdom' as const, label: 'Wisdom', color: 'arcane', icon: '\u{1F4D6}' },
  { id: 'luck' as const, label: 'Luck', color: 'verdant', icon: '\u{1F340}' },
];

function getSkillCost(skill: SkillDef, currentLevel: number): number {
  return skill.baseCost + skill.costPerLevel * currentLevel;
}

function SkillProgressBar({
  current,
  max,
  color,
}: {
  current: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (current / max) * 100 : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-void">
      <motion.div
        className={`h-full rounded-full bg-${color}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  );
}

function SkillCard({
  skill,
  agentSkill,
  agentLevel,
  agentXp,
  color,
  allMySkills,
  allSkills,
  onPurchase,
  isPurchasing,
  justUpgraded,
}: {
  skill: SkillDef;
  agentSkill: AgentSkill | undefined;
  agentLevel: number;
  agentXp: number;
  color: string;
  allMySkills: AgentSkill[];
  allSkills: SkillDef[];
  onPurchase: (skillId: string) => void;
  isPurchasing: boolean;
  justUpgraded: boolean;
}) {
  const currentLevel = agentSkill?.level ?? 0;
  const isMaxed = currentLevel >= skill.maxLevel;
  const cost = getSkillCost(skill, currentLevel);
  const levelLocked = agentLevel < skill.levelRequired;

  // Check prerequisite
  let prereqMet = true;
  let prereqName = '';
  if (skill.prerequisiteSkillId) {
    const prereqSkill = allMySkills.find((s) => s.skillId === skill.prerequisiteSkillId);
    prereqMet = !!prereqSkill && prereqSkill.level > 0;
    const prereqDef = allSkills.find((s) => s.id === skill.prerequisiteSkillId);
    prereqName = prereqDef?.name ?? 'Unknown Skill';
  }

  const canAfford = agentXp >= cost;
  const canUpgrade = !isMaxed && !levelLocked && prereqMet && canAfford && !isPurchasing;
  const isLocked = levelLocked || !prereqMet;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-xl border p-4 transition-colors ${
        isLocked
          ? 'border-steel/50 bg-void-light/50 opacity-60'
          : `border-${color}/30 bg-void-light`
      }`}
    >
      {/* Flash animation on purchase */}
      <AnimatePresence>
        {justUpgraded && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={`absolute inset-0 z-10 bg-${color}/20`}
          />
        )}
      </AnimatePresence>

      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-void/60 backdrop-blur-[1px]">
          <div className="text-center">
            <p className="font-mono text-xs text-steel-light">
              {levelLocked
                ? `[LOCKED -- LVL ${skill.levelRequired} REQUIRED]`
                : `[REQUIRES: ${prereqName}]`}
            </p>
          </div>
        </div>
      )}

      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`font-display text-sm font-bold tracking-wider uppercase text-${color}-light`}>
            {skill.name}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-ash">
            {skill.description}
          </p>
        </div>
        <div className="ml-3 shrink-0 text-right">
          <span className={`font-mono text-xs text-${color}-light`}>
            Lv {currentLevel}/{skill.maxLevel}
          </span>
        </div>
      </div>

      {/* Effect description */}
      <p className="mb-3 font-mono text-[10px] text-steel-light">
        Effect: {skill.effect}
      </p>

      {/* Progress bar */}
      <div className="mb-3">
        <SkillProgressBar current={currentLevel} max={skill.maxLevel} color={color} />
      </div>

      {/* Cost and upgrade */}
      <div className="flex items-center justify-between">
        {isMaxed ? (
          <span className={`font-mono text-xs text-${color}`}>MASTERED</span>
        ) : (
          <span
            className={`font-mono text-xs ${canAfford ? 'text-arcane-light' : 'text-rift-light'}`}
          >
            Cost: {cost} XP
          </span>
        )}

        {!isMaxed && !isLocked && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onPurchase(skill.id)}
            disabled={!canUpgrade}
            className={`rounded-lg border px-4 py-1.5 font-display text-xs tracking-wider uppercase transition-all ${
              canUpgrade
                ? `border-${color}/50 bg-${color}/10 text-${color}-light hover:bg-${color}/20`
                : 'cursor-not-allowed border-steel bg-void-lighter text-steel-light opacity-50'
            }`}
          >
            {isPurchasing ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                Upgrading...
              </motion.span>
            ) : currentLevel > 0 ? (
              'Upgrade'
            ) : (
              'Learn'
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export function TrainingGrounds() {
  const { data: agent, isLoading: agentLoading } = useAgent();
  const { data: skillsData, isLoading: skillsLoading } = useSkills();
  const purchaseSkill = usePurchaseSkill();

  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]['id']>('discipline');
  const [recentlyUpgraded, setRecentlyUpgraded] = useState<string | null>(null);

  const skills = skillsData?.skills ?? [];
  const mySkills = skillsData?.mySkills ?? [];

  const categorySkills = skills.filter((s) => s.category === activeCategory);
  const activeCat = CATEGORIES.find((c) => c.id === activeCategory) ?? CATEGORIES[0];

  const handlePurchase = useCallback(
    (skillId: string) => {
      purchaseSkill.mutate(
        { skillId },
        {
          onSuccess: () => {
            setRecentlyUpgraded(skillId);
            setTimeout(() => setRecentlyUpgraded(null), 1200);
          },
        },
      );
    },
    [purchaseSkill],
  );

  const isLoading = agentLoading || skillsLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col px-4 pt-6 pb-4"
    >
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-widest text-parchment uppercase">
              Training Grounds
            </h1>
            <p className="mt-1 font-mono text-sm tracking-wide text-ash">
              // Upgrade Your Abilities
            </p>
          </div>

          {/* XP and Level display */}
          {agent && (
            <div className="shrink-0 text-right">
              <p className="font-mono text-xs text-ash">
                Agent Lv.{' '}
                <span className="text-parchment">{agent.level}</span>
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-arcane-light">
                {agent.xp} XP
              </p>
            </div>
          )}
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-drift via-steel to-transparent" />
      </header>

      {/* Category Tabs */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const catSkillCount = skills.filter((s) => s.category === cat.id).length;
          const learnedCount = skills
            .filter((s) => s.category === cat.id)
            .filter((s) => mySkills.some((ms) => ms.skillId === s.id && ms.level > 0)).length;

          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 transition-all ${
                isActive
                  ? `border-${cat.color} bg-${cat.color}/10`
                  : 'border-steel bg-void-lighter hover:border-steel-light'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              <div className="text-left">
                <span
                  className={`block font-display text-xs tracking-wider uppercase ${
                    isActive ? `text-${cat.color}-light` : 'text-ash'
                  }`}
                >
                  {cat.label}
                </span>
                {catSkillCount > 0 && (
                  <span className="block font-mono text-[9px] text-steel-light">
                    {learnedCount}/{catSkillCount}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center py-16">
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="font-mono text-xs text-steel-light"
          >
            Loading training data...
          </motion.p>
        </div>
      )}

      {/* Skills Grid */}
      {!isLoading && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Category header */}
            <div className="mb-4 flex items-center gap-2">
              <span className="text-lg">{activeCat.icon}</span>
              <h2 className={`font-display text-sm tracking-widest uppercase text-${activeCat.color}-light`}>
                {activeCat.label} Skills
              </h2>
              <div className={`ml-2 h-px flex-1 bg-gradient-to-r from-${activeCat.color}/30 to-transparent`} />
            </div>

            {categorySkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="text-4xl">{activeCat.icon}</span>
                <p className={`font-display text-sm tracking-wider uppercase text-${activeCat.color}-light`}>
                  No skills available yet
                </p>
                <p className="max-w-xs text-xs text-ash">
                  New {activeCat.label.toLowerCase()} skills will be unlocked as you progress.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {categorySkills.map((skill) => {
                  const agentSkill = mySkills.find((ms) => ms.skillId === skill.id);
                  return (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      agentSkill={agentSkill}
                      agentLevel={agent?.level ?? 1}
                      agentXp={agent?.xp ?? 0}
                      color={activeCat.color}
                      allMySkills={mySkills}
                      allSkills={skills}
                      onPurchase={handlePurchase}
                      isPurchasing={
                        purchaseSkill.isPending &&
                        purchaseSkill.variables?.skillId === skill.id
                      }
                      justUpgraded={recentlyUpgraded === skill.id}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Error state */}
      {purchaseSkill.isError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed right-4 bottom-4 left-4 z-50 rounded-lg border border-rift/30 bg-rift/10 px-4 py-3"
        >
          <p className="text-xs text-rift-light">
            {purchaseSkill.error?.message ?? 'Failed to upgrade skill. Try again.'}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
