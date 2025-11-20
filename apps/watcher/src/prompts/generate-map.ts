import { PromptTemplate } from '@langchain/core/prompts';

// Theme-specific instructions mapping
// Matches enum from @talespin/schema: 'fantasy' | 'sci‑fi' | 'modern' | 'historical' | 'post‑apocalyptic'
const themeInstructions: Record<string, string> = {
  fantasy: `
- Include clearly defined regions/territories with distinct boundaries that can be easily identified and separated.
- Include terrain features (e.g., mountains, forests, rivers, lakes), distinct biomes, and notable landmarks (e.g., ancient ruins, towers, castles, cities, temples, mystical groves) based on the "Settings / Key Features".
- Each region should have visual distinction through color, terrain type, or border markings to make region definition clear.`,

  'sci-fi': `
- Create a star system layout with planets, moons, and asteroid fields with distinct boundaries that can be easily identified and separated.
- Include cosmic features (e.g., nebulae, star clusters, orbital stations, asteroid belts) and notable landmarks (e.g., abandoned alien spaceships, supernovas, black holes, warp portals, space gates, derelict stations, dyson spheres) based on the "Settings / Key Features".
- Each celestial body or sector should have visual distinction through color, space phenomena, or boundary markings to make region definition clear.`,

  'sci‑fi': `
- Create a star system layout with planets, moons, and asteroid fields with distinct boundaries that can be easily identified and separated.
- Include cosmic features (e.g., nebulae, star clusters, orbital stations, asteroid belts) and notable landmarks (e.g., abandoned alien spaceships, supernovas, black holes, warp portals, space gates, derelict stations, dyson spheres) based on the "Settings / Key Features".
- Each celestial body or sector should have visual distinction through color, space phenomena, or boundary markings to make region definition clear.`,

  modern: `
- Include clearly defined districts/regions with distinct boundaries that can be easily identified and separated.
- Include contemporary features (e.g., highways, suburbs, downtown districts, parks, industrial zones) and notable landmarks (e.g., skyscrapers, airports, stadiums, monuments, government buildings) based on the "Settings / Key Features".
- Each region should have visual distinction through color, urban density, or border markings to make region definition clear.`,

  historical: `
- Include clearly defined regions/territories with distinct boundaries that can be easily identified and separated.
- Include period-appropriate features (e.g., trade routes, farmlands, fortifications, waterways) and notable landmarks (e.g., castles, cathedrals, palaces, forums, temples, monuments) based on the "Settings / Key Features".
- Each region should have visual distinction through color, architectural style, or border markings to make region definition clear.`,

  'post-apocalyptic': `
- Include clearly defined zones/territories with distinct boundaries that can be easily identified and separated.
- Include wasteland features (e.g., ruined cities, radiation zones, dead forests, toxic rivers, dust storms) and notable landmarks (e.g., abandoned bunkers, crashed vehicles, raider camps, survivor settlements, military outposts) based on the "Settings / Key Features".
- Each zone should have visual distinction through color, decay level, radiation glow, or border markings to make region definition clear.`,

  'post‑apocalyptic': `
- Include clearly defined zones/territories with distinct boundaries that can be easily identified and separated.
- Include wasteland features (e.g., ruined cities, radiation zones, dead forests, toxic rivers, dust storms) and notable landmarks (e.g., abandoned bunkers, crashed vehicles, raider camps, survivor settlements, military outposts) based on the "Settings / Key Features".
- Each zone should have visual distinction through color, decay level, radiation glow, or border markings to make region definition clear.`,

  default: `
- Include clearly defined regions/areas with distinct boundaries that can be easily identified and separated.
- Include appropriate environmental features and notable landmarks based on the theme and "Settings / Key Features".
- Each region should have visual distinction through color, environmental type, or border markings to make region definition clear.`,
};

function getThemeInstructions(theme?: string): string {
  if (!theme) return themeInstructions.fantasy;

  // Handle both regular hyphen and non-breaking hyphen (U+2011) used in schema enum
  const normalizedTheme = theme.toLowerCase().replace(/-/g, '‑');

  return (
    themeInstructions[theme] ||
    themeInstructions[normalizedTheme] ||
    themeInstructions.default
  );
}

const mapPromptTemplate = PromptTemplate.fromTemplate(`
Generate a **high-fidelity 8-bit style {theme} map** image from a **top-down perspective**.

World Name: {name}
Theme: {theme}
Description: {description}
Settings / Key Features: {settings}

Instructions:
- The map MUST be viewed from directly above (top-down/bird's-eye view), like a traditional RPG world map or strategic map layout.
- The map should be rendered in 8-bit/bezel-retro pixel-art style, with vibrant but limited palette typical of classic console graphics.
- Use the theme to evoke mood: {theme} → adjust color tone, iconography appropriately.
- The world should feel coherent and immersive at a glance, while staying stylistically consistent with 8-bit high-fidelity (clear pixel-art, crisp shapes, readable detail).
- Maintain a flat, overhead perspective throughout - no isometric or angled views.

Theme-Specific Instructions:
{themeSpecificInstructions}

- Output should be described as an image generation prompt (for DALL·E or similar), ready for an image model.

Prompt: "Top-down 8-bit pixel-art world map of {name} – {theme} theme: {description}. Key features: {settings}. Overhead view with clearly defined regions and territories appropriate for {theme} setting."

Please produce the final prompt for the image model.
`);

export { mapPromptTemplate, getThemeInstructions };
