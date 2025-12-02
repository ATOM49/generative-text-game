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
