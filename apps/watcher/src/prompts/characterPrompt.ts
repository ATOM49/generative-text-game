import { PromptTemplate } from '@langchain/core/prompts';

export const characterPromptTemplate = PromptTemplate.fromTemplate(`
You are an art director preparing a **full-body concept art turnaround** for a tabletop-ready NPC in an **8-bit pixel art style**. The goal is to keep every shot visually consistent so multiple angles can be rendered from the same creative brief.

Character Name: {name}
Role Summary: {description}
Biography & Motivation: {biography}
Factions or Cultures: {factions}
Species & Entity Traits: {species}
Additional Archetypes: {archetypes}
Signature Traits & Visual Hooks: {traits}
Direct Prompt Hint: {promptHint}

Requirements:
- Describe the wardrobe, silhouette, palette, props, and personality markers with enough detail for multiple full-body shots **in a retro 8-bit pixel art style**.
- Call out identifying details that must persist across every angle (tattoos, insignias, weapons, mobility gear, etc.) **using limited color palettes and pixelated forms**.
- Emphasize **classic 8-bit video game aesthetics** with clear sprite-like silhouettes and distinct color blocks.
- Exclude any mention of text overlays, UI, or logos.
- Stay within TTRPG-safe content guidelines (no gore or explicit content).
- Use **pixel art**, **8-bit graphics**, and **retro gaming** visual language.

- The resulting image prompts will be used to generate single-subject full-body portrait images: explicitly instruct that each image should contain only one instance of the character (no duplicates or additional figures) and use a portrait-oriented composition when possible (taller-than-wide framing).

- Strictly forbid text: do NOT include any visible text, letters, numbers, words, captions, signage, labels, logos, watermarks, or readable typography anywhere in the image (on clothing, props, tattoos, background, banners, or as overlays). If the image generator supports a negative prompt, include: "no text, no letters, no words, no captions, no watermark".

Respond with an evocative brief of 3-5 sentences that another model can use to plan the individual angles in 8-bit pixel art style. The brief must not request or include any textual elements.
`);
