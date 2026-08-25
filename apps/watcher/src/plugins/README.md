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

Provides provider-neutral image generation and editing. Decorates the Fastify instance with `fastify.imageGen`, exposing:

- `generateImageToCdn({ prompt, keyPrefix, purpose, size })`: Select the configured map, character, or faction model and cache by the complete generation identity.
- `editImageToCdn({ prompt, image, mask, keyPrefix, size })`: Edit an image with the independently configured editing provider.

Segmind is the image-generation default when `SEGMIND_API_KEY` is present. Nano Banana Pro generates maps, Seedream 4.5 generates character art, and Ideogram 4.0 generates faction art. Provider responses are normalized to bytes and uploaded to MinIO with their actual content type.

**Dependencies**: `@talespin/ai`, `@talespin/cdn`, `cdn` plugin

**Environment Variables**: See `apps/watcher/.env.example`. Credentials stay server-side.

---

Check out:

- [The hitchhiker's guide to plugins](https://fastify.dev/docs/latest/Guides/Plugins-Guide/)
- [Fastify decorators](https://fastify.dev/docs/latest/Reference/Decorators/).
- [Fastify lifecycle](https://fastify.dev/docs/latest/Reference/Lifecycle/).
