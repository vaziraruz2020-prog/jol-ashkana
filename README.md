# JOL-Ashkana

Home baking for tomorrow. Not a chat dump, not a 30% delivery marketplace.

Guests pick a country, city and district, see tomorrow’s menu with a price and a slot, pay **cash on handover**. Bakers run a kitchen after support verifies it. One account can buy and bake — but **you cannot order from your own kitchen**.

After handover, the guest can leave **1–5 stars** and an optional comment. That score shows on catalog cards, the kitchen page, and the baker’s kitchen tab.

## Two environments

| | Your PC (`npm run dev`) | Vercel (the live link) |
|---|---|---|
| App | http://localhost:5173 | `https://YOUR-APP.vercel.app` |
| Database | PGlite files under `data/` | **Neon Postgres** via `DATABASE_URL` |
| Accounts | Only on this computer | Only in Neon — **register again on the live site** |

Local files are **not** uploaded to Neon. Deleting the Vercel project wipes env vars; you must add Neon + `JWT_SECRET` again.

## Live demo

Deploy this repo to Vercel (set `DATABASE_URL` + `JWT_SECRET`). Local demo: `npm install` then `npm run dev`.

Support login is seeded **per database** from `ADMIN_EMAIL` / `ADMIN_PASSWORD`:

- email: `support@jol-ashkana.local`
- password: `Support2025!`

These match `.env.example`. If you set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`, the seeded account uses your values instead.

There are **no fake baker accounts**. Catalog starts empty until a real user opens a kitchen and support verifies it.

## Stack

- React + Vite + Tailwind (mobile-first PWA-style UI)
- Node API (`/api/*`)
- **Real SQL database** locally: embedded Postgres (PGlite) — no Docker
- PostgreSQL (Docker or Neon) when `DATABASE_URL` is set
- HttpOnly JWT cookie, bcrypt passwords
- Russian + English
- Live order status via short polling (guest, baker, support)
- Reviews after handover (one review per order)

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

Restart `npm run dev` after pulling new migrations (including `reviews`) so the API can create new tables.

## Optional: Docker / Neon Postgres

```bash
# .env
DATABASE_URL=postgres://jol:jol@127.0.0.1:5432/jol_ashkana
docker compose up -d
npm run dev
```

Health then returns `{ "ok": true, "db": "postgres" }`. If that URL is down, the API uses embedded Postgres instead.

Import an old `data/store.json` (geo / JSON snapshot — not the PGlite accounts on your PC):

```bash
npm run db:import
```

## What a guest does

1. Create an account (email + password, no SMS).
2. Pick country → city → district.
3. Open a **verified** kitchen that is **not yours**, add dishes, checkout.
4. Pay cash at pickup or to the courier.
5. Track: accepted → baking → ready → handed over (updates live).
6. After handover: rate 1–5 stars (comment optional). One review per order.
7. Report a problem to support if needed.

You cannot add dishes from your own kitchen. It does not show in your district list while you are logged in as the owner. Checkout is rejected if you still try.

## What a baker does

Same account, switch to baker mode.

1. Submit kitchen: name, owner full name, full address, district, cutoff hour, pickup/courier, confirm “I cook here”.
2. Status is **pending** until support verifies. Guests do not see it yet.
3. After verify: menu for tomorrow, leftover counts, order statuses.
4. Guest reviews appear on the kitchen tab. You cannot review your own kitchen.

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

1. Create a Neon Postgres database (Vercel **Storage → Create Database → Neon**).
2. Set env for **Production** (and Preview): `DATABASE_URL` (or `POSTGRES_URL`), `JWT_SECRET` (long random string), optional `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Deploy / **Redeploy** after saving env.
4. Open `https://YOUR-APP.vercel.app/api/health`  
   Success: `{ "ok": true, "db": "postgres" }`.
5. Open the site → **Create an account**. Do not expect your PC login to work here.

Login is the **Log in** form (`#/login`), not `/api/login` in the address bar.

## Product notes

See `APP.md` for how to walk the live flows. See `SCREENS.md` for the paper screens that match this build.
