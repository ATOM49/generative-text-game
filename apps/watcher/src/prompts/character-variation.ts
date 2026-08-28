import { TEXT_FREE_IMAGE_DIRECTION } from './pixel-art-direction.js';

export const CHARACTER_DISTINCTION_DIRECTION = `
Character distinction:
- Establish a distinctive body type, proportions, posture, and asymmetrical silhouette based on this character's species, age, work, temperament, and history; do not default every character to the same conventionally heroic build.
- Give the character one bespoke signature prop derived from their biography, faction, occupation, or world. Prefer a specific tool, instrument, keepsake, mobility aid, field device, ritual object, container, or unusual weapon over a generic sword, staff, shield, or glowing orb.
- Describe the prop's shape, material, color, wear, and story-specific function precisely enough to remain recognizable across rerenders.
- Show the character actively holding, using, repairing, carrying, leaning on, or otherwise physically interacting with that prop. Do not use a neutral mannequin stance, symmetrical front-facing pose, arms hanging at the sides, or hands hidden without a story reason.
- Make the gesture and weight distribution express personality and current intent. The pose should look caught during a meaningful task rather than arranged for an identification photo.
`.trim();

const CHARACTER_STAGING_CUES = [
  "Use a compact, low-center-of-gravity pose with bent joints and a strong triangular silhouette, adapted naturally to the character's anatomy and task.",
  'Use a tall diagonal silhouette with uneven shoulder and hip lines, one foot or limb advanced, and the signature prop extending the action line.',
  'Use a coiled three-quarter twist as if the character has just noticed a change nearby, with the prop held close and ready rather than presented to the viewer.',
  'Use a purposeful stride across the frame, with clothing, equipment, and the signature prop responding to the direction of travel.',
  'Use an absorbed working pose—crouched, kneeling, perched, or braced as anatomy permits—while the character operates or examines the signature prop.',
  'Use an off-axis balance pose shaped by the environment or profession, with a clear counterweight between the character and their signature prop.',
] as const;

const stableHash = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

export const selectCharacterStagingCue = (identity: string) =>
  CHARACTER_STAGING_CUES[stableHash(identity) % CHARACTER_STAGING_CUES.length]!;

interface CharacterGalleryPromptInput {
  characterBrief: string;
  shot: {
    angle: string;
    summary: string;
    prompt: string;
  };
  signatureProp: string;
  stagingCue: string;
}

export const buildCharacterGalleryImagePrompt = ({
  characterBrief,
  shot,
  signatureProp,
  stagingCue,
}: CharacterGalleryPromptInput) =>
  `${characterBrief}. Signature prop that must appear unchanged: ${signatureProp}. Character-specific pose language: ${stagingCue} Planned shot: ${shot.prompt}. ${shot.summary}. ${shot.angle} angle. Render a single instance of the character only (no other figures, duplicates, reflections, or crowd). Full-body, portrait-oriented composition (taller-than-wide). Show a clear physical interaction between the character and the signature prop. Restrained pixel-art environmental backdrop with clean subject separation. ${TEXT_FREE_IMAGE_DIRECTION}`;
