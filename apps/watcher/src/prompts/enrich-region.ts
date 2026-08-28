import { PromptTemplate } from '@langchain/core/prompts';

export const enrichRegionPrompt = PromptTemplate.fromTemplate(`
The supplied image is a real cut-out from the generated world map for the region provisionally called "{regionName}".

World context:
{worldContext}

Initial map observation:
{visualSummary}

Describe this place as a lived-in, mission-ready region. Ground terrain, travel, resources, hazards, settlement patterns, and atmosphere in visible details from the cut-out. The longer description should also explain what daily life feels like and why outsiders would come here. Mission hooks must name a concrete pressure, discovery, or choice without pre-writing a whole mission.
`);
