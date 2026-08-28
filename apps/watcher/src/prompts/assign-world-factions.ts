import { PromptTemplate } from '@langchain/core/prompts';

export const assignWorldFactionsPrompt = PromptTemplate.fromTemplate(`
Assign faction presence across every region using the exact temporary keys supplied below.

World context:
{worldContext}

Regions:
{regions}

Factions:
{factions}

Requirements
- Return exactly one assignment for every region key.
- Every region needs at least one faction presence and may have at most two.
- Reuse factions across regions when their logistics and ambitions support it.
- Influence must reflect geography, resources, history, and opposition.
- A rationale should explain the lived-in evidence and conflict opportunity, not merely repeat faction and region descriptions.
- Use only supplied region and faction keys.
`);
