import { z } from 'zod';
import { Id } from './common';

export const CharacterDescriptorSchema = z
  .object({
    label: z
      .string()
      .min(1)
      .describe(
        'Short descriptor title such as demeanor, secret, or specialty.',
      ),
    detail: z
      .string()
      .min(1)
      .describe('Sentence that elaborates on the descriptor for storytelling.'),
  })
  .describe('Reusable text blocks that flesh out a named character.');

export const CharacterMetaSchema = z
  .object({
    descriptors: z
      .array(CharacterDescriptorSchema)
      .default([])
      .describe('Narrative descriptors surfaced in UI cards and AI prompts.'),
    notes: z
      .string()
      .optional()
      .describe('Internal notes that help narrators improvise scenes.'),
  })
  .describe('Structured metadata that keeps improvised NPCs consistent.');

export const CharacterBaseSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe('Unique name for the character, e.g., “Magical Elf Maya”.'),
  description: z
    .string()
    .optional()
    .describe('Short elevator pitch that introduces the character.'),
  biography: z
    .string()
    .optional()
    .describe('Long-form biography or GM notes about motivations and arcs.'),
  previewUrl: z
    .string()
    .url()
    .optional()
    .describe('AI generated portrait stored on the CDN.'),
  promptHint: z
    .string()
    .optional()
    .describe(
      'Optional direct instruction used when generating a new portrait.',
    ),
  traits: z
    .array(z.string())
    .default([])
    .describe('Free-form tags that make filtering NPCs easier.'),
  factionIds: z
    .array(Id)
    .default([])
    .describe(
      'References to faction or culture entries that this character serves.',
    ),
  cultureIds: z
    .array(Id)
    .default([])
    .describe(
      'References to cultural groups that shape customs, dialects, or behavior.',
    ),
  speciesIds: z
    .array(Id)
    .default([])
    .describe(
      'References to species or entity archetypes applicable to the character.',
    ),
  archetypeIds: z
    .array(Id)
    .default([])
    .describe(
      'Additional archetype IDs (professions, cultists, etc.) to reuse across hunts.',
    ),
  meta: CharacterMetaSchema,
});

export const CharacterFormSchema = CharacterBaseSchema;

export const CharacterSchema = CharacterBaseSchema.extend({
  _id: Id,
  worldId: Id,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Character = z.infer<typeof CharacterSchema>;
export type CharacterForm = z.infer<typeof CharacterFormSchema>;
