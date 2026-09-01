# Architecture Decisions

This file records current and target decisions imported from the product design context. “Accepted (target)” means the direction is intentional but not fully implemented.

## ADR-001: Zod is the runtime contract source of truth

**Status:** Accepted (current)

Shared request, generation, and domain boundaries use schemas from `packages/schema`; TypeScript types should be inferred where practical. Persisted Prisma models must be updated alongside their Zod counterparts.

## ADR-002: Story owns the plot and references a World

**Status:** Accepted (target)

The future `Story` aggregate owns plot progression, chapters, and long-term narrative state. `World` remains the reusable setting and must not be renamed or duplicated to simulate Story support.

## ADR-003: Missions are iterative gameplay loops

**Status:** Accepted (target)

A Mission evolves through player-driven Interactions and explicit terminal evaluation. It is not generated upfront as a static sequence. `TreasureHuntRun` and `TreasureHuntEvent` are the current precedent for durable loop state plus events.

## ADR-004: LLMs do not directly mutate authoritative state

**Status:** Accepted (target; partially current)

Models may generate narrative, interpret actions, and propose typed outcomes or changes. Zod validates the proposal; deterministic logic evaluates it; application services persist accepted transitions.

## ADR-005: Deterministic gameplay gets an independent boundary

**Status:** Accepted (target)

Mission rules, objectives, action validation, state changes, traversal, and inventory mechanics must be testable without an LLM. Create `packages/game-engine` when this behavior is implemented, not before.

## ADR-006: Orchestration is not the domain model

**Status:** Accepted (target)

LangChain or a future LangGraph workflow coordinates operations but does not become the source of truth for entities or rules. Graph nodes delegate to typed domain and engine functions.

## ADR-007: Location hierarchy is explicit

**Status:** Accepted (target)

Current locations are flat points with relative coordinates. A future hierarchy must use explicit parent references and semantic location types such as region, settlement, building, or room; semantics must not be inferred solely from depth.

## ADR-008: Extract packages only around real ownership

**Status:** Accepted (current)

Prisma remains in worldbuilder and orchestration remains in watcher until multiple consumers or independent testing justify extraction. Do not create empty `agents`, `game-engine`, `persistence`, or `shared` packages solely to match a diagram.

## ADR-009: Regions are semantic grid territories

**Status:** Accepted (current)

A Region owns explicit references to one or more persisted grid cells and normalized map crop bounds. Region descriptions may be proposed from image cut-outs, but deterministic partitioning must cover every grid cell exactly once before persistence. Faction presence is an explicit region field with influence and rationale; it must reference factions created in the same world.

## ADR-010: Generated art uses one shared visual contract

**Status:** Accepted (current)

Map, faction, and character generation share a descriptive high-fidelity pixel-art contract owned by watcher prompts. Asset-specific composition may differ, but standalone and world-blueprint paths must reuse the same rendering and text-free constraints. Character variation is deterministic per identity/context and preserves one story-derived signature prop across gallery angles. Provider adapters remain visual-style agnostic, and prompt/provider/model/size changes produce distinct CDN cache identities.
