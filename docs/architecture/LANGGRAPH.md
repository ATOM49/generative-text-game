# LangGraph Architecture

## Status

LangGraph is a target orchestration option, not a current dependency. The repository currently uses LangChain `Runnable`, `RunnableLambda`, and OpenAI wrappers in `packages/ai` and `apps/watcher`. Do not describe existing chains as graphs or add graph-shaped boilerplate without an executable workflow.

## Intended Role

If adopted, LangGraph coordinates long-running narrative workflows, branching, and player interrupt/resume boundaries. It does not own domain entities, deterministic game rules, or persistence models.

Keep provider adapters in `packages/ai`. Put gameplay graphs, nodes, graph state, and reusable prompts in a dedicated `packages/agents` package once it has working consumers.

## Target Lifecycles

```text
Story: initialize -> prepare chapter -> run missions
       -> complete chapter -> evaluate story

Mission: start -> generate interaction -> await player action
         -> resolve -> apply validated changes -> evaluate
         -> continue or terminate
```

`await player action` should be an interrupt/resume boundary. Persist enough authoritative state to resume safely; do not depend on an in-memory graph execution surviving between requests.

## Graph State

Graph state should contain only typed workflow context, such as IDs, current lifecycle state, relevant domain snapshots, pending player action, proposed outcome, and validated changes. Avoid copying unrelated application state or creating a second representation of every domain entity.

## Node Rules

Each node should perform one conceptual operation. Prefer names such as:

```text
generateInteraction
interpretPlayerAction
resolveInteraction
evaluateMission
```

Avoid nodes such as `runEntireMission` or `processStory`. Generation nodes may call `packages/ai`; rule evaluation should delegate to the future game engine. Persistence should occur at explicit application checkpoints.

## Structured Output and Testing

Validate meaningful model outputs with Zod contracts distinct from persisted entities when appropriate. Test graph routing with mocked model responses and deterministic fixtures. Separately test state transitions in the game engine so graph tests do not become the only proof of gameplay correctness.
