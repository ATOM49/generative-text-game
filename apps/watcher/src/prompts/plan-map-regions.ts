import { PromptTemplate } from '@langchain/core/prompts';

export const planMapRegionsPrompt = PromptTemplate.fromTemplate(`
Study the supplied map as an 8 by 8 grid: x runs 0-7 from left to right and y runs 0-7 from top to bottom.

Identify exactly {regionCount} visually and geographically distinct semantic regions for this world. Choose one unique anchor cell near the visual center of each region. Together the anchors must represent the whole map, including difficult or sparsely inhabited terrain. Do not treat every grid cell as a region.

World context:
{worldContext}

Return concise visual observations grounded in what is actually visible in the map. Region names and anchors will be used by deterministic code to partition all 64 cells.
`);
