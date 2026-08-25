# Game Context

## Status

This document combines the current Talespin product with its intended narrative-game direction. Sections marked **Current** describe implemented repository behavior. Sections marked **Target** guide future work and must not be presented as already shipped.

## Product Concept

**Current:** Talespin is a collaborative worldbuilding application. A builder creates a persistent world, map grid, locations, factions, cultures, species, archetypes, and characters. AI generation helps produce structured profiles and artwork. Builder and explorer roles already distinguish content creation from play-oriented access.

**Target:** Talespin becomes a text-based generative game in which an AI game master operates over durable, structured state. Players should interact with characters, locations, objectives, knowledge, and consequences rather than merely request the next block of prose.

Narrative prose is a view over game state. Authoritative state must not be reconstructed solely from prose.

## Narrative Hierarchy

The target hierarchy is:

```text
Story
└── Chapters
    └── Missions
        └── Interactions
```

- A **Story** owns the plot, world reference, major characters, chapters, long-term state, and unresolved threads.
- A **Chapter** advances a phase of the Story using existing state. It may introduce locations, characters, and several missions.
- A **Mission** is the primary stateful gameplay loop, with objectives and explicit success or failure conditions.
- An **Interaction** is the smallest playable unit: dialogue, exploration, combat, investigation, decision, puzzle, skill check, or discovery.

These contracts do not yet exist in `packages/schema`. Introduce them deliberately rather than repurposing current types by name alone.

## Current Gameplay Precedent

The treasure-hunt model is the closest implemented domain precedent:

- `TreasureHuntRun` stores status, action budget, position, path, discoveries, and terminal timestamps.
- `TreasureHuntEvent` records `MOVE` and `EXPLORE` actions with structured payloads.
- `PlayerWorldExploration` preserves discoveries and aggregate run progress.

This is narrower than the target Mission/Interaction model, but it demonstrates the required pattern: persistent state plus explicit events and terminal evaluation.

## Persistent Consequences

Future interactions should be able to propose explicit changes such as character disposition or knowledge, location access, inventory ownership, faction attitude, discoveries, and objective progress. Validated game logic applies those changes; later generation receives the updated state and must not contradict it.
