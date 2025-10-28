import z from 'zod';

export const worldThemeValues = [
  'fantasy',
  'sci‑fi',
  'modern',
  'historical',
  'post‑apocalyptic',
] as const;

export type WorldThemeEnum = (typeof worldThemeValues)[number];

export const WorldThemeSchema = z.enum(worldThemeValues);
export interface World {
  id: string;
  name: string;
  rules?: string;
  params: string;
  theme?: WorldThemeEnum;
  contextWindowLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const WorldFormSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Name must not be empty'),
  theme: z
    .enum(worldThemeValues, {
      required_error: 'Theme is required',
      invalid_type_error: 'Invalid theme selected',
    })
    .describe('Select the primary genre that defines your world'),
  rules: z
    .string({
      invalid_type_error: 'Rules must be a string',
    })
    .optional()
    .describe(
      'Establish fundamental rules such as magic systems, technology levels, physics variations, and temporal mechanics',
    ),
  params: z
    .record(z.string(), {
      invalid_type_error: 'Parameters must be key-value pairs',
    })
    .optional()
    .describe(
      'Specify complexity levels, tone preferences, and content restrictions',
    )
    .refine((val) => {
      if (!val) return true;
      try {
        return Object.values(val).every((v) => typeof v === 'string');
      } catch {
        return false;
      }
    }, 'Invalid parameter format'),

  contextWindowLimit: z
    .number({
      required_error: 'Context window limit is required',
      invalid_type_error: 'Context window limit must be a number',
    })
    .int('Context window limit must be an integer')
    .min(256, 'Context window must be at least 256 tokens')
    .max(4096, 'Context window cannot exceed 4096 tokens')
    .default(1024)
    .describe('Maximum number of tokens to use for context window'),
});

export type WorldForm = z.infer<typeof WorldFormSchema>;
