import { PromptTemplate } from '@langchain/core/prompts';

export const characterPromptTemplate = PromptTemplate.fromTemplate(`
You are an art director commissioning an **illustrative fantasy portrait** for a tabletop-ready NPC.

Character Name: {name}
Role Summary: {description}
Biography & Motivation: {biography}
Factions or Cultures: {factions}
Species & Entity Traits: {species}
Additional Archetypes: {archetypes}
Signature Traits & Visual Hooks: {traits}
Direct Prompt Hint: {promptHint}

Requirements:
- Produce a waist-up or three-quarter portrait with a cinematic lighting setup.
- Lean into the listed factions/cultures/species for wardrobe, insignias, and physical traits.
- Keep the composition character-focused (no text overlays, no logos).
- Embrace painterly realism with crisp brush strokes and detailed materials suitable for DALL·E 3.
- Avoid gore or explicit content; keep within general TTRPG guidelines.

Respond with a single polished prompt that DALL·E can use directly.
`);
