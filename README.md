# JOL-Ashkana

Home baking for tomorrow. Not a chat dump, not a 30% delivery marketplace.

Guests pick a country, city and district, see tomorrow’s menu with a price and a slot, pay **cash on handover**. Bakers run a kitchen after support verifies it. One account can buy and bake.

## Live demo

Deploy this repo to Vercel (set `DATABASE_URL` + `JWT_SECRET`). Local demo: `npm install` then `npm run dev`.

Support login (local seed):

- email: `support@jol-ashkana.local`
- password: `Support2025!`

There are **no fake baker accounts**. Catalog starts empty until a real user opens a kitchen and support verifies it.

## Stack

- React + Vite + Tailwind (mobile-first PWA-style UI)
- Node API (`/api/*`)
- **Real SQL database** locally: embedded Postgres (PGlite) — no Docker
- PostgreSQL (Docker or Neon) when `DATABASE_URL` is set
- HttpOnly JWT cookie, bcrypt passwords
- Russian + English
- Live order status via short polling (guest, baker, support)

## Run locally

No Docker. The API creates a real Postgres database on disk and runs migrations.

```bash
npm install
npm run dev
```

Open **http://localhost:5173** — that is the website.

API: http://127.0.0.1:8787 (proxied as `/api`)  
Health: http://127.0.0.1:8787/api/health → `{ "ok": true, "db": "pglite" }`

Opening port 8787 in a browser is the API, not the app.

## Optional: Docker / Neon Postgres

```bash
# .env
DATABASE_URL=postgres://jol:jol@127.0.0.1:5432/jol_ashkana
docker compose up -d
npm run dev
```

Health then returns `{ "ok": true, "db": "postgres" }`. If that URL is down, the API uses embedded Postgres instead.

Import an old `data/store.json`:

```bash
npm run db:import
```

## What a guest does

1. Create an account (email + password, no SMS).
2. Pick country → city → district.
3. Open a verified kitchen, add dishes, checkout.
4. Pay cash at pickup or to the courier.
5. Track: accepted → baking → ready → handed over (updates live).
6. Report a problem to support.

## What a baker does

Same account, switch to baker mode.

1. Submit kitchen: name, owner full name, full address, district, cutoff hour, pickup/courier, confirm “I cook here”.
2. Status is **pending** until support verifies. Guests do not see it yet.
3. After verify: menu for tomorrow, leftover counts, order statuses.

## What support does

- Verify or reject kitchens
- Hide a kitchen from the district
- Cancel an order
- Handle reports
- Block a user (with a reason)

## Geo

CIS countries with cities and districts, each with its own currency (UZS, KZT, KGS, TJS, TMT, AMD, AZN, BYN, MDL, RUB).

## Out of scope (this version)

- Card / online payments
- SMS
- Real courier fleet
- Native iOS/Android apps

## Deploy (Vercel)

1. Create a Neon Postgres database.
2. Set env: `DATABASE_URL`, `JWT_SECRET`, optional `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Deploy. First request runs migrations and seeds countries + the support user.

## Product notes

See `APP.md` for the original problem framing (Telegram chaos vs 25–35% delivery apps).
