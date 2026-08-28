import { PromptTemplate } from '@langchain/core/prompts';

export const generateFactionCharactersPrompt = PromptTemplate.fromTemplate(`
Create exactly {characterCount} distinct, recurring characters who belong to this faction and can carry relationships and missions in a persistent game.

World context:
{worldContext}

Faction:
{faction}

Requirements
- Use the provided faction key verbatim as factionKey.
- Give each character a unique lowercase kebab-case key.
- Characters need personal motives, obligations, contradictions, secrets, and a reason to interact with outsiders.
- Their biography must connect personal history to the faction without making them a stereotype of it.
- The promptHint should be a precise single-character visual art brief consistent with the world's visual motifs.
- Give every character a visibly different body type, proportion, posture, and asymmetrical action silhouette based on their species, work, temperament, and history.
- Give every character one different bespoke signature prop rooted in their biography, faction role, or world. Specify its shape, material, color, wear, and practical or emotional function; avoid defaulting to generic swords, staffs, shields, or glowing orbs.
- In promptHint, describe the character actively using, repairing, carrying, or leaning on that prop in a story-specific pose. Avoid neutral mannequin poses, arms hanging at the sides, and repeated hero stances across the cast.
- Omit previewUrl; portrait art is generated in a separate provider step.
`);
