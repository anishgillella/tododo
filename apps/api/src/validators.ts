import { z } from 'zod';

// === Mission Schemas ===

export const CreateMissionSchema = z.object({
  title: z.string().transform((s) => s.trim()).pipe(z.string().min(1, 'Title is required').max(200)),
  description: z.string().max(1000).optional(),
  difficulty: z.number().int().min(1, 'Difficulty must be 1-5').max(5, 'Difficulty must be 1-5').default(2),
  categoryId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  dueDate: z.string().optional(),
});

export const UpdateMissionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  difficulty: z.number().int().min(1, 'Difficulty must be 1-5').max(5, 'Difficulty must be 1-5').optional(),
  status: z.enum(['active', 'completed', 'failed', 'carried_over']).optional(),
  categoryId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

// === Category Schemas ===

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  emoji: z.string().max(4).default('📋'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color').default('#6B7280'),
});

export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  emoji: z.string().max(4).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// === Bulk Mission Schemas ===

export const ParseTextSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000),
});

export const BatchCreateMissionSchema = z.object({
  missions: z.array(CreateMissionSchema).min(1).max(50),
});

// === Dialogue Schema ===

export const SendDialogueSchema = z.object({
  character: z.enum(['axiom', 'kael', 'mira', 'hollow', 'drifter']),
  message: z.string().min(1, 'Message is required').max(2000),
});

// === Validate Helper ===

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(', ');
    throw new ValidationError(messages);
  }
  return result.data;
}

export class ValidationError extends Error {
  public status = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
