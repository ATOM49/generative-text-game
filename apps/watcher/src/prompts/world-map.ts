import { PromptTemplate } from '@langchain/core/prompts';

export const worldMapPrompt = PromptTemplate.fromTemplate(`
Create a square, top-down illustrated world map for a persistent narrative game.

World: {name}
Theme: {theme}
Premise: {description}
Tone: {tone}
Visual language: {visualStyle}
Current tensions: {currentTensions}

Show distinct, legible geographic territories with natural borders, travel corridors, settlements, ruins, and environmental storytelling. The terrain should imply where societies could thrive and where missions could occur. Compose it to remain readable beneath an 8 by 8 game grid.

No labels, letters, legends, UI, grid lines, watermarks, frames, or text of any kind. Directly overhead view only.
`);
