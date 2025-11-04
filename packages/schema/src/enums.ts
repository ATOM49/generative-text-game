import { z } from 'zod';

export const EntityType = z.enum(['character', 'faction', 'item', 'poi']);
export const RelationshipType = z.enum([
  'ally',
  'enemy',
  'memberOf',
  'questGiver',
  'owns',
  'guards',
]);
export const MovementMode = z.enum(['walk', 'horse', 'boat', 'fastTravel']);
export const EventCategory = z.enum([
  'movement',
  'combat',
  'social',
  'discovery',
  'system',
]);
export const CampaignStatus = z.enum(['active', 'completed', 'failed']);
export const TriggerType = z.enum([
  'onMove',
  'onTime',
  'onLocationEnter',
  'onRelChange',
  'onUserAction',
]);

export type TEntityType = z.infer<typeof EntityType>;
export type TRelationshipType = z.infer<typeof RelationshipType>;
export type TMovementMode = z.infer<typeof MovementMode>;
export type TEventCategory = z.infer<typeof EventCategory>;
export type TCampaignStatus = z.infer<typeof CampaignStatus>;
export type TTriggerType = z.infer<typeof TriggerType>;
