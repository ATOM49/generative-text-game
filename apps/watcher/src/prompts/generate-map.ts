import { PromptTemplate } from '@langchain/core/prompts';

const mapPromptTemplate = PromptTemplate.fromTemplate(`
Generate a **high-fidelity 8-bit style fantasy map** image from a **top-down perspective**.

World Name: {name}
Theme: {theme}
Description: {description}
Settings / Key Features: {settings}

Instructions:
- The map MUST be viewed from directly above (top-down/bird's-eye view), like a traditional RPG world map or strategic map layout.
- The map should be rendered in 8-bit/bezel-retro pixel-art style, with vibrant but limited palette typical of classic console graphics.
- Include clearly defined regions/territories with distinct boundaries that can be easily identified and separated.
- Include terrain features (e.g., mountains, forests, rivers, lakes), distinct biomes, notable landmarks (e.g., ancient ruins, towers, cities) based on the "Settings / Key Features".
- Each region should have visual distinction through color, terrain type, or border markings to make region definition clear.
- Use the theme to evoke mood: {theme} → adjust color tone, iconography appropriately.
- The world should feel coherent and immersive at a glance, while staying stylistically consistent with 8-bit high-fidelity (clear pixel-art, crisp shapes, readable detail).
- Maintain a flat, overhead perspective throughout - no isometric or angled views.
- Output should be described as an image generation prompt (for DALL·E or similar), ready for an image model.

Prompt: "Top-down 8-bit pixel-art world map of {name} – {theme} theme: {description}. Key features: {settings}. Overhead view with clearly defined regions and territories."

Please produce the final prompt for the image model.
`);

export { mapPromptTemplate };
