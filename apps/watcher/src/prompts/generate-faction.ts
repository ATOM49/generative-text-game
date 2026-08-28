import { PromptTemplate } from '@langchain/core/prompts';
import {
  HIGH_FIDELITY_PIXEL_ART_DIRECTION,
  TEXT_FREE_IMAGE_DIRECTION,
} from './pixel-art-direction.js';

export const factionPromptTemplate = PromptTemplate.fromTemplate(`
You are an art director commissioning a **representative visual** for a fictional faction, culture, or species in a fantasy setting.

Name: {name}
Category: {category}
Summary: {summary}
Description: {description}
Tone/Vibe: {tone}
Keywords: {keywords}
Direct Prompt Hint: {promptHint}

${HIGH_FIDELITY_PIXEL_ART_DIRECTION}

Faction-specific direction:
- Create a cohesive visual representation. This could be an emblem, a banner, a group of representative members, or a symbolic scene.
- If the category is "species" or "culture", focus on a representative individual or group in their native environment or attire.
- If the category is "faction" or "entity", focus on symbols, banners, or a headquarters/gathering scene.
- Favor one strong focal subject, emblematic silhouette, or organized gathering that remains readable at card size, with setting-specific pixel detail around it.
- Lighting should reflect the "Tone/Vibe" provided.
- ${TEXT_FREE_IMAGE_DIRECTION} Symbols may be abstract and non-linguistic, but must not resemble readable writing.

Render the image itself; do not display or typeset this brief.
`);
