import { PromptTemplate } from '@langchain/core/prompts';

const mapPromptTemplate = PromptTemplate.fromTemplate(`
Generate a **high-fidelity 8-bit style fantasy map** image from a **top-down perspective**.

Theme: {theme}
Description: {description}
Settings / Key Features: {settings}
World Name (Context Only - DO NOT RENDER AS TEXT): {name}

Instructions:
- The map MUST be viewed from directly above (top-down/bird's-eye view), like a traditional RPG world map or strategic map layout.
- The map should be rendered in 8-bit/bezel-retro pixel-art style, with vibrant but limited palette typical of classic console graphics.
- CRITICAL: The image must be completely free of text. NO LABELS, NO LEGENDS, NO TITLE, NO UI.
- Include clearly defined regions/territories with distinct boundaries.
- Include terrain features (e.g., mountains, forests, rivers, lakes) and landmarks based on the settings.
- Use the theme to evoke mood: {theme}.
- Maintain a flat, overhead perspective throughout - no isometric or angled views.
- The entire image should be filled with the map itself.

Prompt: "A text-free, label-free 8-bit pixel-art world map. Top-down overhead view. Theme: {theme}. Terrain details: {description}. Key features: {settings}. The map shows only geography and terrain with distinct regions. Absolutely no text, no writing, no legends, and no interface elements."

Please produce the final prompt for the image model.
`);

export { mapPromptTemplate };
