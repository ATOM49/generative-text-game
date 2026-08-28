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
- The promptHint should be a precise single-character visual art brief consistent with the world's visual style.
- Omit previewUrl; portrait art is generated in a separate provider step.
`);
