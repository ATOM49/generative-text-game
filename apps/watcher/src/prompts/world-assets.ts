import type {
  EnhancedWorldContext,
  GeneratedCharacter,
  GeneratedFaction,
} from '@talespin/schema';

export const buildFactionImagePrompt = (
  context: EnhancedWorldContext,
  generated: GeneratedFaction,
) => {
  const faction = generated.faction;
  return `A representative key-art image for ${faction.name}, an organization in ${context.name}. ${faction.summary} ${faction.description} Tone: ${faction.meta.tone}. Visual language: ${context.lore.visualStyle}. Show an emblematic gathering, headquarters, ritual, equipment, or contested activity that reveals how the organization lives and operates. Cohesive environmental storytelling, no text, no labels, no logos, no UI.`;
};

export const buildCharacterImagePrompt = (
  context: EnhancedWorldContext,
  generated: GeneratedCharacter,
  faction: GeneratedFaction,
) =>
  `Single-character full-body portrait of ${generated.name} from ${faction.faction.name} in ${context.name}. ${generated.description} ${generated.promptHint}. Traits: ${generated.traits.join(', ')}. Visual language: ${context.lore.visualStyle}. Exactly one person, clear silhouette, setting-appropriate clothing and tools, grounded lived-in details, portrait-oriented composition, no duplicates, no crowd, no text, no labels, no UI.`;
