import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { missions, agents, gameEvents, users, agentSkills, inventory } from '../db/schema';
import {
  calculateMissionXp,
  calculateMissionGold,
  processLevelUp,
  getComboBonus,
  getStreakTier,
  getStreakMultiplier,
  getHollowStage,
  rollLootDrop,
  shouldStreakHold,
  decayStreak,
  calculateFailureDamage,
  xpForLevel,
  getAgentCombatStats,
  calculateEncounterChance,
  selectRandomCreature,
  scaleCreatureToLevel,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  LOOT_DROP_CHANCE,
  type MissionDifficulty,
  type StreakTier,
  type DifficultyMode,
  type HollowStage,
  OVERDRIVE_DURATION_MS,
  TRAIT_SHIFT_COMPLETE,
  TRAIT_SHIFT_FAIL,
  TRAIT_MIN,
  TRAIT_MAX,
  JACKPOT_CHANCE,
} from '@tododo/shared';

// ── Return Types ─────────────────────────────────────────────────────

export interface LevelUpRewards {
  hpGained: number;
  attackGained: number;
  defenseGained: number;
}

export interface EncounterInfo {
  creatureId: string;
  creatureName: string;
  creatureShape: string;
  sessionId: string;
}

export interface CompleteMissionResult {
  mission: Record<string, unknown>;
  xpGained: number;
  goldGained: number;
  wasCrit: boolean;
  lootDrop: string | null;
  comboBonus: number;
  comboCount: number;
  overdriveTriggered: boolean;
  leveledUp: boolean;
  newLevel?: number;
  levelUpRewards?: LevelUpRewards;
  encounter?: EncounterInfo;
  achievements?: { achievementId: string; name: string; tier: string; rewards: { xp: number; gold: number; title?: string } }[];
  streakUpdate?: {
    days: number;
    tier: StreakTier;
    multiplier: number;
  };
  events: string[];
}

// ── Active Effects from Skills + Equipment ──────────────────────────

export interface ActiveEffects {
  xp_bonus_percent: number;
  gold_bonus_percent: number;
  crit_chance_percent: number;
  crit_multiplier_bonus: number;
  loot_drop_chance_percent: number;
  combo_bonus_xp: number;
  hard_mission_xp_bonus_percent: number;
  boss_win_chance_percent: number;
  failure_damage_reduction_percent: number;
  streak_threshold_reduction_percent: number;
  max_hp_bonus: number;
  max_energy_bonus: number;
  gold_range_percent: number;
  loot_quality_bonus: number;
  jackpot_chance_percent: number;
  reputation_gain_percent: number;
}

function emptyEffects(): ActiveEffects {
  return {
    xp_bonus_percent: 0,
    gold_bonus_percent: 0,
    crit_chance_percent: 0,
    crit_multiplier_bonus: 0,
    loot_drop_chance_percent: 0,
    combo_bonus_xp: 0,
    hard_mission_xp_bonus_percent: 0,
    boss_win_chance_percent: 0,
    failure_damage_reduction_percent: 0,
    streak_threshold_reduction_percent: 0,
    max_hp_bonus: 0,
    max_energy_bonus: 0,
    gold_range_percent: 0,
    loot_quality_bonus: 0,
    jackpot_chance_percent: 0,
    reputation_gain_percent: 0,
  };
}

/** Aggregate all active skill effects and equipped item effects for an agent */
export async function getActiveEffects(agentId: string): Promise<ActiveEffects> {
  const effects = emptyEffects();

  // Read agent skills
  const skills = await db
    .select()
    .from(agentSkills)
    .where(eq(agentSkills.agentId, agentId));

  for (const skill of skills) {
    if (!skill.effectJson) continue;
    try {
      const parsed = JSON.parse(skill.effectJson) as { type: string; value: number };
      if (parsed.type in effects) {
        (effects as unknown as Record<string, number>)[parsed.type] += parsed.value;
      }
    } catch { /* skip invalid */ }
  }

  // Read equipped inventory items
  const equippedItems = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.agentId, agentId), eq(inventory.equipped, true)));

  for (const item of equippedItems) {
    if (!item.effectJson) continue;
    try {
      const parsed = JSON.parse(item.effectJson) as { type: string; value: number };
      if (parsed.type in effects) {
        (effects as unknown as Record<string, number>)[parsed.type] += parsed.value;
      }
    } catch { /* skip invalid */ }
  }

  return effects;
}

export interface GameState {
  agent: Record<string, unknown> & { xpToNext: number };
  activeMissions: Record<string, unknown>[];
  hollowStage: HollowStage;
  isJackpotDay: boolean;
  dailyStats: {
    completed: number;
    failed: number;
    total: number;
  };
}

export interface EndOfDayResult {
  completionRate: number;
  missionsCompleted: number;
  missionsFailed: number;
  missionsCarriedOver: number;
  hpDamage: number;
  streakHeld: boolean;
  newStreakDays: number;
  newStreakTier: StreakTier;
  debtAdded: number;
  events: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────

function clampTrait(value: number): number {
  return Math.min(TRAIT_MAX, Math.max(TRAIT_MIN, value));
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Deterministic jackpot check seeded by date so it's consistent within a day */
export function isJackpotDay(dateStr?: string): boolean {
  const seed = dateStr ?? todayDateString();
  // Simple hash from date string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  // Normalize to 0-1 range
  const normalized = Math.abs(hash % 10000) / 10000;
  return normalized < JACKPOT_CHANCE;
}

async function getOrCreateAgent(userId: string) {
  let agentRows = await db
    .select()
    .from(agents)
    .where(eq(agents.userId, userId));

  if (agentRows.length === 0) {
    // Ensure user exists
    const existingUsers = await db.select().from(users).where(eq(users.id, userId));
    if (existingUsers.length === 0) {
      await db.insert(users).values({
        id: userId,
        username: 'Adventurer',
        createdAt: new Date().toISOString(),
      });
    }
    const agentId = nanoid();
    await db.insert(agents).values({ id: agentId, userId });
    agentRows = await db.select().from(agents).where(eq(agents.userId, userId));
  }

  return agentRows[0];
}

async function logGameEvent(userId: string, type: string, data: Record<string, unknown>) {
  await db.insert(gameEvents).values({
    id: nanoid(),
    userId,
    type,
    data: JSON.stringify(data),
    createdAt: new Date().toISOString(),
  });
}

async function getUserMode(userId: string): Promise<DifficultyMode> {
  const userRows = await db.select().from(users).where(eq(users.id, userId));
  if (userRows.length === 0) return 'drifter';
  return (userRows[0].difficultyMode ?? 'drifter') as DifficultyMode;
}

// ── completeMission ──────────────────────────────────────────────────

export async function completeMission(
  missionId: string,
  userId: string,
): Promise<CompleteMissionResult> {
  // Get mission
  const missionRows = await db
    .select()
    .from(missions)
    .where(and(eq(missions.id, missionId), eq(missions.userId, userId)));

  if (missionRows.length === 0) {
    throw new Error('Mission not found');
  }

  const mission = missionRows[0];
  if (mission.status !== 'active') {
    throw new Error('Mission is not active');
  }

  // Get agent
  const agent = await getOrCreateAgent(userId);
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const difficulty = (mission.difficulty ?? 2) as MissionDifficulty;
  const streakTier = (agent.streakTier ?? 'none') as StreakTier;

  // Get active effects from skills + equipment
  const effects = await getActiveEffects(agent.id);

  // Determine modifiers
  const isOverdrive = agent.overdriveUntil
    ? new Date(agent.overdriveUntil) > new Date()
    : false;
  const jackpotDay = isJackpotDay(today);

  // Calculate XP with skill bonuses
  const skillXpBonus = effects.xp_bonus_percent / 100;
  const hardMissionBonus = (difficulty >= 4 ? effects.hard_mission_xp_bonus_percent / 100 : 0);
  const totalXpBonus = skillXpBonus + hardMissionBonus;

  // Crit with skill bonuses
  const effectiveCritChance = CRIT_CHANCE + effects.crit_chance_percent / 100;
  const effectiveCritMult = CRIT_MULTIPLIER + effects.crit_multiplier_bonus;
  const wasCrit = Math.random() < effectiveCritChance;
  const critMult = wasCrit ? effectiveCritMult : 1;

  const { xp: baseXp } = calculateMissionXp(difficulty, streakTier, totalXpBonus);
  // Re-apply crit with skill-modified multiplier (calculateMissionXp uses default crit, so we recalc)
  const streakMult = getStreakMultiplier(streakTier);
  const base = { 1: 15, 2: 30, 3: 45, 4: 60, 5: 75 }[difficulty] ?? 30;
  const calculatedXp = Math.floor(base * streakMult * (1 + totalXpBonus) * critMult);

  // Calculate gold with skill bonuses
  let goldGained = calculateMissionGold(difficulty, jackpotDay, isOverdrive);
  goldGained = Math.floor(goldGained * (1 + effects.gold_bonus_percent / 100));

  // Combo with skill bonus
  const comboCount = (agent.comboCount ?? 0) + 1;
  const comboBonus = getComboBonus(comboCount) + (comboCount >= 2 ? effects.combo_bonus_xp : 0);

  // Total XP
  const totalXp = calculatedXp + comboBonus;

  // New totals
  const newXp = (agent.xp ?? 0) + totalXp;
  const newGold = (agent.gold ?? 0) + goldGained;

  // Overdrive check (combo >= 5)
  let overdriveTriggered = false;
  let newOverdriveUntil = agent.overdriveUntil;
  if (comboCount >= 5 && !isOverdrive) {
    overdriveTriggered = true;
    newOverdriveUntil = new Date(Date.now() + OVERDRIVE_DURATION_MS).toISOString();
  }

  // Loot drop with skill bonus
  const effectiveLootChance = LOOT_DROP_CHANCE + effects.loot_drop_chance_percent / 100;
  const lootDropped = Math.random() < effectiveLootChance;
  const lootDrop = lootDropped ? 'mystery_item' : null;

  // Level up (can multi-level)
  const oldLevel = agent.level ?? 1;
  const { newLevel, remainingXp, leveledUp } = processLevelUp(oldLevel, newXp);

  // Level-up stat scaling: +5 HP, +2 ATK, +1 DEF per level gained
  let levelUpRewards: LevelUpRewards | undefined;
  const agentUpdate: Record<string, unknown> = {
    xp: remainingXp,
    level: newLevel,
    gold: newGold,
    comboCount,
    lastCompletionDate: now,
    discipline: clampTrait((agent.discipline ?? 0.5) + TRAIT_SHIFT_COMPLETE),
    courage: clampTrait((agent.courage ?? 0.5) + TRAIT_SHIFT_COMPLETE),
    streakDays: agent.streakDays ?? 0,
    streakTier: agent.streakTier ?? 'none',
    overdriveUntil: newOverdriveUntil,
  };

  if (leveledUp) {
    const levelsGained = newLevel - oldLevel;
    const newStats = getAgentCombatStats(newLevel);
    const oldStats = getAgentCombatStats(oldLevel);
    const hpGained = newStats.maxHp - oldStats.maxHp;
    const attackGained = newStats.attack - oldStats.attack;
    const defenseGained = newStats.defense - oldStats.defense;

    levelUpRewards = { hpGained, attackGained, defenseGained };
    agentUpdate.maxHp = newStats.maxHp;
    agentUpdate.attack = newStats.attack;
    agentUpdate.defense = newStats.defense;
    // Heal by the HP increase amount
    agentUpdate.hp = Math.min(newStats.maxHp, (agent.hp ?? 100) + hpGained);
  }

  // Streak update: check if this is a new day compared to lastCompletionDate
  let newStreakDays = agent.streakDays ?? 0;
  const lastDate = agent.lastCompletionDate ? agent.lastCompletionDate.slice(0, 10) : null;

  if (lastDate !== today) {
    newStreakDays += 1;
  }

  const newStreakTier = getStreakTier(newStreakDays);
  const newStreakMultiplier = getStreakMultiplier(newStreakTier);
  agentUpdate.streakDays = newStreakDays;
  agentUpdate.streakTier = newStreakTier;

  // Build events list
  const events: string[] = ['mission_complete'];
  if (wasCrit) events.push('critical_hit');
  if (comboBonus > 0) events.push(`combo_x${comboCount}`);
  if (overdriveTriggered) events.push('overdrive_activated');
  if (lootDropped) events.push('loot_drop');
  if (leveledUp) events.push(`level_up_${newLevel}`);

  // Update agent in DB
  await db
    .update(agents)
    .set(agentUpdate)
    .where(eq(agents.id, agent.id));

  // Mark mission complete
  await db
    .update(missions)
    .set({
      status: 'completed',
      completedAt: now,
      xpReward: totalXp,
      goldReward: goldGained,
    })
    .where(eq(missions.id, missionId));

  // Log game event
  await logGameEvent(userId, 'mission_complete', {
    missionId,
    xpGained: totalXp,
    goldGained,
    wasCrit,
    comboCount,
    comboBonus,
    leveledUp,
    newLevel,
    lootDrop,
    overdriveTriggered,
    levelUpRewards,
  });

  if (leveledUp) {
    await logGameEvent(userId, 'level_up', {
      oldLevel,
      newLevel,
      rewards: levelUpRewards,
    });
  }

  // Check achievements
  let newAchievements: { achievementId: string; name: string; tier: string; rewards: { xp: number; gold: number; title?: string } }[] = [];
  try {
    const { checkAndAwardAchievements } = await import('./achievementService');
    newAchievements = await checkAndAwardAchievements(userId);
    if (newAchievements.length > 0) events.push('achievement_unlocked');
  } catch { /* skip on error */ }

  // Random encounter check
  let encounter: EncounterInfo | undefined;
  const encounterChance = calculateEncounterChance(difficulty, effects.loot_drop_chance_percent);
  if (Math.random() < encounterChance) {
    try {
      const { startCombat } = await import('./combatService');
      const creature = selectRandomCreature(newLevel);
      const combatState = await startCombat(userId, 'encounter', creature.id);
      encounter = {
        creatureId: creature.id,
        creatureName: creature.name,
        creatureShape: creature.shape,
        sessionId: combatState.sessionId,
      };
      events.push('encounter_triggered');
    } catch { /* silently skip encounter on error */ }
  }

  // Fetch updated mission for response
  const updatedMission = await db.select().from(missions).where(eq(missions.id, missionId));

  return {
    mission: updatedMission[0],
    xpGained: totalXp,
    goldGained,
    wasCrit,
    lootDrop,
    comboBonus,
    comboCount,
    overdriveTriggered,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    levelUpRewards,
    encounter,
    achievements: newAchievements.length > 0 ? newAchievements : undefined,
    streakUpdate: {
      days: newStreakDays,
      tier: newStreakTier,
      multiplier: newStreakMultiplier,
    },
    events,
  };
}

// ── getGameState ─────────────────────────────────────────────────────

export async function getGameState(userId: string): Promise<GameState> {
  const agent = await getOrCreateAgent(userId);
  const today = todayDateString();

  // Active missions
  const activeMissions = await db
    .select()
    .from(missions)
    .where(and(eq(missions.userId, userId), eq(missions.status, 'active')));

  // Daily stats: count completed and failed missions for today
  const allTodayMissions = await db
    .select()
    .from(missions)
    .where(eq(missions.userId, userId));

  const todayCompleted = allTodayMissions.filter(
    (m) => m.status === 'completed' && m.completedAt && m.completedAt.slice(0, 10) === today,
  ).length;

  const todayFailed = allTodayMissions.filter(
    (m) => m.status === 'failed' && m.completedAt && m.completedAt.slice(0, 10) === today,
  ).length;

  // Total includes active missions (today's workload) plus completed/failed today
  const todayCreated = allTodayMissions.filter(
    (m) => m.createdAt && m.createdAt.slice(0, 10) === today,
  ).length;

  const totalForDay = Math.max(todayCreated, activeMissions.length + todayCompleted + todayFailed);

  // Hollow stage
  const hollowStage = getHollowStage(agent.debt ?? 0);

  // Jackpot day
  const jackpotDay = isJackpotDay(today);

  return {
    agent: {
      ...agent,
      xpToNext: xpForLevel(agent.level ?? 1),
    },
    activeMissions,
    hollowStage,
    isJackpotDay: jackpotDay,
    dailyStats: {
      completed: todayCompleted,
      failed: todayFailed,
      total: totalForDay,
    },
  };
}

// ── processEndOfDay ──────────────────────────────────────────────────

export async function processEndOfDay(userId: string): Promise<EndOfDayResult> {
  const agent = await getOrCreateAgent(userId);
  const mode = await getUserMode(userId);
  const today = todayDateString();
  const events: string[] = ['day_end'];

  // Get all missions — active ones are failures, completed today are successes
  const allMissions = await db
    .select()
    .from(missions)
    .where(eq(missions.userId, userId));

  const activeMissions = allMissions.filter((m) => m.status === 'active');
  const completedToday = allMissions.filter(
    (m) => m.status === 'completed' && m.completedAt && m.completedAt.slice(0, 10) === today,
  );

  const missionsCompleted = completedToday.length;
  const missionsFailed = activeMissions.length;
  const totalMissions = missionsCompleted + missionsFailed;
  const completionRate = totalMissions === 0 ? 1 : missionsCompleted / totalMissions;

  // Get active effects for failure damage reduction
  const effects = await getActiveEffects(agent.id);
  const damageReduction = 1 - effects.failure_damage_reduction_percent / 100;

  // Process failures: HP damage, carry-over, debt
  let totalHpDamage = 0;
  let totalDebtAdded = 0;
  let missionsCarriedOver = 0;

  for (const m of activeMissions) {
    const diff = (m.difficulty ?? 2) as MissionDifficulty;
    const carryOver = (m.carryOverCount ?? 0);
    const damage = Math.floor(calculateFailureDamage(diff, carryOver, mode) * damageReduction);
    totalHpDamage += damage;
    totalDebtAdded += 1;
    missionsCarriedOver += 1;

    // Increment carry-over count and mark as carried_over
    await db
      .update(missions)
      .set({
        status: 'carried_over',
        carryOverCount: carryOver + 1,
      })
      .where(eq(missions.id, m.id));

    events.push(`mission_failed:${m.id}`);
  }

  // Apply HP damage
  const currentHp = agent.hp ?? 100;
  const newHp = Math.max(0, currentHp - totalHpDamage);

  // Update streak
  const currentStreakDays = agent.streakDays ?? 0;
  let newStreakDays: number;
  let streakHeld: boolean;

  // Apply streak threshold reduction from skills (min 60%)
  const thresholdReduction = effects.streak_threshold_reduction_percent / 100;
  const effectiveThreshold = Math.max(0.6, 0.8 - thresholdReduction);
  const streakHolds = totalMissions === 0 ? true : (missionsCompleted / totalMissions) >= effectiveThreshold;

  if (streakHolds) {
    // Streak holds (meets effective threshold)
    streakHeld = true;
    newStreakDays = currentStreakDays;
  } else {
    // Streak decays based on difficulty mode
    streakHeld = false;
    newStreakDays = decayStreak(currentStreakDays, mode);
    events.push('streak_broken');
  }

  const newStreakTier = getStreakTier(newStreakDays);

  // Personality trait shifts for failures
  let newDiscipline = agent.discipline ?? 0.5;
  if (missionsFailed > 0) {
    newDiscipline = clampTrait(newDiscipline + TRAIT_SHIFT_FAIL * missionsFailed);
  }

  // Update debt and consecutive fail days
  const newDebt = (agent.debt ?? 0) + totalDebtAdded;
  const newConsecutiveFailDays =
    missionsFailed > 0 ? (agent.consecutiveFailDays ?? 0) + 1 : 0;

  // Reset combo count at end of day
  await db
    .update(agents)
    .set({
      hp: newHp,
      streakDays: newStreakDays,
      streakTier: newStreakTier,
      debt: newDebt,
      consecutiveFailDays: newConsecutiveFailDays,
      comboCount: 0,
      discipline: newDiscipline,
    })
    .where(eq(agents.id, agent.id));

  // Log event
  await logGameEvent(userId, 'day_end', {
    completionRate,
    missionsCompleted,
    missionsFailed,
    missionsCarriedOver,
    hpDamage: totalHpDamage,
    streakHeld,
    newStreakDays,
    debtAdded: totalDebtAdded,
  });

  return {
    completionRate,
    missionsCompleted,
    missionsFailed,
    missionsCarriedOver,
    hpDamage: totalHpDamage,
    streakHeld,
    newStreakDays,
    newStreakTier,
    debtAdded: totalDebtAdded,
    events,
  };
}
