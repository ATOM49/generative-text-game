# Architecture

## Current Runtime

Talespin currently separates UI/database work from generation work:

```text
Browser
  |
  v
apps/worldbuilder (Next.js UI + API routes)
  |                         |
  v                         v
Prisma -> MongoDB      apps/watcher (Fastify)
                            |          |
                            v          v
                    packages/ai   packages/cdn
                            |          |
                            v          v
                         OpenAI       MinIO

packages/schema is shared across both applications.
```

`apps/worldbuilder/src/lib/api/` contains service and DTO mapping logic. `apps/watcher` owns generation routes, prompts, and LangChain runnable composition. `packages/ai` contains provider-facing primitives, not an agent graph. Prisma persistence remains inside worldbuilder.

The streamlined world-creation workflow is a concrete orchestration inside watcher: it enriches one seed, generates a map and factions in parallel, analyzes deterministic map cut-outs into regions, generates faction-grounded characters, then joins regions and factions through validated assignments. Watcher returns a typed proposal; worldbuilder validates references and persists the authoritative package.

## Mapping from the Proposed Architecture

| Proposed responsibility | Current location                       | Status                                                  |
| ----------------------- | -------------------------------------- | ------------------------------------------------------- |
| Player-facing web app   | `apps/worldbuilder`                    | Implemented for building; narrative play is incomplete. |
| Game server             | Next.js API routes plus `apps/watcher` | Split boundary; no authoritative game runtime yet.      |
| Domain package          | `packages/schema`                      | Implemented as Zod contracts.                           |
| Game engine             | No dedicated package                   | Add when mission transition logic is implemented.       |
| Agent orchestration     | Watcher chains and prompts             | LangChain runnables exist; LangGraph does not.          |
| Persistence package     | Worldbuilder Prisma/services           | Keep current until reuse justifies extraction.          |
| Generic shared package  | None                                   | Do not create a dumping ground.                         |
| Media infrastructure    | `packages/cdn`                         | Implemented with MinIO and Sharp.                       |

## Target Gameplay Boundary

The target dependency direction is:

```text
applications
    |
    v
orchestration / persistence
    |
    v
deterministic game engine
    |
    v
packages/schema
```

Runtime data may flow back to the client, but lower layers must not import higher layers. In particular:

- `packages/schema` must not depend on React, Prisma, Fastify, LangChain, or providers.
- deterministic gameplay must not call LLMs or persist implicitly;
- generated proposals cross boundaries through validated contracts;
- application services load state, invoke orchestration/engine behavior, persist results, and return client events;
- `packages/ai` remains reusable provider plumbing.

## Evolution Strategy

1. Add Story, Chapter, Mission, Interaction, action, outcome, and state-change contracts to `packages/schema` as real features require them.
2. Introduce `packages/game-engine` with the first deterministic mission transition; require pure-function tests.
3. Introduce `packages/agents` only when an actual graph or reusable gameplay orchestration exists. Keep model adapters in `packages/ai`.
4. Keep Prisma repositories in worldbuilder until both applications need authoritative game-state access; then extract persistence behind typed repository interfaces.
5. Preserve `apps/watcher` as the server-side generation boundary unless a deliberate game-server consolidation replaces it.

Do not perform a directory migration merely to match the target diagram. Move behavior when ownership, consumers, and tests make the new boundary concrete.
