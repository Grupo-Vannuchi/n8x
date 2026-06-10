# System snapshot — restore / "initiate the system"

This repo has a saved restore point: the committed code **plus** an exact database
dump at [`prisma/backups/snapshot.sql`](prisma/backups/snapshot.sql).

Snapshot contents (data): 1 admin user, **150 informations**, **8 services**,
**10 portfolio projects** and **13 clients** — all with **real cover/logo images**
(Google Drive `lh3.googleusercontent.com` URLs set via the admin). No
testimonials/team/stats.

Git tag for this exact state: **`snapshot-2026-06-09`** (moves to the latest save).

## Initiate the system (bring it back exactly)

```bash
docker compose up -d          # start Postgres (container n8x-marketing-db, host port 5433)
npm install                   # only if node_modules is missing
npm run db:generate           # generate the Prisma client
npm run db:restore            # load prisma/backups/snapshot.sql (exact data, drops + recreates)
npm run dev                   # http://localhost:3000
```

Admin login: `admin@example.com` / `changeme123` at `/admin`.

> Requires the local `.env` with `DATABASE_URL` (git-ignored, stays on the machine).
> To restore onto a *different* machine, recreate `.env` first.

## Rebuild data from seeds instead of the dump (optional)

If you'd rather regenerate the data from code (e.g. fresh DB, no dump):

```bash
npm run db:migrate            # apply schema
npm run db:seed               # admin user + 150 informations
npx tsx prisma/seed-services.ts          # 8 services
npx tsx prisma/seed-projects.ts          # 10 project base records (real Drive covers)
npx tsx prisma/seed-projects-content.ts  # project case content
npx tsx prisma/seed-clients.ts           # 13 clients (real Drive logos)
```

## Re-save a new snapshot later

```bash
npm run db:dump               # overwrites prisma/backups/snapshot.sql
git add -A && git commit -m "snapshot: <what changed>"
```

## Production deploy — Supabase (DB) + Render (app)

Prisma uses **two** connections: `DATABASE_URL` (runtime) and `DIRECT_URL`
(migrations) — see `.env.example` and `prisma/schema.prisma`.

1. **Supabase**: create the project; from Settings → Database → Connection string,
   take the **pooled** URL (port 6543, add `?pgbouncer=true`) for `DATABASE_URL`
   and the **direct** URL (port 5432) for `DIRECT_URL`.
2. **Load data into Supabase** (once), either:
   - exact dump: `cat prisma/backups/snapshot.sql | docker exec -i n8x-marketing-db psql "<DIRECT_URL>"`, or
   - from code: `npx prisma migrate deploy` then run the seeders (see above).
3. **Render**: deploy via [`render.yaml`](render.yaml) (Blueprint). Set the secret
   env vars (`DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`)
   in the dashboard. Build runs `prisma generate` (postinstall); `prisma migrate
   deploy` runs as the pre-deploy step.

> Keep Render at **1 instance** — the content cache (`revalidateTag`/`updateTag`)
> is per-instance, so with multiple instances admin edits only refresh the one
> that served them until the time-based fallback. Scaling out needs a shared
> cache handler (e.g. Redis).
