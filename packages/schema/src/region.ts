import { z } from 'zod';
import { Id, RelPolygon } from './common';

export const RegionBaseSchema = z.object({
  name: z.string(),
  parentRegionId: Id.nullish(),
  geom: RelPolygon,
  tags: z.array(z.string()).optional(),
});

export const RegionFormSchema = RegionBaseSchema;

export const RegionSchema = RegionBaseSchema.extend({
  _id: Id,
  worldId: Id,
});

export type Region = z.infer<typeof RegionSchema>;
export type RegionForm = z.infer<typeof RegionFormSchema>;
