# AI Package Instructions

`@talespin/ai` contains low-level model/provider runnables for structured output, image generation, and image editing. It is infrastructure, not the narrative agent or game-engine layer.

## Rules

- Keep reusable provider calls and response metadata here.
- Keep Talespin prompts, mission rules, graph state, persistence, HTTP handling, and UI concerns outside this package.
- Never let a runnable persist or directly mutate authoritative game state.
- Require callers to provide a Zod schema for meaningful structured output; callers should parse again at their trust boundary when needed.
- Read secrets from server-side options or environment variables. Never expose provider credentials to the browser or log them.
- Preserve provider/model metadata so generation can be diagnosed and evaluated.

If LangGraph is introduced, create a real orchestration package as described in `../../docs/architecture/LANGGRAPH.md`; do not turn these provider adapters into large gameplay nodes.

## Testing

Run `pnpm --filter @talespin/ai test` and `pnpm build:ai`. OpenAI integration cases require `OPENAI_API_KEY` and skip without it. Prefer mocked or fixture-based tests for deterministic behavior; do not assert exact generated prose.
