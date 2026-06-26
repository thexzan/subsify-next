# Subsify

Subsify is an internal dashboard for tracking company software subscriptions, their costs, and renewal deadlines. It gives IT and operations staff a single place to see what's active, what's about to renew, and what's already lapsed — so a forgotten renewal never bills by surprise.

The backend is built API-first, so the same REST endpoints that power the web app can serve a future mobile client.

## Features

- **Dashboard** — summary counts (total, active, expiring soon, expired), total monthly spend, and a renewal radar plotting everything due in the next 30 days
- **Subscription management** — add, edit, delete, and quick-change status; each tool tracks name, department, renewal date, monthly cost, status, and notes
- **Search & filter** — search by tool or department; filter by status and department (server-side)
- **Renewal alerts** — rows renewing within 7 days are flagged red, within 30 days amber
- **CSV export** — export the currently filtered list
- **Authentication** — credential-based login with protected pages
- **REST API** — clean JSON endpoints, usable with either a session cookie or a Bearer token

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- MySQL + Prisma 7
- NextAuth (Credentials provider)
- Tailwind CSS + shadcn/ui
- TanStack Query
- Vitest, GitHub Actions CI

## Status model

A subscription's status can be set manually, but the displayed status escalates automatically based on the renewal date: a past-due date shows as **expired**, and a date within 30 days shows as **expiring soon**. The automatic rule only ever raises urgency, never lowers it, and `cancelled` is always preserved. This keeps each subscription in exactly one bucket, so the dashboard counts always add up.

Monthly spend totals only subscriptions that are effectively active or expiring soon — expired and cancelled tools are excluded.

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
| `POST` | `/api/auth/token` | Exchange credentials for a Bearer token |
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
