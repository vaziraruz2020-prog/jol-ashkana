# JOL-Ashkana

Home baking for **tomorrow**. Not a chat dump, not a 30% delivery marketplace.

Guests pick a country, city and district, see tomorrow’s menu with a price and a slot, pay **cash on handover**. Bakers run a kitchen after support verifies it. One account can buy and bake — but **you cannot order from your own kitchen**.

After handover, the guest can leave **1–5 stars** and an optional comment. That score shows on catalog cards, the kitchen page, and the baker’s kitchen tab.

The live site is a **hash-routed** React app (`#/…`). Catalog browsing needs no login. Checkout, orders, baker cabinet, reviews, and reports need an account.

## Two environments

| | Your PC (`npm run dev`) | Vercel (the live link) |
|---|---|---|
| App | http://localhost:5173 | `https://YOUR-APP.vercel.app` |
| Database | PGlite files under `data/pglite/` | **Neon Postgres** via `DATABASE_URL` |
| Accounts | Only on this computer | Only in Neon — **register again on the live site** |

Local files are **not** uploaded to Neon. Deleting the Vercel project wipes env vars; you must add Neon + `JWT_SECRET` again.

## Live demo

Deploy this repo to Vercel (set `DATABASE_URL` + `JWT_SECRET`). Local demo: `npm install` then `npm run dev`.

Support login is seeded **per database** from `ADMIN_EMAIL` / `ADMIN_PASSWORD`:

- email: `support@jol-ashkana.local`
- password: `Support2025!`

These match `.env.example`. If you set `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`, the seeded account uses your values instead.

There are **no fake baker accounts** and **no seeded kitchens**. Catalog starts empty until a real user opens a kitchen and support verifies it.

## Stack

- React + Vite + Tailwind (mobile-first PWA-style UI, hash routes)
- Node API (`/api/*`) on port **8787** locally; Vite proxies `/api` to it
- **Real SQL database** locally: embedded Postgres (PGlite) under `data/pglite/` — no Docker
- PostgreSQL (Docker or Neon) when `DATABASE_URL` is set
- HttpOnly JWT cookie (`ja_token`, 7 days), bcrypt passwords
- Russian + English (`ru` default)
- Live order status via short polling (not push, not SMS)
- Reviews after handover (one review per order)
- Kitchen / dish photos: JPG, PNG, or WebP, compressed in the browser

## Run locally

No Docker. The API creates a real Postgres database on disk and runs migrations.

```bash
npm install
npm run dev
```

Open **http://localhost:5173** — that is the website.

API: http://127.0.0.1:8787 (proxied as `/api`)  
Health: http://127.0.0.1:8787/api/health → `{ "ok": true, "db": "pglite" }`

Opening port 8787 in a browser is the API, not the app. The API root looks like `{ "ok": true, "app": "JOL-Ashkana API", "db": "pglite", "open": "http://localhost:5173" }`.

Restart `npm run dev` after pulling new migrations (including `reviews`) so the API can create new tables.

Optional env (see `.env.example`):

- `JWT_SECRET` — required on Vercel; local fallback is a dev secret
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — seeded support account
- `DATABASE_URL` or `POSTGRES_URL` — use real Postgres instead of PGlite
- `PGLITE_DIR` — override the PGlite folder (default `data/pglite`)
- `API_PORT` — API port (default `8787`)

If the API is down, the app shows a **health banner** (retry). Login and register stay disabled until `/api/health` is ok.

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

1. Open the link. Landing first tap: **Выбери район и закажи на завтра** (`#/catalog`). No login yet.
2. Create an account when needed (email + password, **min 8 characters**, no SMS).
3. Pick country → city → district (chips). Only **verified** and **not hidden** kitchens in that district. Your own kitchen is hidden from this list while you are logged in as the owner.
4. Open a kitchen. Cards show name, optional photo, **district · Приём до HH:00**, and `★ 4.8 · 3` when there are reviews — **not** the street address.
5. Add dishes. Leftover **0** or **off for tomorrow** → cannot add (**На завтра нет**). Leftover **≤ 3** shows **Мало**. One kitchen per cart; another kitchen → replace/keep modal.
6. Cart → checkout. If logged out → login/register, then back. Phone on checkout is handover contact (**≥ 9 digits**), not the login.
7. Pickup or courier (only if that kitchen offers it). Courier needs an address. Slots: **10:00–12:00**, **12:00–14:00**, **16:00–18:00**. After cutoff, the order date is **day after tomorrow**.
8. Pay **cash at pickup or to the courier**. No cards, no prepay, no in-app money.
9. Track while logged in: Принят → Печётся → Готово → Выдано (polls every few seconds). **Guests cannot cancel.** Baker or support can.
10. After **Выдано**: rate **1–5 stars** (comment optional: empty, or 4–400 characters). One review per order. You cannot review your own kitchen.
11. Report a problem if needed (topics: late / quality / fake kitchen / rude / other; text min 4 characters).

Fails on purpose: short phone, courier without address, leftover 0, unverified/hidden kitchen, **ordering from your own kitchen**, empty name, blocked account.

## What a baker does

Same account. On **Кабинет** (`#/account`) switch role to baker. The bottom **Пекарь** tab appears only in baker mode.

1. Submit kitchen (`#/cabinet/kitchen`): name, owner full name, bio, **full address**, country/city/district, cutoff hour **10–22** (default 18), pickup and/or courier, emoji, optional photo, confirm **«I cook here»**.
2. Status is **pending** until support verifies. Guests do not see it yet. Rejected kitchens show the note; you can edit and resubmit.
3. After verify: **Меню** for tomorrow — add dishes (name, price, leftover, ingredients, emoji/photo, available-tomorrow toggle). Leftover **+ / −**. Checkout decrements leftover.
4. **Заказы**: next status button (Принят → Печётся → Готово → Выдано) and **cancel**. Stats: open orders, ready, leftover sum.
5. Guest reviews appear on the **Кухня** tab. You cannot review your own kitchen.

When you switch back to buyer mode, your kitchen does not appear as a shop in the district. Open it from the baker cabinet if you need to check the public page — add-to-cart stays off. Banner: *Это ваша кухня — Один аккаунт может покупать и печь, но заказать у себя нельзя.*

One kitchen per account.

## What support does

Support is a normal user with `isSupport`, seeded on API startup. Same login form — **no demo button**.

- Verify, reject (with a note), hide, or show a kitchen
- Find orders by phone or id, cancel if needed
- Handle reports: New → In progress → Closed
- Block a user (reason required). Cannot block yourself. Cannot block an **unblocked** support user.

Hidden or unverified kitchens do not appear for guests. Blocked users are sent to **Кабинет** and cannot order, bake, or use support tools.

## Chrome (what you actually see)

**Header (every screen):** `[JA] JOL-Ashkana` · EN/RU · **Войти** or the user’s name.

**Landing, logged out:** primary CTA **Выбери район и закажи на завтра**. Secondary is **Войти** + **Создать аккаунт** — not «Я пекарь». Baker path is **Открыть кухню** in the Пекари block.

**Landing below the fold:** city marquee → anchors **Примеры · Как · Зачем · Пекари** → gallery (Самса, Нон, Пахлава, Блины, Хлеб, Пирог — examples, not a live kitchen) → How (1 район, 2 меню, 3 статус) → Why (сейчас vs в JOL) → Bakers → pastry ticker.

Proof line: **Страны СНГ · без оплаты картой и без SMS**.

**Bottom nav** — hidden on Login / Register. Shown on Landing.

| Tab | Route | When |
|---|---|---|
| Главная | `#/` | always (except auth) |
| Район | `#/catalog` | always |
| Корзина | `#/cart` | always |
| Заказы | `#/orders` | always |
| Пекарь | `#/cabinet` | only if `activeRole === 'baker'` |
| Поддержка | `#/admin` | only if `isSupport` |
| Кабинет | `#/account` | always (RU label is **Кабинет**, not «Аккаунт») |

## Geo

Ten CIS countries, each with its own currency (UZS, KZT, KGS, TJS, TMT, AMD, AZN, BYN, MDL, RUB).

In the app right now: **13 cities, 28 districts**. Uzbekistan is **Tashkent + Samarkand** (no Bukhara). Kazakhstan uses **Astana**, not Nur-Sultan. Kyrgyzstan is **Кыргызстан**.

## Out of scope (this version)

- Card / online payments, prepay, in-app wallet
- Commission or baker subscription (this build is **0%**)
- SMS, email verify, push notifications
- Real courier fleet / Yandex
- Guest self-cancel
- Native iOS/Android apps
- Demo baker accounts or seeded kitchens

## Deploy (Vercel)

1. Create a Neon Postgres database (Vercel **Storage → Create Database → Neon**).
2. Set env for **Production** (and Preview): `DATABASE_URL` (or `POSTGRES_URL`), `JWT_SECRET` (long random string), optional `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Deploy / **Redeploy** after saving env.
4. Open `https://YOUR-APP.vercel.app/api/health`  
   Success: `{ "ok": true, "db": "postgres" }`.
5. Open the site → **Create an account**. Do not expect your PC login to work here.

Login is the **Log in** form (`#/login`), not `/api/login` in the address bar.

## Product notes

See `APP.md` for how to walk the live flows. See `SCREENS.md` for the paper screens that match this build. See `ANALYSIS.md` for the market write-up (product claims there match this app, not a future payments version).
