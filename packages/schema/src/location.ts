import { z } from 'zod';
import { Id, RelCoord } from './common';

export const LocationBaseSchema = z.object({
  name: z.string(),
  regionId: Id.nullish(),
  coordRel: RelCoord,
  props: z.record(z.any()).optional(),
});

export const LocationFormSchema = LocationBaseSchema;

export const LocationSchema = LocationBaseSchema.extend({
  _id: Id,
  worldId: Id,
});

export type Location = z.infer<typeof LocationSchema>;
export type LocationForm = z.infer<typeof LocationFormSchema>;
