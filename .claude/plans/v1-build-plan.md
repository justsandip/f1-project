# F1 First-Person Replay — V1 Build Plan

## Context

We're building a V1 slice of an "F1 first-person replay" app: one historical session, one driver (Lewis Hamilton), one circuit, one lap, replayed with live telemetry. Architecture is fixed by the brief: `OpenF1 → NestJS ingestion → PostgreSQL → NestJS REST API → Flutter`.

The repo already has a NestJS starter (bun-based) with one module scaffolded: `src/app/meetings/` has a fully fleshed-out `Meeting` domain entity (plain class, camelCase fields, JSDoc mirroring OpenF1's `/meetings` response, `constructor(data: Partial<Meeting>)`), but `meetings.controller.ts`, `meetings.module.ts`, `meetings.service.ts`, `meetings.repository.ts` are all empty stubs, and `AppModule` doesn't import anything yet. There's no ORM, no Postgres, no Flutter project, and no git repo yet.

**Decisions locked in with the user:**
- Visualization: 2D top-down track shape (drawn from the lap's own recorded position samples) with a moving dot for the car, plus an overlay showing speed/gear/RPM/throttle/brake/DRS. Not a 3D cockpit.
- Data target: **2024 British GP, Silverstone, Race session (`session_key=9558`), Lewis Hamilton (`driver_number=44`), Lap 42** — 89.617s, no pit activity, complete sector/segment data. Verified against the live OpenF1 API.
- Persistence: **TypeORM** (`@nestjs/typeorm` + `pg`), decorating the existing plain entity classes directly (`@Entity`/`@Column` added to `Meeting` and new sibling entities) rather than introducing a parallel Prisma schema. `SnakeNamingStrategy` maps camelCase TS fields (e.g. `meetingKey`) to snake_case columns (`meeting_key`), keeping the DB conventional while TS stays idiomatic.
- Postgres: **local via Docker Compose**. This only matters to whoever runs the NestJS backend — anyone who clones the repo runs `docker compose up -d` to get their own isolated Postgres container; nothing shared. Flutter (web, iOS sim, or Android) never talks to Postgres — it only calls the NestJS HTTP API, so Docker is irrelevant to the Flutter side. The one thing Flutter web needs from the backend is CORS enabled (`app.enableCors()` in `main.ts`), since the Flutter web dev server and the NestJS API run on different ports/origins.

## Data Model (Postgres tables, one per OpenF1 resource we ingest)

Mirrors OpenF1 fields closely (denormalized merge happens at read-time, not ingest-time, so raw data stays faithful to source):

1. **meetings** — fill in existing `Meeting` entity as `@Entity`, PK `meetingKey`.
2. **sessions** — `sessionKey` (PK), `meetingKey`, `sessionName`, `sessionType`, `dateStart`, `dateEnd`, `circuitKey`, `circuitShortName`, `countryName`, `year`, etc.
3. **drivers** — composite PK (`sessionKey`, `driverNumber`); `fullName`, `nameAcronym`, `teamName`, `teamColour`, `headshotUrl`, `countryCode`.
4. **laps** — composite PK (`sessionKey`, `driverNumber`, `lapNumber`); `dateStart`, `lapDuration`, `durationSector1/2/3`, `isPitOutLap`, `stSpeed`, `i1Speed`, `i2Speed`.
5. **car_data** — telemetry samples: `sessionKey`, `driverNumber`, `date` (timestamp), `rpm`, `speed`, `nGear`, `throttle`, `brake`, `drs`.
6. **location** — position samples: `sessionKey`, `driverNumber`, `date` (timestamp), `x`, `y`, `z`.

`car_data` and `location` are OpenF1's native ~3.7Hz feeds and don't share timestamps exactly, so they're stored separately as ingested; merging (nearest-timestamp join) happens in the API layer when building a replay payload, not at ingestion.

## Backend: modules & files

Follow the existing `src/app/meetings/` pattern (`entities/`, `dtos/`, `<name>.controller.ts`, `.module.ts`, `.service.ts`, `.repository.ts`) for each new domain:

- `src/app/meetings/` — follow the pattern of `meeting.controller.ts`, `meeting.module.ts`, `meeting.service.ts`, `meeting.repository.ts`; repository wraps injected `Repository<Meeting>`.
- `src/app/sessions/` — same shape, new `Session` entity.
- `src/app/drivers/` — new `Driver` entity.
- `src/app/laps/` — new `Lap` entity.
- `src/app/telemetry/` — `CarDataSample` and `LocationSample` entities + repositories (no controller needed directly; consumed by replay module).
- `src/app/replay/` — the module Flutter actually calls. `ReplayService.getReplay(sessionKey, driverNumber, lapNumber)`:
  - loads the `Lap` row for timing bounds,
  - loads `car_data` + `location` rows in that window,
  - merges them by nearest timestamp into one time-ordered array of samples: `{ elapsedMs, progress (0-1), x, y, speed, gear, rpm, throttle, brake, drs }`,
  - `ReplayController`: `GET /replay/:sessionKey/:driverNumber/:lapNumber`.
- `src/app/ingestion/` — not exposed over HTTP:
  - `OpenF1Client` — thin service wrapping OpenF1 REST calls using native `fetch` (Bun/Node both have it built in; no need for `axios`).
  - `IngestionService.ingestLap(sessionKey, driverNumber, lapNumber)` — fetches meeting → session → driver → all laps for that driver (so switching laps later needs no re-ingest) → `car_data`/`location` scoped to that lap's time window (± a couple seconds buffer), and upserts everything.
  - A `nest-commander` CLI command (`bun run ingest -- --session 9558 --driver 44 --lap 42`) that boots a Nest application context and calls `IngestionService.ingestLap`. This matches "NestJS ingestion" as a distinct architectural step, run manually/offline rather than exposed as a live endpoint.
- `src/config/` — `@nestjs/config` module validating `DATABASE_URL`, `PORT`, `OPENF1_BASE_URL`.
- `src/database/` — TypeORM `DataSource` config (with `SnakeNamingStrategy`) + `migrations/` (one initial migration creating all six tables; `synchronize: false`, real migrations from the start).
- `src/main.ts` — add `app.enableCors()`, global `ValidationPipe`.
- `src/app.module.ts` — wire up `ConfigModule`, `TypeOrmModule.forRootAsync`, and all the feature modules above.

New deps: `typeorm`, `@nestjs/typeorm`, `pg`, `typeorm-naming-strategies`, `@nestjs/config`, `nest-commander`, `class-validator`, `class-transformer`.

## Infra

- `docker-compose.yml` at repo root: single `postgres:16` service, named volume, exposed on `5432`.
- `.env.example` documenting `DATABASE_URL`, `PORT=3000`, `OPENF1_BASE_URL=https://api.openf1.org/v1`.

## Flutter app (`flutter_app/`)

** Project folder structure yet to be decided.

New Flutter project, single-flow V1 (no real selection UI needed since there's only one lap):

- `lib/services/api_client.dart` — calls `GET /replay/9558/44/42` (base URL configurable via `--dart-define=API_BASE_URL=...` since it differs for web vs Android emulator vs iOS sim).
- `lib/models/replay_data.dart` — parses the merged sample array + lap metadata.
- `lib/screens/start_screen.dart` — static "British GP 2024 · Lewis Hamilton · Lap 42 · 1:29.617" card with a Start button (fulfils the "Select Race/Driver/Lap" step of the core flow without building a selector for options that don't exist yet).
- `lib/widgets/track_painter.dart` — `CustomPainter` that draws the track as a polyline from the lap's own `(x, y)` samples (no separate circuit-geometry source needed — the driver's own position trace **is** the track shape), normalized/scaled/y-flipped to the canvas.
- `lib/screens/replay_screen.dart` — fetches replay data once, drives playback with a `Ticker`/`AnimationController` mapped to `elapsedMs`, interpolates car position between the two nearest samples each frame, renders the track + moving dot + a HUD overlay (speed, gear, RPM, throttle, brake, DRS) and a lap-progress bar, with Play/Pause and Replay controls. No external state-management package — a single `StatefulWidget` is enough for one screen.

## Verification

1. `docker compose up -d` — Postgres up.
2. Run the initial TypeORM migration — tables created.
3. `bun run ingest -- --session 9558 --driver 44 --lap 42` — confirm rows land in `laps`, `car_data`, `location` (spot-check row counts).
4. `bun run start:dev` — hit `GET /replay/9558/44/42` (curl) — confirm a time-ordered, merged sample array comes back.
5. `flutter run -d chrome` (or iOS simulator via the simulator tool) — confirm: track shape renders, dot moves smoothly along it in sync with the HUD values, Play/Pause/Replay controls work, lap completes and stops/loops correctly.
