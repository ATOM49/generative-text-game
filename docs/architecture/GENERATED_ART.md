# Generated Art Direction

## Current Contract

Talespin-generated maps, factions, and characters share one high-fidelity cinematic pixel-art language. The implementation describes observable rendering traits instead of naming an existing game: visible square pixels, hand-placed clusters, crisp stepped contours, controlled color ramps, selective dithering, readable silhouettes, cinematic lighting, and layered atmospheric depth.

The negative contract excludes painterly brushwork, photorealism, smooth vector edges, 3D renders, toy-like forms, anti-aliased illustration, blurry upscaling, visible text, labels, logos, watermarks, and UI.

The source of truth is `apps/watcher/src/prompts/pixel-art-direction.ts`. Reuse it rather than copying the house style into new prompts.

## Asset Composition

- **Maps:** strict top-down geography, no horizon or isometric tilt, readable territories and travel routes, no labels or grid lines.
- **Factions:** one emblematic focal subject, activity, gathering, headquarters, or ritual that remains legible at card size.
- **Characters:** one anatomy-aware full-body subject with a distinctive build, asymmetrical action silhouette, and a bespoke signature prop derived from biography, faction, occupation, or world.

Character staging is selected deterministically from character identity and world context. The same character remains coherent on rerun while different briefs receive different pose languages. Gallery planning preserves one signature prop across angles but requires different physical actions in each shot. Generic mannequin poses and default swords, staffs, shields, or glowing orbs are discouraged unless the story specifically requires them.

## Prompt Paths

Standalone generation and complete world-blueprint generation must stay aligned:

| Asset     | Standalone path                                         | World-blueprint path          |
| --------- | ------------------------------------------------------- | ----------------------------- |
| Map       | `src/prompts/generate-map.ts`                           | `src/prompts/world-map.ts`    |
| Faction   | `src/prompts/generate-faction.ts`                       | `src/prompts/world-assets.ts` |
| Character | `src/prompts/characterPrompt.ts` and turnaround planner | `src/prompts/world-assets.ts` |

Character variation lives in `apps/watcher/src/prompts/character-variation.ts`. Keep pure prompt composers there so prompt-only tests do not initialize provider configuration.

## Providers and Storage

Watcher selects image models by purpose. The current Segmind defaults are Nano Banana Pro for maps, Seedream 4.5 for character art, and Ideogram 4.0 for faction art. OpenAI remains available as an image provider and currently supplies structured text and image editing in the recommended mixed setup.

Generated media is normalized to bytes and uploaded to MinIO. Cache identity includes provider, model, purpose, complete prompt, and requested size. A material prompt change therefore creates a new generation prefix instead of silently reusing art from an older contract.

## Change Checklist

When changing generated art:

1. Update the shared direction or character-variation source rather than patching only one route.
2. Check standalone and world-blueprint paths for map, faction, and character parity.
3. Preserve provider-neutral prompt composition; model request mechanics belong in `packages/ai`.
4. Keep prompts free of recognizable copied characters, locations, logos, or compositions.
5. Add or update prompt regression tests under `apps/watcher/test/prompts/`.
6. Run `pnpm --filter @talespin/watcher test`, `pnpm build:watcher`, and `pnpm lint`.
