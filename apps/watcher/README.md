# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)

This project was bootstrapped with Fastify-CLI.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:4000](http://localhost:4000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

## AI Provider Configuration

Copy `.env.example` to an ignored `.env` file and set server-side credentials.
When `SEGMIND_API_KEY` is present, image generation defaults to these Segmind
model endpoints:

| Asset         | Model           | Endpoint              | Adapter settings                                                                       |
| ------------- | --------------- | --------------------- | -------------------------------------------------------------------------------------- |
| Maps          | Nano Banana Pro | `/v1/nano-banana-pro` | square-aware aspect ratio, 2K PNG, image-only output                                   |
| Character art | Seedream 4.5    | `/v1/seedream-4.5`    | 2K, portrait-aware aspect ratio, one image                                             |
| Faction art   | Ideogram 4.0    | `/v1/ideogram-4`      | balanced rendering, square HD PNG, safety checking, prompt expansion ($0.03 surcharge) |

Override the slugs with `SEGMIND_MAP_MODEL`, `SEGMIND_CHARACTER_MODEL`, and
`SEGMIND_FACTION_MODEL`. `AI_TEXT_PROVIDER` and `AI_IMAGE_EDIT_PROVIDER` are
independent because their Segmind request schemas depend on models that have
not been selected yet. Provider credentials are read only by watcher and must
never be returned to worldbuilder or written to logs.

Segmind V1 media is normalized into a buffer and uploaded to MinIO. CDN cache
keys include provider, model, purpose, prompt, and requested size, preventing a
provider switch from reusing an unrelated older asset.

Ideogram's public schema permits disabling prompt expansion, but the live API
currently rejects `enable_prompt_expansion: false` with HTTP 400. The adapter
keeps it enabled until Segmind fixes that request path.

## Using Shared Schemas

The watcher app can import types and Zod schemas from `@talespin/schema`:

```typescript
import {
  FactionFormSchema,
  type FactionForm,
  type World,
  WorldFormSchema,
} from '@talespin/schema';

// Use in route type definitions
fastify.post<{
  Body: World;
  Reply: FactionForm | ErrorResponse;
}>('/', async (req, reply) => {
  const world = req.body; // Typed as World

  // Use Zod schema for validation with AI
  const result = await runnable.invoke({
    prompt,
    schema: FactionFormSchema,
  });

  return reply.send(result.structuredResponse);
});
```

**Important**: After making changes to schemas in `packages/schema`, run:

```bash
pnpm build:schema
```

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
