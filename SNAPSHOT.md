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
