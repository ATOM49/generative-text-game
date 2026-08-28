import { PromptTemplate } from '@langchain/core/prompts';
import {
  HIGH_FIDELITY_PIXEL_ART_DIRECTION,
  TEXT_FREE_IMAGE_DIRECTION,
} from './pixel-art-direction.js';
import { CHARACTER_DISTINCTION_DIRECTION } from './character-variation.js';

export const characterPromptTemplate = PromptTemplate.fromTemplate(`
You are an art director preparing a full-body pixel-art turnaround for a tabletop-ready NPC. The goal is to keep every shot visually consistent so multiple angles can be rendered from the same creative brief.

Character Name: {name}
Role Summary: {description}
Biography & Motivation: {biography}
Factions or Cultures: {factions}
Species & Entity Traits: {species}
Additional Archetypes: {archetypes}
Signature Traits & Visual Hooks: {traits}
Direct Prompt Hint: {promptHint}

${HIGH_FIDELITY_PIXEL_ART_DIRECTION}

${CHARACTER_DISTINCTION_DIRECTION}

Requirements:
- Describe the wardrobe, silhouette, controlled palette, props, and personality markers with enough detail for multiple full-body shots in the shared high-fidelity pixel-art style.
- Call out identifying details that must persist across every angle (tattoos, abstract insignias, signature prop, mobility gear, etc.) using deliberate pixel clusters and readable color blocks.
- Preserve human or creature anatomy and material identity while simplifying forms into crisp stepped contours; this is polished character key art, not a tiny gameplay sprite or sprite sheet.
- Exclude any mention of text overlays, UI, or logos.
- Stay within TTRPG-safe content guidelines (no gore or explicit content).
- The resulting image prompts will be used to generate single-subject full-body portrait images: explicitly instruct that each image should contain only one instance of the character (no duplicates or additional figures) and use a portrait-oriented composition when possible (taller-than-wide framing).
- ${TEXT_FREE_IMAGE_DIRECTION}

Respond with an evocative brief of 3-5 sentences that another model can use to plan the individual angles. Reiterate the high-fidelity pixel-art rendering cues and do not request or include textual elements.
`);
