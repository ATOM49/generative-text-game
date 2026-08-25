# Schema Package Instructions

`@talespin/schema` is the canonical runtime-contract package. Read `../../docs/product/DOMAIN_MODEL.md` and `../../docs/product/GAME_CONTEXT.md` before adding narrative entities.

## Boundaries

- Keep this package independent of React, Next.js, Fastify, Prisma, LangChain, OpenAI, and storage clients.
- Use Zod for runtime validation and infer exported TypeScript types with `z.infer`.
- Preserve the existing `BaseSchema`, `FormSchema`, authoritative `Schema`, and inferred-type pattern where it fits.
- Export new public contracts from `src/index.ts`; follow the surrounding file's import-specifier style and preserve the ESM build output.
- Prefer discriminated unions for action, event, outcome, state-change, and lifecycle variants.
- Give persistent entities explicit IDs. Reference existing characters, worlds, locations, and missions instead of embedding regenerated copies.

## Current and Target Models

`World`, grid, character, faction, treasure-hunt, and exploration schemas are current. Story, Chapter, Mission, and general Interaction contracts are target concepts; add them only with real behavior and persistence plans. Do not rename `World`, `Campaign`, `TreasureHuntRun`, or `TreasureHuntEvent` to imply equivalence.

When a schema is persisted, update `../../apps/worldbuilder/prisma/schema.prisma` and its service DTO mapping in the same change. Generation-input/output schemas may differ from persisted schemas when trust boundaries differ.

## Verification

Run `pnpm build:schema`, then build or test affected consumers. Add focused schema tests when introducing refinements, unions, defaults, or compatibility-sensitive parsing.
