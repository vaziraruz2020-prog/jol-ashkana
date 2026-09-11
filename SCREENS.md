# Day 4 — Screens on paper

**JOL-Ashkana** — preorder homemade baking for **tomorrow** in your district. Price, menu, slot, status, and reviews live in the app, not in Telegram.

This pack matches the live app (`Landing`, `Catalog`, `Baker`, `Cart`, `Checkout`, `OrderDetail`, `Cabinet`, plus `Auth` / `Account` / `Admin`). Draw the 7 main screens on paper. Auth, account, and support are short callouts — not extra full pages.

Two roles. **Guest is first.** Baker is the second path. Support is a seeded login, not a demo button.

Copy below is the **Russian UI** (default locale). EN exists in the same places.

---

## Who arrives first, and what they do first

**Person:** a guest, 24–38, city (Tashkent / Almaty / Bishkek). They already buy homemade food from chats. They open the link on a phone. Catalog browsing needs no login.

**First tap (this is the whole Day 4 answer):**

**«Выбери район и закажи на завтра»** on the landing screen.

Not «Я пекарь» (that string is unused). Not the bottom nav. Not city chips. District first, because the product is *kitchens near me*, not a city-wide catalog.

Write this in the corner of the landing sheet:

> **Первое действие: гость жмёт «Выбери район и закажи на завтра».**

---

## Main scenario (guest, 8 steps)

Happy path you can walk on paper in ~60 seconds:

1. Open the link → **Landing**.
2. Tap **Выбери район и закажи на завтра**.
3. **Catalog:** country → city → district (e.g. Узбекистан → Ташкент → Юнусабад). See **verified** kitchen cards only (not your own, not hidden). Catalog starts empty until a real baker is verified. Cards show **district · Приём до HH:00** and `★ 4.8 · 3` when there are reviews — **not** the street address.
4. Tap a kitchen → **Menu** (`Baker`). See price, leftover, cutoff, address, rating, reviews.
5. Tap **В корзину** on 1–2 dishes.
6. **Cart** → **К оформлению**. If not logged in → **Войти / Создать аккаунт**, then back to checkout.
7. **Checkout** title **Оформить заказ:** pickup or courier, slot (`10:00–12:00` / `12:00–14:00` / `16:00–18:00`), name, phone (≥9 digits), address if courier → **Заказать на завтра**. Cash on handover.
8. **Order status** (`OrderDetail`): Принят → later the baker moves Печётся → Готово → Выдано. After **Выдано**, the guest rates 1–5 stars. Guest reopens **Заказы** while logged in (poll 7s on the list, 5s on the detail). **No guest cancel. No reorder.**

### Hard rules on this path

- One kitchen per cart. Another kitchen → replace/keep modal.
- After cutoff, the order date is **day after tomorrow**.
- Leftover 0 or not available tomorrow → cannot add (**На завтра нет**). Leftover ≤ 3 → **Мало**.
- Guest identity = **email account** (HttpOnly JWT, password ≥ 8). Phone is only a handover contact on checkout.
- Unverified or hidden kitchens do not appear in the district list.
- **You cannot order from your own kitchen.** It is hidden from your district list; add-to-cart is off; checkout is rejected.
- Review only after **handed over**. Stars required. Comment optional (empty, or 4–400 chars). One review per order. You cannot review your own kitchen.
- There are **no demo baker accounts** and no seeded kitchens.
- Report is a form (late / quality / fake_kitchen / rude / other), not a phone call.

### Baker is not the first scenario

Paper it as a short second strip: Landing → scroll to **Пекари** → **Открыть кухню** → log in / register → submit kitchen → wait for support verify → menu for tomorrow → change order status (or cancel) → see guest reviews on the **Кухня** tab.

---

## Paper arrows (main path only)

```
[1 Landing] --CTA район--> [2 Catalog] --кухня--> [3 Menu]
    --в корзину--> [4 Cart] --оформить--> [5 Checkout]
    --заказ--> [6 Status] --after handover--> rate 1–5
[4/5] --if logged out--> [Login / Register] --back--> [5]
[1] --Открыть кухню (блок Пекари)--> [7 Cabinet]
[1] --Войти / Создать аккаунт--> [Login / Register]
[Login as support] --> [Admin]   (thinnest strip)
```

Do **not** draw «Я пекарь» on the hero. That button is not on the live landing.

---

## Shared chrome

Phone: ~375×812, cream background.

**Sticky header** (every screen)

```
[ JA ]  JOL-Ashkana          [ EN/RU ]  [ Войти ] or [name]
```

If `/api/health` fails: a compact **health banner** under the header (retry). Login/register disabled until health is ok.

**Bottom nav** — hidden only on Login / Register. Shown on Landing.

```
⌂ Главная   ◎ Район   ◉ Корзина   ☰ Заказы   ● Кабинет
```

Extra tabs, only when the account has that role:

- Baker mode (`activeRole === 'baker'`) → **♨ Пекарь** (`#/cabinet`)
- Support (`isSupport`) → **✦ Поддержка** (`#/admin`)

RU last tab is **Кабинет**, not «Аккаунт».

Active tab:

| Screen | Nav |
|---|---|
| Landing | Главная |
| Catalog, Menu | Район |
| Cart, Checkout | Корзина |
| Orders, Order status | Заказы |
| Cabinet | Пекарь |
| Admin | Поддержка |
| Account | Кабинет |
| Login, Register | nav hidden |

Blocked users are forced to Account. They cannot use catalog checkout, baker, or admin.

---

## The 7 screens

Skip as full pages: toast, replace-cart modal, leftover-out, kitchen editor, add-dish form, login/register, account, admin, review form as its own page. Mark those as callouts.

---

### 1. Landing — first screen (`Landing`)

Bottom nav **is shown** (Главная). Hero photo, floating pastry plates, city marquee.

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana     EN  Войти│
├─────────────────────────────────┤
│  [hero bakery photo + plates]   │
│  JOL-ASHKANA                    │
│  Домашняя выпечка завтра.       │
│  Не ищи в чатах — закажи        │
│  в приложении.                  │
│  Меню, цена и слот — без чатов. │
│  Оплата наличными при получении.│
│                                 │
│  ┌───────────────────────────┐  │
│  │ Выбери район и            │  │  ★ FIRST TAP
│  │ закажи на завтра          │  │
│  └───────────────────────────┘  │
│     [ Войти ] [ Создать аккаунт ]│  logged out
│     or [ Кабинет / Кабинет пекаря ]│
│  Страны СНГ · без оплаты картой │
│  и без SMS                      │
│                                 │
│  Примеры · Как · Зачем · Пекари │
│  [city names marquee]           │
│                                 │
│  Примеры: Самса Нон Пахлава     │
│  Блины Хлеб Пирог               │
│  (это не живая кухня)           │
│  1 Район  2 Меню  3 Статус      │
│  Сейчас vs В JOL                │
│  Пекари — тот же аккаунт        │
│  [ Открыть кухню ]              │
│  [pastry ticker]                │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Hero | Photo + plates. Label `JOL-ASHKANA`. Headline and sub from live copy. |
| Primary CTA | Big orange: **Выбери район и закажи на завтра** ← star this. Arrow to screen 2. |
| Secondary (logged out) | **Войти** + **Создать аккаунт**. Not «Я пекарь». |
| Secondary (logged in) | **Кабинет** (buyer) or **Кабинет пекаря** (baker mode). |
| Proof | **Страны СНГ · без оплаты картой и без SMS**. City marquee. **Not** “8 demo kitchens”. |
| Below fold | **Примеры first**, then Как, Зачем, Пекари. Gallery plates: Самса, Нон, Пахлава, Блины, Хлеб, Пирог. Baker CTA **Открыть кухню** → screen 7. |

**Empty/error:** none on the hero. Always this. Health banner only if API is down.

---

### 2. Catalog — district + kitchens (`Catalog`)

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  Район                          │
│  [Узбекистан] [Казахстан] …     │  country chips
│  [Ташкент] [Самарканд]          │  city chips
│  [Юнусабад] [Чиланзар] …        │  district chips
│                                 │
│  ┌─────┐  Name                  │
│  │photo│  ★ 4.8 · 3             │  only if reviews
│  └─────┘  Юнусабад · Приём до 18:00 │
│                                 │
│  (no street address on the card)│
│  (no “Завтра рядом” peek strip) │
└─────────────────────────────────┘
```

| State | Copy |
|---|---|
| No district yet | *Сначала выбери страну, город и район.* |
| District empty | *В этом районе пока нет кухонь. Стань первым пекарем.* CTA **Открыть кухню** (register or `#/cabinet/kitchen`). |
| Own kitchen | **Not listed** while you are logged in as the owner. |

Cards: photo or emoji, name, rating `★ avg · count` if any reviews, **district name · Приём до HH:00**.

---

### 3. Menu — public kitchen (`Baker`)

```
┌─────────────────────────────────┐
│  photo / emoji                  │
│  Kitchen name                   │
│  ★ 4.8 · 3   or  Отзывов пока нет.│
│  Закажи, затем оцени после выдачи.│
│  [Это ваша кухня — … нельзя.]   │  only if owner
│  bio                            │
│  address                        │
│  Приём до 18:00 · завтра        │  or послезавтра
│  [Пожаловаться]                 │  logged in, not owner
│                                 │
│  dish  price  leftover          │
│  [В корзину] or На завтра нет   │
│  Мало  if leftover ≤ 3          │
│                                 │
│  Отзывы                         │
└─────────────────────────────────┘
```

- No sticky cart bar. No dish categories on the public grid.
- Closed / rejected / hidden: banner, no add.
- Own kitchen: banner *Это ваша кухня — Один аккаунт может покупать и печь, но заказать у себя нельзя.* Add is off.
- Replace-cart modal if the cart has another kitchen.
- Toast on add.

---

### 4. Cart (`Cart`)

```
┌─────────────────────────────────┐
│  Корзина                        │
│  dish     price                 │
│           −  qty  +             │
│  Итого                          │
│  Наличными при получении        │
│  [ К оформлению ]               │
└─────────────────────────────────┘
```

- **No** kitchen name/address subtitle on this screen.
- Empty: *Корзина пуста…* + the same district CTA as landing.
- Kitchen blocked / gone: red note + **Очистить корзину** (no checkout).

---

### 5. Checkout (`Checkout`)

```
┌─────────────────────────────────┐
│  Оформить заказ                 │
│  Наличными при получении        │
│  Имя                            │
│  Телефон  (≥9 digits)           │
│  Самовывоз | Курьер             │  only methods the kitchen offers
│  Адрес  (if courier)            │
│  Слот: 10:00–12:00 / 12–14 / 16–18 │
│  Комментарий                    │
│  Итого                          │
│  [ Заказать на завтра ]         │
└─────────────────────────────────┘
```

Must be logged in. After cutoff the date is day after tomorrow (shown in copy). API also rejects own-kitchen checkout.

---

### 6. Order status (`OrderDetail`)

```
┌─────────────────────────────────┐
│  Kitchen name                   │
│  date · самовывоз/курьер · slot │
│  id                             │
│  Принят — Печётся — Готово — Выдано │
│  (cancelled = red text)         │
│  qty | total | slot             │
│  items, total, cash, address    │
│  after Выдано: ★★★★★ + comment  │
│  or «ваш отзыв»                 │
│  [ Пожаловаться ]               │
└─────────────────────────────────┘
```

- Poll **5s**. Login required (no phone lookup).
- **No cancel** for the guest. **No reorder** button.
- If the kitchen was later rejected/hidden: a closed banner, still show the order.

---

### 7. Baker cabinet (`Cabinet`)

```
┌─────────────────────────────────┐
│  Кабинет пекаря                 │
│  [ Заказы | Меню | Кухня ]      │
│  pending / rejected banners     │
│                                 │
│  Заказы: open | ready | leftover│
│  order card → next status + Отмена │
│                                 │
│  Меню: add dish, leftover +/−,  │
│  available tomorrow toggle      │
│                                 │
│  Кухня: reviews + kitchen form  │
└─────────────────────────────────┘
```

Login required. Baker **can** cancel. Reviews live on **Кухня**, not a fourth tab. One kitchen per account. Photo: JPG/PNG/WebP.

Kitchen form fields: name, owner full name, bio, address, country/city/district, cutoff 10–22 (default 18), pickup, courier, emoji, photo, confirm «I cook here».

---

## Callouts (not full pages)

**Login / Register** — email + password (≥8). No SMS. Nav hidden. After submit: support → `#/admin`, baker role → `#/cabinet`, else `#/catalog`.

**Account (`#/account`)** — title **Кабинет**. Role switch Гость / Пекарь. Geo. Logout. Blocked reason if blocked.

**Admin (`#/admin`)** — tabs **Кухни · Заказы · Жалобы · Люди**. Verify / reject / hide / show. Orders by phone or id, cancel. Tickets New / In progress / Closed. Block with reason. Cannot block self. Cannot block an unblocked support user. Poll 8s.

**Report** — topics: late, quality, fake_kitchen, rude, other. Body min 4 chars.

**Review** — on order detail after handover only. Stars required. Comment optional.

**Replace cart / leftover out / toast** — overlays, not screens.

---

## What not to draw (this build)

- Card pay, 50–100% prepay, wallet, commission
- SMS, push, Yandex courier
- Guest cancel / reorder
- «Я пекарь» on the hero
- Street address on catalog cards
- Sticky mini-cart on the menu
- Demo kitchens or a seeded baker
