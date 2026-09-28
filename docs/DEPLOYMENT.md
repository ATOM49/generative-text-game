# Deployment

Talespin ships as two container images built from the repository root. Local
setup lives in [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md); this guide covers
production-like containers.

## Images

```bash
docker build -f apps/worldbuilder/Dockerfile \
  --build-arg MINIO_PUBLIC_HOST=https://cdn.example.com \
  -t talespin-worldbuilder .

docker build -f apps/watcher/Dockerfile -t talespin-watcher .
```

Both images run as the non-root `node` user on Node 20.19.0. No secrets are
needed to build; `.dockerignore` keeps local `.env` files out of the context.

## Processes

Run four long-lived processes. The worldbuilder image serves the web app and
both workers:

| Process          | Image                   | Command                       | Port |
| ---------------- | ----------------------- | ----------------------------- | ---- |
| Web              | `talespin-worldbuilder` | default (`next start`)        | 3000 |
| World worker     | `talespin-worldbuilder` | `worker:world-generation`     | —    |
| Narrative worker | `talespin-worldbuilder` | `worker:narrative-generation` | —    |
| Watcher          | `talespin-watcher`      | default (`start:prod`)        | 4000 |

The workers poll MongoDB, so the platform must keep them running; serverless
hosting that only runs request handlers cannot host them. Apply Prisma indexes
once per deploy with:

```bash
docker run --rm -e DATABASE_URL=... talespin-worldbuilder exec prisma db push --skip-generate
```

The watcher listens on `0.0.0.0` (port from `PORT`, default 4000) and has no
request authentication. Keep it on a private network reachable only by the web
app and workers.

## Runtime Configuration

Pass configuration as environment variables. Use the committed
`.env.example` files for the full list.

Worldbuilder (web and workers):

- `DATABASE_URL`: MongoDB replica-set connection string.
- `NEXTAUTH_SECRET` and `AUTH_URL`: Auth.js signing secret and public origin.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`,
  `FACEBOOK_CLIENT_SECRET`: required at runtime; auth requests fail without
  them. `E2E_TEST_MODE` is ignored in production.
- `WATCHER_API_URL`: private watcher URL, for example `http://watcher:4000`.
- `MINIO_PUBLIC_HOST` and `MINIO_BUCKET`: the public CDN origin that
  `next/image` may optimize. The build args become defaults and can be
  overridden at runtime.

Watcher:

- Provider keys and selectors (`OPENAI_API_KEY`, `SEGMIND_API_KEY`,
  `AI_*_PROVIDER`). The watcher refuses to start without the image key.
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`,
  `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `MINIO_PUBLIC_HOST`. The bucket must allow
  anonymous downloads.

`NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY` is inlined into client bundles, so
pass it as a worldbuilder build arg when it is used.
