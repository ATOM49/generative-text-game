# Gameplay Loop

## Target Mission Loop

A Mission is iterative, not a one-shot generated sequence.

```text
Start Mission
      |
      v
Generate Interaction
      |
      v
Present Situation
      |
      v
Player Action
      |
      v
Resolve Action
      |
      v
Validate and Apply State Changes
      |
      v
Evaluate Mission
   /        \
continue   success / failure
   |
   +------> Generate Interaction
```

The generation step receives current Story, Chapter, Mission, location, relevant characters, prior interactions, player state, objectives, and known facts. It may propose a situation or semantic outcome, but it must not rewrite authoritative state.

## Action and Resolution Boundaries

Suggested actions, free-form text, and structured UI actions should normalize into typed player-action contracts. Resolution produces:

- a structured outcome;
- a player-facing explanation;
- proposed state changes;
- new discoveries;
- objective progress.

Use deterministic rules whenever mechanics are explicit. For example, movement legality, action budgets, inventory requirements, and objective predicates should be TypeScript behavior rather than prompt instructions.

## Mission Evaluation

Evaluate after every resolved interaction. The minimum states are:

```text
IN_PROGRESS | SUCCESS | FAILED
```

Additional explicit states may include `BLOCKED`, `ABANDONED`, or `PAUSED`. Do not accept prose such as “the mission is complete” as the sole terminal condition. Ground completion in structured objectives or evaluated predicates.

On termination, persist mission events and state, then propagate consequences to Chapter and Story state.

## Current Precedent

`TreasureHuntRun` already demonstrates an action budget, current position, key/treasure progress, and `ACTIVE | SUCCESS | FAILED` status. `TreasureHuntEvent` separates movement from exploration events. Preserve that event-and-state pattern when introducing broader Missions and Interactions.

## Testing Priorities

Prioritize tests for action validation, state transitions, objective evaluation, terminal routing, idempotent event handling, and persistence mapping. Test generated data through schemas, fixtures, mocked model responses, or evals; avoid exact prose equality.
