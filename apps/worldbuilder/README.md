## Talespin Worldbuilder

The worldbuilder app is a Next.js 15 client for creating and curating Talespin worlds. It relies on MongoDB via Prisma, the shared `@talespin/schema` package, and now uses **NextAuth** with Google and Facebook providers for authentication.

## Getting Started

```bash
# From repo root
pnpm install

# Generate Prisma client after any schema change
pnpm --filter @talespin/worldbuilder exec prisma generate

# Start the Next.js dev server on :3000
pnpm dev:world
```

### Required Environment Variables

Create `apps/worldbuilder/.env` (or populate your shared env) with the following:

```env
DATABASE_URL="mongodb://localhost:27017/talespin?replicaSet=rs0"
WATCHER_API_URL="http://localhost:4000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-long-random-string"

# OAuth providers
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
FACEBOOK_CLIENT_ID="..."
FACEBOOK_CLIENT_SECRET="..."

NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY="..."
```

Restart `pnpm dev:world` any time you change `NEXTAUTH_*` or provider credentials.

### Authentication & Roles

- Sign-in is handled by NextAuth (JWT session strategy) with Google and Facebook providers.
- A `User` + `Account` schema has been added to Prisma. Users default to the `EXPLORER` role when they first log in.
- **Builder** role enables world creation, map editing, and access to watcher-backed mutations. Explorers can browse maps and data but cannot mutate.
- Promote a user by updating their record via Prisma Studio or `mongosh`. Example:

```bash
# Open Prisma Studio and edit the user entry's role column
pnpm --filter @talespin/worldbuilder exec prisma studio
```

### Prisma Maintenance

```bash
# Re-generate client after schema changes
pnpm --filter @talespin/worldbuilder exec prisma generate

# Push schema to MongoDB (requires replica set)
cd apps/worldbuilder
pnpm dlx prisma db push
```

### Development Tips

- Protected routes: All `/api/*` endpoints (except `/api/auth/*`) and worldbuilder pages now require an authenticated session. Unauthenticated users are redirected to `/signin`.
- The `/signin` page exposes Google and Facebook buttons. Callback URLs inherit the page you attempted to visit.
- Builder-only UI affordances (create world dialog, grid editors, watcher calls) are hidden from explorers, but server routes also enforce roles for defense in depth.
