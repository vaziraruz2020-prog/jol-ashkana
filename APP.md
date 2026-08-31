# JOL-Ashkana — how to try it

Data lives on the API (`data/store.json` locally, Postgres on Vercel). Guest, baker and support share the same orders and kitchens. One account can buy and bake.

## Run the app

```bash
npm run dev
```

Open **http://localhost:5173** — that is the website.

`http://127.0.0.1:8787` is the API only. Opening it in a browser is not the app (`{"error":"not_found"}` is normal there).

There are no demo baker accounts. Catalog is empty until someone submits a kitchen and support verifies it.

---

## 1. Buyer

1. Register (email + password).
2. Country → city → district.
3. Open a verified kitchen, add dishes, checkout.
4. Cash on pickup or to the courier.
5. Track the order: accepted → baking → ready → handed over.
6. Report a problem if needed.

Fails on purpose: short phone, courier without address, leftover 0, unverified kitchen.

---

## 2. Baker

Same account → baker mode.

1. Submit kitchen (name, full name, address, district, cutoff, confirm you cook there).
2. Wait for support to verify. Until then the kitchen is not in the district list.
3. Menu for tomorrow, leftover, order statuses.

---

## 3. Support — real login

Support is a normal user with `isSupport`. The API creates it on startup (`seedAdmin` in `server/db.js`). You log in through the same form as everyone else — there is no fake demo button.

### Default local account

- Email: `support@jol-ashkana.local`
- Password: `Support2025!`

These match `.env.example` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). If you set those in `.env`, the seeded account uses your values instead.

### Steps

1. Run `npm run dev`.
2. Open http://localhost:5173 (not port 8787).
3. Click **Log in**, or go to http://localhost:5173/#/login
4. Enter the support email and password.
5. Submit.

If the password is right, the app opens **#/admin** (kitchens, orders, tickets, users). The last tab becomes Support.

### What you can do there

1. Verify / reject / hide kitchens.
2. Find orders by phone or id, cancel if needed.
3. Handle reports, block a user.

Hidden or unverified kitchens do not appear for guests.

### If login fails

- Use port **5173**, not 8787.
- Restart `npm run dev` so the API can seed the support user.
- Type the same email/password as `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.
- A newly registered account is **not** support. Only the seeded admin is.
