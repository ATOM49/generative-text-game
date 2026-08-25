# Worldbuilder Application Instructions

`@talespin/worldbuilder` is the Next.js UI and current application/persistence boundary. It owns authentication, builder/explorer authorization, App Router pages and API routes, Prisma access, service DTO mapping, and calls to watcher.

Read `../../docs/product/GAME_CONTEXT.md` and `../../docs/architecture/ARCHITECTURE.md` before adding player-facing gameplay.

## UI and API Rules

- Keep pages and components focused on rendering state and collecting actions; authoritative gameplay rules do not belong in React components or Zustand stores.
- Put reusable UI in `src/components/`, API/domain coordination in `src/lib/api/`, and endpoints in `src/app/api/**/route.ts`.
- Validate request data with `@talespin/schema`, enforce `requireUser`/role guards server-side, and wrap route logic in `try/catch` delegating to `handleApiError`.
- Keep Prisma calls in services, map database records to shared DTOs explicitly, and throw `ApiError` for expected HTTP failures.
- Treat watcher responses as untrusted external data and validate them before persistence.
- Keep `DATABASE_URL`, NextAuth secrets, OAuth credentials, and watcher configuration server-side. Only intentionally public values may use `NEXT_PUBLIC_`.

Prisma is the current persistence location, not the domain source of truth. Update `packages/schema` contracts, Prisma models, DTO mappings, and API consumers together. Do not embed future Story/Mission rules in persistence services; delegate to a deterministic engine when that boundary exists.

## Database and Verification

After Prisma changes, run:

```bash
pnpm --filter @talespin/worldbuilder exec prisma generate
```

Use `pnpm build:world` and `pnpm lint` for application changes. Include screenshots for visible UI changes and test both builder and explorer authorization paths when behavior differs by role.
