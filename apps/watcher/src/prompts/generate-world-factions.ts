import { PromptTemplate } from '@langchain/core/prompts';

export const generateWorldFactionsPrompt = PromptTemplate.fromTemplate(`
Create exactly {factionCount} active organizations for the world below. They must feel as though they have histories, needs, internal disagreements, useful capabilities, and relationships to the world's current pressures.

World context:
{worldContext}

Requirements
- Every category must be "faction"; these are organizations, not species or character classes.
- Give every faction a unique lowercase kebab-case key.
- Make their goals overlap and conflict in interesting ways.
- Each faction needs at least two character hooks representing different ranks or viewpoints.
- Summaries are card-ready; descriptions are rich enough to drive characters and missions.
- Omit previewUrl; artwork is generated in a separate provider step.
- Do not assign territory yet because a separate join step will use the analyzed map.
`);
