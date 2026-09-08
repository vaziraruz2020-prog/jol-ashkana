# Day 4 — Screens on paper

**JOL-Ashkana** — preorder homemade baking for **tomorrow** in your district. Price, menu, slot, status, and reviews live in the app, not in Telegram.

This pack matches the live app (`Landing`, `Catalog`, `Baker`, `Cart`, `Checkout`, `OrderDetail`, `Cabinet`, plus `Auth` / `Account` / `Admin`). Draw the 7 main screens on paper. Auth, account, and support are short callouts — not extra full pages.

Two roles. **Guest is first.** Baker is the second path. Support is a seeded login, not a demo button.

---

## Who arrives first, and what they do first

**Person:** a guest, 24–38, city (Tashkent / Almaty / Bishkek). They already buy homemade food from chats. They open the link on a phone. Catalog browsing needs no login.

**First tap (this is the whole Day 4 answer):**

**«Выбери район и закажи на завтра»** on the landing screen.

Not «Я пекарь». Not the bottom nav. Not city chips. District first, because the product is *kitchens near me*, not a city-wide catalog.

Write this in the corner of the landing sheet:

> **Первое действие: гость жмёт «Выбери район и закажи на завтра».**

---

## Main scenario (guest, 8 steps)

Happy path you can walk on paper in ~60 seconds:

1. Open the link → **Landing**.
2. Tap **Выбери район и закажи на завтра**.
3. **Catalog:** country → city → district (e.g. Узбекистан → Ташкент → Юнусабад). See **verified** kitchen cards only (not your own). Catalog starts empty until a real baker is verified. Cards show average stars when there are reviews.
4. Tap a kitchen → **Menu** (`Baker`). See price, leftover, cutoff, rating, reviews.
5. Tap **В корзину** on 1–2 dishes.
6. **Cart** → **К оформлению**. If not logged in → **Log in / Create an account**, then back to checkout.
7. **Checkout:** pickup or courier, slot, name, phone (≥9 digits), address if courier → **Заказать на завтра**. Cash on handover.
8. **Order status** (`OrderDetail`): Принят → later the baker moves Печётся → Готово → Выдано. After **Выдано**, the guest rates 1–5 stars. Guest reopens **Заказы** while logged in (live poll, no phone lookup).

### Hard rules on this path

- One kitchen per cart. Another kitchen → replace/keep modal.
- After cutoff, the order date is **day after tomorrow**.
- Leftover 0 → cannot add.
- Guest identity = **email account** (HttpOnly JWT). Phone is only a handover contact on checkout.
- Unverified or hidden kitchens do not appear in the district list.
- **You cannot order from your own kitchen.** It is hidden from your district list; add-to-cart is off; checkout is rejected.
- Review only after **handed over**. One review per order. You cannot review your own kitchen.
- There are **no demo baker accounts** and no seeded kitchens.

### Baker is not the first scenario

Paper it as a short second strip: Landing → **Я пекарь** → log in / register → submit kitchen → wait for support verify → menu for tomorrow → change order status → see guest reviews on the kitchen tab.

---

## Paper arrows (main path only)

```
[1 Landing] --CTA район--> [2 Catalog] --кухня--> [3 Menu]
    --в корзину--> [4 Cart] --оформить--> [5 Checkout]
    --заказ--> [6 Status] --after handover--> rate 1–5
[4/5] --if logged out--> [Login / Register] --back--> [5]
[1] --Я пекарь--> [7 Cabinet]   (second strip, thinner arrow)
[Login as support] --> [Admin]   (third strip, thinnest)
```

---

## Shared chrome

Phone: ~375×812, cream background.

**Sticky header** (every screen)

```
[ JA ]  JOL-Ashkana          [ EN/RU ]  [ Войти ] or [name]
```

**Bottom nav** — hidden only on Login / Register. Shown on Landing.

```
⌂ Главная   ◎ Район   ◉ Корзина   ☰ Заказы   ● Аккаунт
```

Extra tabs, only when the account has that role:

- Baker mode → **♨ Пекарь** (`#/cabinet`)
- Support (`isSupport`) → **✦ Поддержка** (`#/admin`)

Active tab:

| Screen | Nav |
|---|---|
| Landing | Главная |
| Catalog, Menu | Район |
| Cart, Checkout | Корзина |
| Orders, Order status | Заказы |
| Cabinet | Пекарь |
| Admin | Поддержка |
| Account | Аккаунт |
| Login, Register | nav hidden |

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
│           Я пекарь              │
│  Страны СНГ · без карты и SMS   │
│                                 │
│  [city names marquee]           │
│  Как · Зачем · Пекари           │
│                                 │
│  1 Район  2 Меню  3 Статус      │
│  Сейчас vs В JOL                │
│  Пекари — тот же аккаунт        │
│  [pastry examples — not a kitchen]
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Hero | Photo + plates. Label `JOL-ASHKANA`. Headline and sub from live copy. |
| Primary CTA | Big orange: **Выбери район и закажи на завтра** ← star this. Arrow to screen 2. |
| Secondary | Text **Я пекарь** → screen 7 (login if needed). |
| Proof | CIS countries, no cards, no SMS. City marquee. **Not** “8 demo kitchens”. |
| Below fold | How / Why / Bakers. Pastry gallery caption: examples, not a live kitchen. |

**Empty/error:** none. Always this.

---

### 2. Catalog — district + kitchens (`Catalog`)

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  Район                          │
│                                 │
│  ( Узбекистан ) Казахстан  …    │
│  ( Ташкент ) Самарканд  …       │
│  ( Юнусабад ) Чиланзар  …       │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [🥐]  Пекарня …           │  │
│  │       ★ 4.8 (3)           │  │
│  │       адрес · до 20:00    │  │
│  └───────────────────────────┘  │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Title | Район |
| Row 1 | CIS countries |
| Row 2 | Cities of that country |
| Row 3 | Districts of that city |
| Cards | Only `verified` and not hidden, **and not the logged-in owner’s kitchen**. Photo/emoji, name, **stars if any reviews**, address, cutoff |

**Empty A:** no district → *Сначала выбери страну, город и район.*  
**Empty B:** district with no kitchens (or only your own) → *В этом районе пока нет кухонь. Стань первым пекарем.* CTA **Открыть кухню** → register or baker cabinet.  
**Tap card → screen 3.**

---

### 3. Kitchen menu (`Baker`)

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ [🥐]  Название кухни      │  │
│  │ ★ 4.8 (3)                 │  │
│  │ адрес                     │  │
│  │ bio                       │  │
│  │ Приём до 20:00 · на завтра│  │
│  │ [Пожаловаться]            │  │
│  └───────────────────────────┘  │
│                                 │
│  [amber if late] заказ уйдёт    │
│  на послезавтра                 │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [🥟] Самса        12 000  │  │
│  │      состав · остаток     │  │
│  │              [В корзину]  │  │
│  └───────────────────────────┘  │
│                                 │
│  Отзывы                         │
│  ★★★★★  Имя · дата · текст     │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Header card | Photo or emoji, name, **rating**, bio, address, *Приём до HH:00 · на завтра*, report (if logged in and not owner) |
| Own kitchen | Banner: *Это ваша кухня. Закажите у другого пекаря.* No **В корзину**. |
| Late banner | Amber if past cutoff: order goes to the day after tomorrow |
| Dishes | Photo/emoji, name, ingredients, price, leftover. CTA **В корзину** or **На завтра нет** |
| Reviews | List under the menu. Empty: *Отзывов пока нет.* |

**Callouts (do not draw as full screens)**

- **Modal:** cart is another kitchen → *В корзине блюда другой кухни. Заменить?* **Заменить** / **Оставить**.
- **Toast:** *Добавлено в корзину.*
- Leftover 0 / few: *На завтра нет* / *Мало*.

---

### 4. Cart (`Cart`)

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  Корзина                        │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Самса          12 000     │  │
│  │              [ − ] 1 [ + ]│  │
│  └───────────────────────────┘  │
│                                 │
│  Итого              24 000      │
│  Наличные при получении         │
│  ┌───────────────────────────┐  │
│  │      К оформлению         │  │
│  └───────────────────────────┘  │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Title | Корзина |
| Lines | Name, price, − qty + |
| Footer | Итого. Cash note. **К оформлению** → checkout, or login if logged out |

**Empty:** *Корзина пуста. Выбери район и добавь блюда на завтра.* + CTA back to catalog.

**Blocked (own / rejected / hidden kitchen):** red note + **Очистить корзину**. No checkout.

---

### 5. Checkout (`Checkout`)

Must be logged in. If not → Login (callout), then this screen.

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  Оформить заказ                 │
│  Наличные при самовывозе        │
│  или курьеру. Без карт.         │
│                                 │
│  Имя         [ из аккаунта   ]  │
│  Телефон     [ 90 123 45 67  ]  │
│                                 │
│  Получение                      │
│  ( Самовывоз )  Курьер          │
│  Адрес       [ если курьер   ]  │
│  Слот        (10:00–12:00) …    │
│  Комментарий [               ]  │
│                                 │
│  Итого 24 000                   │
│  ┌───────────────────────────┐  │
│  │   Заказать на завтра      │  │
│  └───────────────────────────┘  │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Title | Оформить заказ. Cash-on-handover banner |
| Fields | Name (from account), phone (handover contact, ≥9 digits) |
| Delivery | **Самовывоз** / **Курьер** — only modes the kitchen has |
| Slot | Select from geo slots |
| Submit | **Заказать на завтра** + total |

**Errors (stay on this screen)**

- Name empty → *Как к тебе обращаться?*
- Phone &lt; 9 digits → *Введи телефон — не меньше 9 цифр.*
- Courier without address → *Для курьера нужен адрес.*
- Own kitchen → empty state, clear cart.

**Success → screen 6.**

---

### 6. Order status (`OrderDetail`)

Guest return visit: **Заказы** while logged in → list (polls) → this screen. No phone-lookup form.

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  Кухня                          │
│  дата · самовывоз · слот        │
│  JA-…                           │
│                                 │
│  ● Принят — Печётся —           │
│    Готово — Выдано              │
│                                 │
│  Самса ×2              24 000   │
│  Итого                 24 000   │
│                                 │
│  [after Выдано]                 │
│  Оцените кухню                  │
│  ★★★★★  комментарий             │
│  [ Отправить отзыв ]            │
│                                 │
│  [ Пожаловаться ]               │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Card | Kitchen, date, delivery, slot, order id |
| Stepper | Принят → Печётся → Готово → Выдано (updates live) |
| Lines | items × qty, Итого |
| After handover | **Оцените кухню**: stars required, comment optional. After save: show the review. |
| Actions | Report problem → support ticket (not a review) |

**Orders list:** each row can show **Оценить** if handed over and not yet reviewed.

**Orders list empty:** *Заказов пока нет.* CTA to catalog. Logged out → Login.

---

### 7. Baker cabinet (`Cabinet`) — second role

Same account. Switch to baker. Kitchen is **pending** until support verifies. Guests do not see it yet. **No demo-kitchen chips.**

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  Кабинет пекаря                 │
│  ( Заказы )  Меню  Кухня        │
│                                 │
│  [amber] На проверке            │
│  [red] Отклонено · причина      │
│                                 │
│  [if no kitchen]                │
│  Отправить кухню на проверку    │
│  имя · ФИО · полный адрес       │
│  район · cutoff · самовывоз/    │
│  курьер · «Готовлю здесь»       │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Гость · телефон · слот    │  │
│  │ самса ×2 · 24 000         │  │
│  │ [Принят][Печётся][Готово] │  │
│  │ [Выдано]                  │  │
│  └───────────────────────────┘  │
│                                 │
│  Кухня tab: ★ рейтинг + отзывы  │
│  Главная  …  Пекарь  Аккаунт    │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Header | Кабинет пекаря. Tabs **Заказы** · **Меню** · **Кухня** |
| If no kitchen | Form: name, owner full name, full address, district, cutoff, pickup/courier, confirm “I cook here” → **Отправить на проверку** |
| Pending | Amber: kitchen not in the district list yet |
| Orders | Guest, phone, slot, items, sum, **status buttons** (polls) |
| Menu | Dishes for tomorrow: photo or emoji, price, leftover, on/off. **Добавить блюдо** |
| Kitchen tab | Public rating + guest reviews. Baker cannot review themselves. |

Guest and baker see the **same** status words: Принят, Печётся, Готово, Выдано.

**Callouts:** kitchen editor tab, add-dish form.

---

## Callouts — not full paper pages

### Login / Register (`Auth`)

Email + password. Register also asks name. Support uses the same form (`support@jol-ashkana.local`). Success: support → Admin, baker role → Cabinet, else Catalog. Nav hidden.

### Account

Name, role switch buyer/baker, geo, logout. Blocked users land here.

### Support (`Admin`)

Seeded account only. Tabs: kitchens (verify / reject / hide), orders (cancel), tickets, users (block with reason).

### Review form

Not a separate page. Lives on **Order status** after **Выдано**. Stars 1–5 required. Comment 4–400 characters or empty.

---

## What not to draw

Keeps the set to 7 screens:

- Toast
- Replace-cart modal
- Leftover-out as its own page
- Kitchen editor as its own page
- Add-dish form as its own page
- Login / register / account / admin as own pages (callouts only)
- Phone-lookup page — **removed**; orders are on the account
- Review as its own page — it sits on order status

---

## Defense, 15 seconds

«Гость выбирает район, видит меню, цену и рейтинг на завтра, кладёт в корзину. Чтобы оформить — входит по email. Свою кухню заказать нельзя. Пекарь с того же аккаунта отправляет кухню на проверку. После verify гости видят меню. Пекарь двигает статус — гость видит то же без чата. После выдачи — звёзды. Наличные при передаче.»
