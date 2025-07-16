import { z } from 'zod';

export type WorldTheme = 'fantasy' | 'sci-fi' | 'modern' | 'historical';

export interface World {
  id: string;
  name: string;
  description?: string;
  theme?: WorldTheme;
  contextWindowLimit?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const WorldFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  theme: z.enum(['fantasy', 'sci-fi', 'modern', 'historical']),
  contextWindowLimit: z.number().default(1024), // default value
});
