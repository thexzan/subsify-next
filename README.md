<div align="center">
  <img src="https://github.com/user-attachments/assets/8641bb0f-8e8b-4264-89da-7789a210d565" width="120" alt="Subsify app icon" />

  <h1>Subsify</h1>
  <p>Track software subscriptions, costs, and renewal deadlines — no forgotten renewals, no billing surprises.</p>

  <p>
    <a href="https://github.com/thexzan/subsify-next/actions/workflows/ci.yml">
      <img src="https://github.com/thexzan/subsify-next/actions/workflows/ci.yml/badge.svg" alt="CI" />
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
    </a>
  </p>

  <a href="https://apps.apple.com/us/app/subsify-subscription-tracker/id6785076420">
    <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" height="48" />
  </a>
</div>

Subsify is an internal dashboard for tracking company software subscriptions, their costs, and renewal deadlines. It gives IT and operations staff a single place to see what's active, what's about to renew, and what's already lapsed — so a forgotten renewal never bills by surprise.

The backend is built API-first, so the same REST endpoints that power the web app serve both the dashboard and the native iOS client.

## Features

- **Dashboard** — summary counts (total, active, expiring soon, expired), total monthly spend, and a renewal radar plotting everything due within the configured window
- **Subscription management** — add, edit, delete, and quick-change status; each tool tracks name, department, renewal date, monthly cost, status, and notes
- **Search & filter** — search by tool or department; filter by status (segmented tabs) and department (server-side)
- **Renewal alerts** — rows renewing within the urgent window (default 7 days) are flagged red, within the expiring window (default 30 days) amber; both windows are user-configurable. Active rows approaching renewal show explicit "Expiring soon" / "Urgent" badges.
- **Settings** — per-user configurable alert thresholds for expiring-soon and urgent windows
- **CSV export** — export the currently filtered list
- **Authentication** — self-service signup, credential-based login, profile editing, and password change; protected pages
- **Mobile-optimized** — responsive layout with card list on mobile, bottom sheet forms, bottom navigation, and floating action button
- **REST API** — clean JSON endpoints, usable with either a session cookie or a Bearer token

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- MySQL + Prisma 7
- NextAuth (Credentials provider)
- Tailwind CSS + shadcn/ui
- TanStack Query
- Vitest, GitHub Actions CI

## iOS app
<a href="https://apps.apple.com/us/app/subsify-subscription-tracker/id6785076420">
  <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" height="40" />
</a>

A native iPhone app — offline-first, Face ID protected, zero third-party dependencies — synchronized with this API.

> Submitted for App Store review in June 28, 2026 — the link may not resolve until approved.

- Swift 6.3 + SwiftUI · iOS 18.0+ · iPhone-only · zero third-party packages
- SwiftData (`@Model`) local-first persistence; `ModelActor` sync engine, two-phase push → pull
- Plain `URLSession` async/await; JWT in Keychain
- Local renewal notifications, Face ID / Touch ID app lock
- Swift Testing, 67 unit tests

The iOS client consumes the same JSON endpoints documented in the [REST API](#rest-api) section. The OpenAPI spec at `/api/openapi` can be used to generate a typed Swift client — see [Interactive docs & OpenAPI spec](#interactive-docs--openapi-spec).

## Status model

Subscriptions have a stored lifecycle status — `active`, `expired`, or `cancelled` — but the displayed status is computed from the renewal date at query time.

- A past-due renewal date escalates the row to **expired**. The automatic rule only raises urgency, never lowers it, and `cancelled` is always preserved.
- **Expiring soon** is not a stored status. It's a derived flag: a row is "expiring soon" when it's `active` and its renewal falls within the user's configured threshold (default 30 days). Filtering by `active` includes these rows; filtering by `expiring_soon` returns only that subset.
- The dashboard **Active** count includes all active rows (including expiring-soon). The **Expiring soon** count is a subset — no double-counting.
- Monthly spend totals all active rows (expired and cancelled are excluded).

## Getting started

### Prerequisites

- Node.js 20+
- A MySQL database

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env: set DATABASE_URL, NEXTAUTH_SECRET (openssl rand -base64 32), NEXTAUTH_URL

# 3. Create the schema and seed sample data
npx prisma migrate dev
npx prisma db seed

# 4. Start the dev server
npm run dev
```

The app runs at `http://localhost:3000`.

### Seed credentials

```
Email:    admin@subsify.com
Password: subsify2025
```

The seed also inserts 10 sample subscriptions with renewal dates relative to today, so every status and alert state is represented.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run test       # vitest
```

## REST API

All endpoints return JSON. Requests authenticate with either the session cookie (web) or an `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/token` | Exchange credentials for a Bearer token |
| `POST` | `/api/auth/change-password` | Change password |
| `PATCH` | `/api/auth/profile` | Update name and email |
| `GET` | `/api/auth/preferences` | Get alert thresholds (expiring-soon and urgent windows) |
| `PATCH` | `/api/auth/preferences` | Update alert thresholds |
| `GET` | `/api/subscriptions` | List subscriptions (`?status=`, `?search=`, `?department=`) |
| `POST` | `/api/subscriptions` | Create a subscription |
| `GET` | `/api/subscriptions/:id` | Get one subscription |
| `PUT` | `/api/subscriptions/:id` | Update a subscription |
| `DELETE` | `/api/subscriptions/:id` | Delete a subscription |
| `GET` | `/api/stats` | Dashboard counts and total monthly cost |

### Using the API with a Bearer token

```bash
# Get a token
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@subsify.com","password":"subsify2025"}'

# Use it
curl http://localhost:3000/api/subscriptions \
  -H "Authorization: Bearer <token>"
```

### Interactive docs & OpenAPI spec

- **Interactive docs:** `/api/docs` — a browsable API reference (Scalar) rendered from the live spec.
- **OpenAPI spec:** `/api/openapi` — the OpenAPI 3.1 document as JSON. It's derived from the same zod schemas the API validates with, so the contract stays in sync with the code.

The spec is machine-readable, so the native iOS client — or any consumer — can generate a typed Swift client from it:

```bash
# Save the spec, then generate a client with Apple's swift-openapi-generator
curl http://localhost:3000/api/openapi -o openapi.json
```

## Running with Docker

```bash
docker compose up --build
```

This starts MySQL and the app together. On first boot the app runs migrations and seeds sample data (`RUN_SEED=true` in `docker-compose.yml`); set `RUN_SEED` to `false` afterwards so restarts don't reset your data.

## Deployment (Coolify)

The app ships as a standalone Docker image and deploys cleanly on Coolify:

1. Create a new resource in Coolify and connect this GitHub repository.
2. Coolify auto-detects the `Dockerfile`. Set the exposed port to **3000**.
3. Add a MySQL database (Coolify service or external) and set environment variables:
   - `DATABASE_URL` — your MySQL connection string
   - `NEXTAUTH_SECRET` — a strong random value (`openssl rand -base64 32`)
   - `NEXTAUTH_URL` — your public app URL
   - `RUN_SEED` — `true` only for the very first deploy, then remove or set to `false`
4. Deploy. The container runs `prisma migrate deploy` on startup, so the schema is created automatically.

## License

Licensed under the [MIT License](LICENSE).
