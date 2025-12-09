import { PromptTemplate } from '@langchain/core/prompts';

const turnaroundPlannerTemplate = PromptTemplate.fromTemplate(`
You are planning a character concept art turnaround.

Character Brief:
{characterBrief}

Output JSON with the key "shots" describing 2-3 distinct camera angles that cover a complete turnaround:
- Always include a front view, a rear view, a profile or three-quarter view, and one dynamic or action-oriented pose.
- Each "shot" object MUST include:
  - angle: short label like "Front", "Rear", "Left Profile", "Hero Action"
  - summary: one sentence describing the pose, camera distance, and lighting goal
  - prompt: a rich DALL·E-ready prompt that reiterates the wardrobe, props, and personality while specifying a full-body shot, neutral/studio background, and no text overlays.

- Ensure each generated shot is intended to show a single instance of the character only (no additional figures, duplicates, reflections, or crowd). Emphasize a portrait-style composition where appropriate (taller-than-wide framing) so each image can be used as a consistent full-body reference.

Ensure every prompt emphasizes consistency with the original brief.
`);

export default turnaroundPlannerTemplate;
