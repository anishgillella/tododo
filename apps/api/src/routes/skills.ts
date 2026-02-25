import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '../db/index';
import { agents, agentSkills } from '../db/schema';
import { SKILL_TREE } from '@tododo/shared';

const app = new Hono();

const DEFAULT_USER_ID = 'default';

// Helper to get the agent for the default user
async function getAgent() {
  const rows = await db.select().from(agents).where(eq(agents.userId, DEFAULT_USER_ID));
  return rows[0] ?? null;
}

// GET / — return full skill tree + agent's purchased skills
app.get('/', async (c) => {
  const agent = await getAgent();
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  const purchased = await db
    .select()
    .from(agentSkills)
    .where(eq(agentSkills.agentId, agent.id));

  // Serialize skill tree (functions can't be JSON-serialized, so map to plain objects)
  const skillTree = SKILL_TREE.map((skill) => ({
    id: skill.id,
    name: skill.name,
    category: skill.category,
    description: skill.description,
    maxLevel: skill.maxLevel,
    requiredLevel: skill.requiredLevel,
    prerequisiteSkill: skill.prerequisiteSkill ?? null,
  }));

  return c.json({ skills: skillTree, purchased });
});

// GET /mine — return just the agent's purchased skills
app.get('/mine', async (c) => {
  const agent = await getAgent();
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  const purchased = await db
    .select()
    .from(agentSkills)
    .where(eq(agentSkills.agentId, agent.id));

  return c.json({ skills: purchased });
});

// POST /purchase — purchase or upgrade a skill
app.post('/purchase', async (c) => {
  const body = await c.req.json();
  const { skillId } = body;

  if (!skillId) {
    return c.json({ error: 'skillId is required' }, 400);
  }

  // Find skill definition
  const skillDef = SKILL_TREE.find((s) => s.id === skillId);
  if (!skillDef) {
    return c.json({ error: 'Skill not found' }, 404);
  }

  const agent = await getAgent();
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }

  // Check agent level requirement
  if ((agent.level ?? 1) < skillDef.requiredLevel) {
    return c.json(
      { error: `Agent must be level ${skillDef.requiredLevel} to learn this skill` },
      400,
    );
  }

  // Check prerequisite skill
  if (skillDef.prerequisiteSkill) {
    const prereqRows = await db
      .select()
      .from(agentSkills)
      .where(
        and(
          eq(agentSkills.agentId, agent.id),
          eq(agentSkills.skillId, skillDef.prerequisiteSkill),
        ),
      );
    if (prereqRows.length === 0) {
      return c.json(
        { error: `Prerequisite skill "${skillDef.prerequisiteSkill}" must be learned first` },
        400,
      );
    }
  }

  // Check if agent already has this skill (upgrade)
  const existingRows = await db
    .select()
    .from(agentSkills)
    .where(
      and(eq(agentSkills.agentId, agent.id), eq(agentSkills.skillId, skillId)),
    );

  const currentLevel = existingRows.length > 0 ? (existingRows[0].level ?? 1) : 0;
  const nextLevel = currentLevel + 1;

  // Check max level
  if (nextLevel > skillDef.maxLevel) {
    return c.json({ error: 'Skill is already at max level' }, 400);
  }

  // Calculate XP cost
  const xpCost = skillDef.xpCost(nextLevel);

  // Check XP
  if ((agent.xp ?? 0) < xpCost) {
    return c.json(
      { error: `Not enough XP. Need ${xpCost}, have ${agent.xp ?? 0}` },
      400,
    );
  }

  // Deduct XP
  const newXp = (agent.xp ?? 0) - xpCost;
  await db.update(agents).set({ xp: newXp }).where(eq(agents.id, agent.id));

  // Compute the effect for the new level
  const effect = skillDef.effect(nextLevel);

  if (existingRows.length > 0) {
    // Upgrade existing skill
    await db
      .update(agentSkills)
      .set({
        level: nextLevel,
        effectJson: JSON.stringify(effect),
      })
      .where(eq(agentSkills.id, existingRows[0].id));

    const updated = await db
      .select()
      .from(agentSkills)
      .where(eq(agentSkills.id, existingRows[0].id));

    return c.json({
      skill: updated[0],
      xpSpent: xpCost,
      remainingXp: newXp,
      upgraded: true,
    });
  } else {
    // New skill purchase
    const id = nanoid();
    await db.insert(agentSkills).values({
      id,
      agentId: agent.id,
      skillId,
      name: skillDef.name,
      category: skillDef.category,
      level: 1,
      effectJson: JSON.stringify(effect),
      purchasedAt: new Date().toISOString(),
    });

    const inserted = await db.select().from(agentSkills).where(eq(agentSkills.id, id));

    return c.json({
      skill: inserted[0],
      xpSpent: xpCost,
      remainingXp: newXp,
      upgraded: false,
    }, 201);
  }
});

export default app;
