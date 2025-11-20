import { z } from 'zod';
import { Id } from './common';

export const WorldBaseSchema = z.object({
  name: z.string().min(1, 'Name must not be empty'),
  description: z.string().optional(),
  theme: z
    .enum(['fantasy', 'sci‑fi', 'modern', 'historical', 'post‑apocalyptic'])
    .optional(),
  contextWindowLimit: z.coerce
    .number()
    .int('Context window limit must be an integer')
    .min(256, 'Context window must be at least 256 tokens')
    .max(4096, 'Context window cannot exceed 4096 tokens')
    .optional(),
  version: z.number().int().default(1),
  mapImageUrl: z.string().url().optional(),
  settings: z.record(z.string(), z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const WorldFormSchema = WorldBaseSchema.omit({
  version: true,
  createdAt: true,
  updatedAt: true,
});

export const WorldSchema = WorldBaseSchema.extend({
  _id: Id,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type World = z.infer<typeof WorldSchema>;
export type WorldForm = z.infer<typeof WorldFormSchema>;
