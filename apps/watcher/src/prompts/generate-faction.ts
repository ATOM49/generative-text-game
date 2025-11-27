import { PromptTemplate } from '@langchain/core/prompts';

export const factionPromptTemplate = PromptTemplate.fromTemplate(`
You are an art director commissioning a **representative visual** for a fictional faction, culture, or species in a fantasy setting.

Name: {name}
Category: {category}
Summary: {summary}
Description: {description}
Tone/Vibe: {tone}
Keywords: {keywords}
Direct Prompt Hint: {promptHint}

Requirements:
- Create a cohesive visual representation. This could be an emblem, a banner, a group of representative members, or a symbolic scene.
- If the category is "species" or "culture", focus on a representative individual or group in their native environment or attire.
- If the category is "faction" or "entity", focus on symbols, banners, or a headquarters/gathering scene.
- Maintain a style consistent with high-quality fantasy concept art (painterly realism, detailed textures).
- Avoid text overlays or logos with legible text.
- Lighting should reflect the "Tone/Vibe" provided.

Respond with a single polished prompt that DALL·E can use directly.
`);
