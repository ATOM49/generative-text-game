import { PromptTemplate } from '@langchain/core/prompts';
import {
  HIGH_FIDELITY_PIXEL_ART_DIRECTION,
  TEXT_FREE_IMAGE_DIRECTION,
} from './pixel-art-direction.js';
import { CHARACTER_DISTINCTION_DIRECTION } from './character-variation.js';

const turnaroundPlannerTemplate = PromptTemplate.fromTemplate(`
You are planning a character concept art turnaround.

Character Brief:
{characterBrief}

Every planned shot must preserve this rendering contract:
${HIGH_FIDELITY_PIXEL_ART_DIRECTION}

${CHARACTER_DISTINCTION_DIRECTION}

Character-specific staging cue:
{stagingCue}

Output JSON with the keys "signatureProp" and "shots". "signatureProp" must be one concise, concrete description of the same bespoke prop used in every shot. Describe 2-3 distinct camera angles that cover a complete turnaround:
- Across the 2-3 shots, include a front or three-quarter hero view, a rear or profile reference view, and a dynamic or action-oriented pose when a third shot is used.
- Every shot must use a substantially different pose and action while preserving the character's anatomy, wardrobe, palette, and exact signature prop.
- Even reference views should use natural weight distribution and a character-specific gesture rather than a rigid mannequin pose.
- Each "shot" object MUST include:
  - angle: short label like "Front", "Rear", "Left Profile", "Hero Action"
  - summary: one sentence describing the pose, camera distance, and lighting goal
  - prompt: a rich image-model-ready prompt that explicitly names the signature prop, describes how the character physically interacts with it in this shot, and reiterates the wardrobe, personality, full-body framing, restrained pixel-art background, and high-fidelity pixel rendering.

- Ensure each generated shot is intended to show a single instance of the character only (no additional figures, duplicates, reflections, or crowd). Emphasize a portrait-style composition where appropriate (taller-than-wide framing) so each image can be used as a consistent full-body reference.
- ${TEXT_FREE_IMAGE_DIRECTION}

Ensure every prompt emphasizes consistency with the original brief.
`);

export default turnaroundPlannerTemplate;
