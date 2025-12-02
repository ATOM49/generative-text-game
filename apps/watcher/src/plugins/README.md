# Plugins Folder

Plugins define behavior that is common to all the routes in your
application. Authentication, caching, templates, and all the other cross
cutting concerns should be handled by plugins placed in this folder.

Files in this folder are typically defined through the
[`fastify-plugin`](https://github.com/fastify/fastify-plugin) module,
making them non-encapsulated. They can define decorators and set hooks
that will then be used in the rest of your application.

## Available Plugins

### `cdn.ts`

Registers a MinIO client instance for CDN operations (image uploads, retrievals, etc.). Decorates the Fastify instance with `fastify.cdn`, providing methods like:

- `uploadBuffer({ buffer, keyPrefix, contentType })`: Upload binary data to MinIO and return public URL
- `findObjectByPrefix({ keyPrefix, select })`: Find existing objects by prefix (useful for cache lookups)
- `getPublicURL(key)`: Generate public URL for a stored object

**Dependencies**: `@talespin/cdn` package

### `cors.ts`

Enables CORS (Cross-Origin Resource Sharing) support for the API using `@fastify/cors`. Allows the frontend (Next.js worldbuilder) to make requests to the watcher service.

**Dependencies**: `@fastify/cors`

### `sensible.ts`

Adds useful utilities for handling HTTP errors and common responses via `@fastify/sensible`. Provides helpers like `fastify.httpErrors.badRequest()`, `fastify.assert()`, etc.

**Dependencies**: `@fastify/sensible`

### `image-generation.ts`

Provides AI-powered image generation and editing capabilities via OpenAI's DALL-E. Decorates the Fastify instance with `fastify.imageGen`, exposing:

- `generateImageToCdn({ prompt, keyPrefix, size })`: Generate images using DALL-E 3 with intelligent caching by keyPrefix to avoid redundant OpenAI calls. Works for maps, characters, factions, or any other image type—just provide the appropriate keyPrefix.
- `editImageToCdn({ prompt, image, mask, keyPrefix, size })`: Edit existing images using DALL-E 2's inpainting capabilities

This plugin implements intelligent caching by checking MinIO for existing images before invoking OpenAI, significantly reducing API costs. It also cleanly separates AI buffer generation from CDN upload logic for maintainability.

**Dependencies**: `@talespin/ai`, `@talespin/cdn`, `cdn` plugin

**Environment Variables**: Requires `OPENAI_API_KEY`

---

Check out:

- [The hitchhiker's guide to plugins](https://fastify.dev/docs/latest/Guides/Plugins-Guide/)
- [Fastify decorators](https://fastify.dev/docs/latest/Reference/Decorators/).
- [Fastify lifecycle](https://fastify.dev/docs/latest/Reference/Lifecycle/).
