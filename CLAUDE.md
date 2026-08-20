# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

F1 First-Person Replay: an interactive replay of a historical F1 driver's lap, viewed from a first-person/cockpit-style perspective, with live telemetry (speed, gear, RPM, throttle, brake, DRS, lap progress) displayed during playback. The user watches, they don't drive — no physics simulation, no live races.

Data flow is fixed end to end: **OpenF1 (public historical telemetry API) → NestJS ingestion → PostgreSQL → NestJS REST API → Flutter**. OpenF1 is only ever called by the backend; Flutter never talks to it directly, and never talks to Postgres directly — it only calls the NestJS REST API over HTTP.

**V1 scope is deliberately narrow: one session, one driver, one lap.** Concretely: 2024 British GP at Silverstone, Race session (`session_key=9558`), Lewis Hamilton (`driver_number=44`), Lap 42. The schema and API are still parameterized by session/driver/lap (not hardcoded) so that widening to more laps/drivers/races later is a data problem, not a re-architecture. Explicitly out of scope for V1: live races, multiple drivers/laps/seasons, WebSockets, user accounts, multiplayer, real physics, photorealistic/full-3D rendering, and advanced caching infra.

The full build plan (data model, module breakdown, decisions and their rationale) lives in `/.claude/plans/v1-build-plan.md` — read it for the "why" behind the architecture below before making structural changes.

## Commands

Package manager is **bun**, not npm/yarn — use `bun run <script>`, not `npm run`.

```bash
bun install                       # install deps
bun run start:dev                 # NestJS dev server, watch mode
bun run build                     # nest build
bun run lint                      # eslint --fix over src/apps/libs/test
bun run format                    # prettier --write over src/test

bun run test                      # unit tests (jest, rootDir: src, matches *.spec.ts)
bun run test path/to/x.spec.ts    # single unit test file
bun run test:watch
bun run test:cov
bun run test:e2e                  # e2e tests (test/jest-e2e.json config, matches test/*.e2e-spec.ts)
```

Copy `.env.example` to `.env` before running the app — `DATABASE_URL`, `PORT`, `OPENF1_BASE_URL`.

Ingestion (populates Postgres from OpenF1 for a given session/driver/lap) and TypeORM migrations are run via CLI commands defined under `src/app/ingestion` / `src/database` — see the plan doc for the exact invocation once implemented.

## Architecture

**Module pattern**: every domain lives under `src/app/<domain>/` with a consistent shape — `entities/`, `dtos/`, `<domain>.controller.ts`, `<domain>.module.ts`, `<domain>.service.ts`, `<domain>.repository.ts`. This was established by the `meetings` module and every subsequent domain (sessions, drivers, laps, telemetry, replay, ingestion) follows it. Repositories are the only layer that talks to TypeORM; services hold business logic; controllers are thin.

**Entities are domain-first, not ORM-first**: entity classes (e.g. `src/app/meetings/entities/meeting.entity.ts`) are plain TypeScript classes with camelCase fields mirroring OpenF1's JSON response shape 1:1 (with JSDoc per field) and a `constructor(data: Partial<T>)`. TypeORM `@Entity`/`@Column` decorators are added directly to these same classes rather than maintaining a separate persistence model. A `SnakeNamingStrategy` (from `typeorm-naming-strategies`) maps camelCase TS fields to snake_case Postgres columns automatically, so `meetingKey` → `meeting_key` without manual `@Column({ name: ... })` annotations.

**Data model mirrors OpenF1 resources closely, raw**: `meetings`, `sessions`, `drivers`, `laps`, `car_data` (telemetry: rpm/speed/gear/throttle/brake/drs), `location` (x/y/z position). `car_data` and `location` are two separate ~3.7Hz feeds from OpenF1 that don't share timestamps — they're stored as-ingested rather than pre-merged. The merge (nearest-timestamp join into one time-ordered array of `{elapsedMs, progress, x, y, speed, gear, rpm, throttle, brake, drs}` samples) happens at **read time** in `src/app/replay`, which is the only endpoint Flutter actually calls (`GET /replay/:sessionKey/:driverNumber/:lapNumber`). This keeps ingestion a dumb copy and keeps the merge logic in one place.

**Ingestion is offline, not a live endpoint**: `src/app/ingestion` wraps OpenF1's REST API (via native `fetch`, no axios dependency) and is triggered manually via a `nest-commander` CLI command, scoped to a specific session/driver/lap's time window (not a full race) to keep V1 data volume small.

**Flutter (`flutter_app/`)** is a separate project in this same repo (monorepo - and the folder structure yet to be decided). It renders the track as a 2D top-down shape drawn directly from the lap's own recorded `(x, y)` position samples — there's no separate circuit-geometry data source, the driver's own telemetry trace *is* the track outline. A single `Ticker`/`AnimationController`-driven screen animates a dot along that path in sync with a telemetry HUD overlay (speed/gear/RPM/throttle/brake/DRS) and play/pause/replay controls. No external state-management package for V1 — one screen doesn't need one. Since Flutter web and the NestJS API run on different origins during dev, CORS is enabled in `src/main.ts`.
