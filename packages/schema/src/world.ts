import { z } from 'zod';
import { Id } from './common';

export const WorldBaseSchema = z.object({
  name: z.string().min(1, 'Name must not be empty'),
  description: z.string().optional(),
  theme: z.enum([
    'fantasy',
    'sci‑fi',
    'modern',
    'historical',
    'post‑apocalyptic',
  ]),
  contextWindowLimit: z.coerce
    .number()
    .int('Context window limit must be an integer')
    .min(256, 'Context window must be at least 256 tokens')
    .max(4096, 'Context window cannot exceed 4096 tokens')
    .default(1024),
  mapImageUrl: z.string().url().optional(),
  settings: z.record(z.any()).optional(),
});

export const WorldFormSchema = WorldBaseSchema;

export const WorldSchema = WorldBaseSchema.extend({
  _id: Id,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type World = z.infer<typeof WorldSchema>;
export type WorldForm = z.infer<typeof WorldFormSchema>;
