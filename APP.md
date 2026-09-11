# JOL-Ashkana — how to try it

Locally the app uses **embedded Postgres** (PGlite): real SQL, migrations, leftover transactions, reviews. On Vercel it uses Neon when `DATABASE_URL` is set. Guest, baker and support share the same orders and kitchens.

One account can buy and bake. **You cannot place an order with yourself** — your kitchen is hidden from your district list, add-to-cart is off on that page, and the API rejects checkout.

Order screens poll, so a baker status change shows up for the guest without a reload:

| Screen | Interval |
|---|---|
| Guest **Заказы** list | 7s |
| Order detail | 5s |
| Baker cabinet orders | 5s |
| Support admin | 8s |

No push, no SMS, no phone lookup for orders. You must be logged in.

After the baker marks an order **handed over (Выдано)**, the guest can leave **1–5 stars** and an optional comment. That average shows on catalog cards (`★ 4.8 · 3`), the kitchen page, and the baker’s **Кухня** tab. Report-to-support is separate and still works.

There are no demo baker accounts. Catalog is empty until someone submits a kitchen and support verifies it.

## Run the app

```bash
npm install
npm run dev
```

Open **http://localhost:5173** — that is the website (hash routes, e.g. `#/catalog`).

`http://127.0.0.1:8787` is the API only. The root there should look like `{ "ok": true, "app": "JOL-Ashkana API", "db": "pglite", "open": "http://localhost:5173" }`.

`GET /api/health` → `{ "ok": true, "db": "pglite" }`.

If health fails, a banner appears at the top of the site. Login/register stay off until the API is up.

Restart `npm run dev` after new migrations so tables such as `reviews` exist.

Password: **at least 8 characters**. Locale: RU default, EN toggle in the header.

---

## 0. Landing (first 10 seconds)

Open http://localhost:5173 (`#/`).

You should see: hero bakery photo + floating plates, **JOL-ASHKANA**, headline **Домашняя выпечка завтра.**, sub **Не ищи в чатах — закажи в приложении.**, then **Меню, цена и слот — без чатов.** and **Оплата наличными при получении.**

**First tap:** orange **Выбери район и закажи на завтра** → `#/catalog`.

Logged out, under that: **Войти** and **Создать аккаунт**. There is **no** «Я пекарь» button on the hero.

Proof: **Страны СНГ · без оплаты картой и без SMS**. City marquee. Anchors **Примеры · Как · Зачем · Пекари**.

Below the fold, in this order:

1. **Примеры** — Самса, Нон, Пахлава, Блины, Хлеб, Пирог. Caption: examples, not a live kitchen.
2. **Как** — 1 Район, 2 Меню на завтра, 3 Статус.
3. **Зачем** — Сейчас vs В JOL.
4. **Пекари** — 01 Заявка, 02 Меню, 03 Заказы, then **Открыть кухню** → register if logged out, else `#/cabinet/kitchen`.
5. Pastry ticker.

Bottom nav is **shown** on landing (Главная active). Last tab is **Кабинет**.

---

## 1. Buyer

1. Landing → **Выбери район и закажи на завтра**.
2. Catalog (`#/catalog`): country → city → district chips. Empty until a district is chosen: *Сначала выбери страну, город и район.* Empty district: *В этом районе пока нет кухонь. Стань первым пекарем.* CTA **Открыть кухню**.
3. Open a **verified** kitchen that is **not yours** (`#/baker/:id`). Address is on this page. Cutoff line uses tomorrow or **послезавтра** if past cutoff.
4. Add 1–2 dishes. Leftover 0 / not available tomorrow → **На завтра нет**. Leftover ≤ 3 → **Мало**. Toast on add. Second kitchen → replace/keep modal.
5. Cart (`#/cart`) → **К оформлению**. Empty cart CTA is the district button. If the kitchen is no longer orderable: red note + **Очистить корзину**.
6. If not logged in → `#/login` or `#/register`, then back to checkout.
7. Checkout (`#/checkout`), title **Оформить заказ**: cash banner, name, phone ≥ 9 digits, pickup or courier, address if courier, slot, comment, **Заказать на завтра**.
8. Order status (`#/orders/:id`): kitchen name, date, pickup/courier · slot, id, stepper **Принят — Печётся — Готово — Выдано**, three stats (qty / total / slot), items, cash note, address. **No guest cancel. No reorder.**
9. After **Выдано**: stars required, comment optional. One review per order. Then «your review» is shown.
10. **Пожаловаться** on the kitchen page (if logged in, not owner) or on the order: topics late / quality / fake_kitchen / rude / other, body min 4 chars.
11. **Заказы** (`#/orders`) while logged in — live list. If delivered and not reviewed: rate CTA.

Fails on purpose: short phone, courier without address, leftover 0, unverified kitchen, **ordering from your own kitchen**, blocked user.

Own-kitchen banner on the public page: *Это ваша кухня — Один аккаунт может покупать и печь, но заказать у себя нельзя.*

---

## 2. Baker

Same account → **Кабинет** → switch to baker. Bottom tab **Пекарь** appears. Or from landing Пекари → **Открыть кухню**.

1. Submit kitchen (`#/cabinet/kitchen`): name, owner full name, bio, full address, geo, cutoff 10–22 (default 18), pickup/courier, emoji, optional photo (JPG/PNG/WebP), confirm you cook there.
2. Wait for support. Pending / rejected banners on the cabinet. Until verified, the kitchen is not in the district list.
3. Tabs: **Заказы** · **Меню** · **Кухня**.
4. Menu: add dish, leftover +/−, available-tomorrow toggle. Checkout reduces leftover.
5. Orders: next-status button + **cancel**. Stats: open, ready, leftover sum.
6. Guest reviews on the **Кухня** tab (not a separate page). You cannot review your own kitchen.

When you switch back to buyer mode, your kitchen does not appear as a shop in the district. Open it from the baker cabinet if you need to check the public page — add-to-cart stays off.

One kitchen per user.

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
3. Click **Войти**, or go to http://localhost:5173/#/login
4. Enter the support email and password.
5. Submit.

If the password is right, the app opens **`#/admin`**. The last extra tab is **Поддержка**. After login, support goes to admin; a baker role goes to cabinet; everyone else to catalog.

### What you can do there

Tabs: **Кухни · Заказы · Жалобы · Люди**.

1. Verify / reject (note) / hide / show kitchens.
2. Find orders by phone or id, cancel if needed.
3. Tickets: New / In progress / Closed.
4. Block a user — reason required. Cannot block yourself. Cannot block an unblocked support user.

Hidden or unverified kitchens do not appear for guests.

### If login fails

- Use port **5173**, not 8787.
- Restart `npm run dev` so the API can seed the support user.
- Type the same email/password as `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env`.
- A newly registered account is **not** support. Only the seeded admin is.

---

## 4. Account (`#/account`)

Title **Кабинет**. Name, email, role switch **Гость / Пекарь**, saved country/city/district, logout.

Blocked account: reason shown, rest of the app is closed; you are forced onto this screen.

---

## Auth redirects

| After login/register | Goes to |
|---|---|
| Support | `#/admin` |
| `activeRole === 'baker'` | `#/cabinet` |
| Everyone else | `#/catalog` |

Login/register hide the bottom nav. Password min 8. No SMS.

---

## Hash routes (live)

| Hash | Screen |
|---|---|
| `#/` | Landing |
| `#/catalog` | District + kitchens |
| `#/baker/:id` | Public kitchen menu |
| `#/cart` | Cart |
| `#/checkout` | Checkout |
| `#/orders` | Guest orders (login required) |
| `#/orders/:id` | Order status |
| `#/login` `#/register` | Auth |
| `#/account` | Cabinet / account |
| `#/cabinet` `#/cabinet/kitchen` | Baker |
| `#/admin` | Support |

---

## What this version does **not** do

No cards, no 50–100% prepay, no in-app payouts, no commission, no Yandex courier, no notifications, no guest cancel, no demo kitchens.
