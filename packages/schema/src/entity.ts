import { z } from 'zod';
import { Id, RelCoord } from './common';
import { EntityType } from './enums';

export const EntityBaseSchema = z.object({
  type: EntityType,
  name: z.string(),
  locationId: Id.optional(),
  regionId: Id.optional(),
  coordRel: RelCoord.optional(),
  attributes: z
    .record(z.union([z.number(), z.string(), z.boolean()]))
    .optional(),
  tags: z.array(z.string()).optional(),
});

export const EntityFormSchema = EntityBaseSchema;

export const EntitySchema = EntityBaseSchema.extend({
  _id: Id,
  worldId: Id,
});

export type Entity = z.infer<typeof EntitySchema>;
export type EntityForm = z.infer<typeof EntityFormSchema>;
