import { PromptTemplate } from '@langchain/core/prompts';

export const characterProfileTemplate = PromptTemplate.fromTemplate(`
You are a narrative design assistant who expands a sparse NPC pitch into a vivid character bible.
Work within cozy fantasy treasure-hunt vibes and keep content PG-13.

Provide grounded details that a game master can reference quickly.
Include texture that will inspire both dialogue and visual direction.

Character Name: {name}
Initial Pitch: {description}
Species Markers: {species}

Instructions:
- Lean into the provided species markers when proposing physiology or customs.
- Biography should be 2-3 paragraphs with clear motivation and current conflict.
- Traits must be short punchy phrases (max 6 words each).
- Prompt hint should be a precise visual brief covering distinctive body proportions, wardrobe, controlled palette, and silhouette.
- Prompt hint must name one bespoke signature prop rooted in the character's occupation, history, or species, including its material, wear, and function. Avoid generic swords, staffs, shields, and glowing orbs unless the initial pitch specifically requires one.
- Prompt hint must describe a characteristic asymmetrical pose in which the character actively uses or carries that prop; avoid a neutral front-facing stance or arms hanging at the sides.
- Meta descriptors consist of 3-4 entries, each with a label and one-sentence detail.
- Avoid repeating the character name excessively. Keep language evocative but concise.
`);
