# Domain Model

## Current Model

`packages/schema` is the runtime contract source of truth, with MongoDB representations in `apps/worldbuilder/prisma/schema.prisma`.

```text
World
├── WorldGrid -> GridCell
├── Location
├── Faction / Culture / Species / Archetype
├── Character
├── Relationship
├── TreasureHuntConfig
├── TreasureHuntRun -> TreasureHuntEvent
└── PlayerWorldExploration
```

`World` is the current aggregate around a setting. Locations use relative coordinates and optional grid-cell references; they are not hierarchical. Characters and factions have stable IDs and structured metadata. `Campaign` currently stores start/end entities, a goal, constraints, and status, but has no Story/Chapter/Mission lifecycle.

## Target Narrative Model

```text
Story
├── Plot
├── World reference
├── Character references
├── Chapters
└── StoryState

Chapter
├── ChapterState
└── Missions

Mission
├── Objectives
├── MissionState
└── Interactions

Interaction
├── Context
├── AvailableActions
├── PlayerAction
├── Outcome
└── StateChanges
```

The Story should own the plot; chapters and missions advance it. A Story should reference an existing World rather than duplicate the setting. Persistent entities should be referenced by stable IDs.

## Mapping Rules

| Target concept | Current analogue              | Guidance                                                           |
| -------------- | ----------------------------- | ------------------------------------------------------------------ |
| Story          | None                          | Add a new aggregate; do not rename `World`.                        |
| Chapter        | None                          | Add only with explicit progression state.                          |
| Mission        | `Campaign`, `TreasureHuntRun` | Reuse lessons, not identity; define objectives and terminal rules. |
| Interaction    | `TreasureHuntEvent`           | Generalize through typed action/outcome contracts.                 |
| World          | `World`, grid, locations      | Preserve as the reusable setting model.                            |
| State change   | Event payloads and run fields | Move toward explicit discriminated unions.                         |

## Modeling Rules

- Define runtime schemas with Zod and infer TypeScript types.
- Prefer discriminated unions for actions, outcomes, state changes, and lifecycle states.
- Separate creation/generated-output schemas from authoritative persisted schemas when their trust boundaries differ.
- Keep the domain free of UI, LLM, orchestration, and database dependencies.
- Update Zod and Prisma representations together when persistence changes.
- If hierarchical locations are introduced, add explicit parent and semantic type fields; do not infer meaning solely from tree depth or map coordinates.
