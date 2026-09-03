# Explorer Architecture

## Status

This document defines the accepted target architecture for Talespin's first
mission-based explorer flow. The route surface, Story hierarchy, general
Mission and Interaction contracts, and deterministic game engine described
here are not implemented yet. Existing treasure-hunt models remain current
precedents rather than aliases for these target concepts.

## Application Decision

Explorer remains inside `apps/worldbuilder`, the existing Next.js application.
Builder and explorer are two product surfaces over the same authentication,
World data, characters, grid, Prisma services, MongoDB database, and generated
media. A separate explorer application would add a service and authentication
boundary without an independently owned runtime today.

Use one top-level App Router root layout and nested layouts for builder and
explorer presentation. Route groups may organize the source tree without
changing public URLs. Do not create multiple root layouts merely to separate
the experiences because crossing root layouts causes a full page navigation.

The target route surface is:

```text
/worlds
/worlds/[worldId]/...                              existing builder surface

/explore/worlds/[worldId]/join                     choose a character
/explore/stories/[storyId]                         story/chapter overview
/explore/stories/[storyId]/missions/[missionId]    active mission
```

An illustrative App Router organization is:

```text
app/
├── layout.tsx
├── (builder)/
│   └── worlds/...
└── (explorer)/
    └── explore/...
```

This is an organizational target, not a requirement to relocate existing
builder routes before explorer work begins.

Reconsider a separate application only when explorer requires independent
deployment or scaling, a distinct authentication boundary, independent release
ownership, or a game server consumed exclusively through a stable remote API.

## Explorer Entry Flow

```text
Select World
    |
    v
Select existing Character or create a Character
    |
    v
Start or resume Story
    |
    v
Enter active Chapter
    |
    v
Play Mission through Interactions
```

Selecting a Character does not transfer ownership of that Character. A
`StoryParticipant`-style association should reference the authenticated User,
Story, and selected Character. This keeps character authorship, availability,
and active play selection as separate policies and allows future stories or
multiplayer rules without rewriting Character ownership.

Use the authenticated `User` as the player identity for new explorer state. Do
not build new Story or Mission persistence around the standalone legacy
`Player` model without first defining and implementing its relationship to
`User`.

## Narrative Ownership

The explorer flow uses the established hierarchy without collapsing its levels:

| Concept       | Explorer responsibility                                                                                                                        |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `World`       | Reusable setting containing the grid, regions, factions, locations, and world-authored characters.                                             |
| `Story`       | One durable narrative in a World, including participants, long-term state, known facts, consequences, and unresolved threads.                  |
| `Chapter`     | A progression phase in the Story with explicit state and one or more Missions.                                                                 |
| `Mission`     | The primary stateful gameplay loop with objectives, a route, budget, progress, and terminal evaluation.                                        |
| `Interaction` | The smallest playable unit at a point on the route, containing context, available actions, player action, outcome, and accepted state changes. |

A Story references a World; it does not copy or rename the World. Shared world
canon and player-specific narrative state must remain distinct:

- World state contains authored or promoted setting facts.
- Story state contains player-specific knowledge, relationships, consequences,
  inventory, discoveries, and introduced characters.
- Chapter state contains progression for the current narrative phase.
- Mission state contains route and objective progress.
- Interactions form the durable action and outcome history.

Dynamically proposed characters receive stable identities and are scoped to the
Story by default. They must not silently become shared World canon. Promoting a
Story character into the reusable World should be an explicit builder action.

## First Mission Shape

The first Mission is a treasure hunt from one grid cell to another along a
specific path. It should contain at least:

- a Chapter and Story reference;
- an `IN_PROGRESS | SUCCESS | FAILED` lifecycle;
- one or more structured objectives;
- start and destination cell references;
- an ordered, validated path of walkable grid-cell references;
- the current path index or current cell reference;
- an action or interaction budget where required;
- terminal timestamps and failure details;
- ordered Interaction references.

The model may propose the mission premise, destination intent, encounter seeds,
or constraints. Deterministic TypeScript behavior selects or validates the
actual walkable path, enforces movement, advances the path cursor, applies the
budget, and evaluates objective predicates.

Each configured point on the path creates an Interaction opportunity. The
route may be planned up front, but the Interaction is generated when reached so
that it can use current Story, Chapter, Mission, location, character, discovery,
and prior-outcome state.

Interaction target and Interaction kind are separate concepts. The first slice
needs targets such as `WORLD` and `CHARACTER`; kinds may include `EXPLORATION`,
`DIALOGUE`, `DECISION`, and `DISCOVERY`. A character target references either a
world-authored Character or a Story-scoped generated character by stable ID.

## Runtime Boundaries

```text
Explorer UI and route handlers
             |
             v
worldbuilder application services and Prisma repositories
        |                                      |
        v                                      v
packages/game-engine                      apps/watcher
deterministic transitions                typed generation proposals
        |                                      |
        +------------------+-------------------+
                           v
                    packages/schema
```

`packages/game-engine` becomes justified when the first Mission transition is
implemented. It owns pure, testable behavior for path validation, legal
movement, budgets, objective evaluation, accepted state changes, and terminal
status. It does not call models or persist data.

Worldbuilder application services own authorization, idempotency, loading
authoritative state, invoking the game engine and watcher, transaction
boundaries, and DTO mapping. Prisma remains in worldbuilder until another real
application requires the same repositories.

Watcher owns Talespin-specific generation prompts and chains. It may propose a
Mission brief, Interaction situation, generated character, player-action
interpretation, narrative explanation, or semantic outcome. Every meaningful
proposal crosses a Zod schema before deterministic evaluation. Watcher never
persists or directly mutates authoritative gameplay state.

## Interaction Request Boundary

Each player action is a durable request boundary:

1. Authorize the User against the Story and active Character.
2. Load the current Story, Chapter, Mission, and pending Interaction.
3. Normalize structured or free-form input into a typed player action.
4. Reject stale, duplicate, out-of-turn, or mechanically illegal actions.
5. Ask watcher for a typed semantic proposal only when generation is required.
6. Validate the proposal and let the game engine accept, reject, or constrain
   state changes.
7. Persist the action, outcome, accepted changes, and updated Mission state in
   one idempotent application transaction.
8. Evaluate Mission termination, then propagate accepted consequences to
   Chapter and Story state.
9. Generate or enqueue the next Interaction only when the Mission continues.

Persist enough state to resume after process restarts or disconnected clients.
No in-memory model conversation, agent thread, or generated prose is the source
of truth.

## Orchestration and Agent Frameworks

Use existing LangChain runnables or direct structured model calls for the first
generation operations. Do not introduce Deep Agents into the authoritative
Mission loop: its open-ended planning, subagents, filesystem context, and
generic memory do not replace Story state or deterministic transitions.

LangGraph may be introduced once an executable workflow needs durable
branching, retries, parallel generation, or an explicit player interrupt/resume
boundary. Its graph state should contain workflow context and stable IDs, not a
second copy of the domain model.

Deep Agents may later serve bounded, non-authoritative workflows such as
builder-assisted Chapter planning or automated Mission play-testing. Those
workflows must still return typed proposals through the same validation and
game-engine boundary.

## Implementation Sequence

1. Define the smallest real Story, Chapter, Story participant, Mission,
   Interaction, action, outcome, and state-change contracts in
   `packages/schema`.
2. Add `packages/game-engine` with the first pure treasure-hunt transition and
   focused tests.
3. Add matching Prisma models and worldbuilder repositories/application
   services, including authorization and idempotent action submission.
4. Add explorer world selection, character selection or creation, and the
   active Mission route inside the existing Next.js application.
5. Add watcher generation contracts and chains for Mission briefs,
   Interactions, and Story-scoped characters.
6. Add LangGraph only when persisted application services no longer express the
   required orchestration clearly.

Every slice should keep Zod and Prisma representations aligned and test
transitions independently from generated prose.
