# Gameplay Loop

## Story and Mission Loop

A Mission is iterative, not a one-shot generated sequence.

```text
Prepare three-Chapter Story
      |
      v
Start active Mission
      |
      v
Select any destination cell
      |
      v
Calculate route, terrain legs, and stops
      |
      v
Choose transport when required
      |
      v
Advance cell by cell to next stop
      |
      v
Generate and resolve Interaction
      |
      v
Validate state changes and evaluate Mission
   /        \
continue   success / failure
   |
   +------> travel or interact
```

Story creation queues an outline with exactly three narrative beats, but does
not choose the finale cell. Chapter 1 starts at the grid home cell. Each later
Chapter starts at the prior Mission's concluding cell. Chapter 3 chooses its
finale only when its Mission activates, using narrative criteria with a
deterministic distant-cell fallback.

The generation step receives current Story, Chapter, Mission, location,
relevant characters, prior interactions, player state, objectives, and known
facts. It may propose a situation or semantic outcome, but it cannot rewrite
authoritative state. A leased `NarrativeJob` makes outline, setup, Interaction,
and resolution work recoverable across process restarts.

## Travel

All cells are selectable, including `walkable=false` cells. Route calculation
still follows orthogonally adjacent cells and prefers lower-difficulty terrain.
Traversal classification uses this precedence:

1. explicit `GridCell.traversal`;
2. deterministic biome, name, and tag normalization;
3. legacy `walkable`, where `false` means transport is required rather than
   unreachable.

The engine divides a route into compatible terrain legs. It pauses before a
leg that needs transport and validates the selected option against the required
medium. Walking is automatic for suitable land. Water, mountain,
subterranean, aerial, arcane, and unusual non-walkable terrain always have
deterministic options, so failed generation cannot strand the explorer.

`CONTINUE_TRAVEL` crosses cells only until the next terrain, waypoint,
encounter, discovery, or destination stop. Each accepted cell is persisted and
revealed, and its transport-modified cost is charged. Rerouting replaces only
the active `TravelPlan`; objectives, Story state, revealed cells, and consumed
budget remain authoritative.

## Action and Resolution Boundaries

Suggested actions, free-form text, and structured UI actions should normalize into typed player-action contracts. Resolution produces:

- a structured outcome;
- a player-facing explanation;
- proposed state changes;
- new discoveries;
- objective progress.

Use deterministic rules whenever mechanics are explicit. For example, movement legality, action budgets, inventory requirements, and objective predicates should be TypeScript behavior rather than prompt instructions.

Every submitted action carries an `actionId` and `expectedVersion`. The unique
Mission/action pair prevents duplicate application, while stale versions return
`409` so the client refreshes canonical state. A blocking Interaction or
pending generation job prevents additional travel.

## Mission Evaluation

Evaluate after every resolved interaction. The minimum states are:

```text
IN_PROGRESS | SUCCESS | FAILED
```

Additional explicit states may include `BLOCKED`, `ABANDONED`, or `PAUSED`. Do not accept prose such as “the mission is complete” as the sole terminal condition. Ground completion in structured objectives or evaluated predicates.

On termination, persist mission events and state, then propagate consequences to Chapter and Story state. Failure retains the attempt and its history. Retry restores the Chapter checkpoint into a new Mission attempt linked through `retryOfMissionId`.

## Current Precedent

`TreasureHuntRun` already demonstrates an action budget, current position, key/treasure progress, and `ACTIVE | SUCCESS | FAILED` status. `TreasureHuntEvent` separates movement from exploration events. Preserve that event-and-state pattern when introducing broader Missions and Interactions.

## Testing Priorities

Prioritize tests for action validation, state transitions, objective evaluation, terminal routing, idempotent event handling, and persistence mapping. Test generated data through schemas, fixtures, mocked model responses, or evals; avoid exact prose equality.
