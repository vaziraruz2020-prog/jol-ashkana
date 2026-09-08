# Day 4 — Screens on paper

**JOL-Ashkana** — preorder homemade baking for **tomorrow** in your district. Price, menu, slot, and status live in the app, not in Telegram.

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
3. **Catalog:** country → city → district (e.g. Узбекистан → Ташкент → Юнусабад). See **verified** kitchen cards only. Catalog starts empty until a real baker is verified.
4. Tap a kitchen → **Menu** (`Baker`). See price, leftover, cutoff.
5. Tap **В корзину** on 1–2 dishes.
6. **Cart** → **К оформлению**. If not logged in → **Log in / Create an account**, then back to checkout.
7. **Checkout:** pickup or courier, slot, name, phone (≥9 digits), address if courier → **Заказать на завтра**. Cash on handover.
8. **Order status** (`OrderDetail`): Принят → later the baker moves Печётся → Готово → Выдано. Guest reopens **Заказы** while logged in (live poll, no phone lookup).

### Hard rules on this path

- One kitchen per cart. Another kitchen → replace/keep modal.
- After cutoff, the order date is **day after tomorrow**.
- Leftover 0 → cannot add.
- Guest identity = **email account** (HttpOnly JWT). Phone is only a handover contact on checkout.
- Unverified or hidden kitchens do not appear in the district list.
- There are **no demo baker accounts** and no seeded kitchens.

### Baker is not the first scenario

Paper it as a short second strip: Landing → **Я пекарь** → log in / register → submit kitchen → wait for support verify → menu for tomorrow → change order status.

---

## Paper arrows (main path only)

```
[1 Landing] --CTA район--> [2 Catalog] --кухня--> [3 Menu]
    --в корзину--> [4 Cart] --оформить--> [5 Checkout]
    --заказ--> [6 Status]
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

Skip as full pages: toast, replace-cart modal, leftover-out, kitchen editor, add-dish form, login/register, account, admin. Mark those as callouts.

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
│  Завтра рядом  [horizontal peek]│
│                                 │
│  ┌───────────────────────────┐  │
│  │ [🥐]  Пекарня …           │  │
│  │       адрес · до 20:00    │  │
│  │       самса 12 000 · …    │  │
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
| Peek strip | «Завтра рядом» — first verified kitchens |
| Cards | Only `verified` and not hidden. Emoji/photo, name, address, dish prices, cutoff |

**Empty A:** no district → *Сначала выбери страну, город и район.*  
**Empty B:** district with no kitchens → *В этом районе пока нет кухонь. Стань первым пекарем.* CTA **Открыть кухню** → register or baker cabinet.  
**Tap card → screen 3.**

---

### 3. Kitchen menu (`Baker`)

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ [🥐]  Название кухни      │  │
│  │ Юнусабад · адрес          │  │
│  │ bio                       │  │
│  │ Приём до 20:00 · на завтра│  │
│  └───────────────────────────┘  │
│                                 │
│  [amber if late] заказ уйдёт    │
│  на послезавтра                 │
│                                 │
│  Категория                      │
│  ┌───────────────────────────┐  │
│  │ [🥟] Самса        12 000  │  │
│  │      состав · остаток     │  │
│  │              [В корзину]  │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  2 · 24 000     Корзина → │  │  sticky bar
│  └───────────────────────────┘  │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Header card | Photo or emoji, name, district, bio, *Приём до HH:00 · на завтра*, address |
| Late banner | Amber if past cutoff: order goes to the day after tomorrow |
| Groups | Category → rows: photo/emoji, name, ingredients, price, leftover. CTA **В корзину** or **На завтра уже нет** |
| Sticky bar | `N · сумма` → Корзина |

**Callouts (do not draw as full screens)**

- **Modal:** cart is another kitchen → *В корзине блюда другой пекарни. Заменить?* **Заменить** / **Оставить**.
- **Toast:** *Добавлено в корзину.*
- Leftover 0 / few: *На завтра уже нет* / *Осталось мало*.

---

### 4. Cart (`Cart`)

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  Корзина                        │
│  Пекарня · короткий адрес       │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [🥟] Самса     12 000     │  │
│  │              [ − ] 1 [ + ]│  │
│  └───────────────────────────┘  │
│                                 │
│  Итого              24 000      │
│  ┌───────────────────────────┐  │
│  │      К оформлению         │  │
│  └───────────────────────────┘  │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Title | Корзина. Sub: kitchen name · address |
| Lines | Photo/emoji, name, price, − qty + |
| Footer | Итого. **К оформлению** → checkout, or login if logged out |

**Empty:** *Корзина пустая. Выбери район и добавь блюда на завтра.* + CTA back to catalog.

---

### 5. Checkout (`Checkout`)

Must be logged in. If not → Login (callout), then this screen.

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  Оформление                     │
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
│  ┌───────────────────────────┐  │
│  │   Заказать на завтра      │  │
│  │         Итого 24 000      │  │
│  └───────────────────────────┘  │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Title | Оформление. Cash-on-handover banner |
| Fields | Name (from account), phone (handover contact, ≥9 digits) |
| Delivery | **Самовывоз** / **Курьер** — only modes the kitchen has |
| Slot | Chips from geo slots |
| Submit | **Заказать на завтра** + total |

**Errors (stay on this screen)**

- Name empty → *Как к вам обращаться?*
- Phone &lt; 9 digits → *Введите телефон — не меньше 9 цифр.*
- Courier without address → *Для курьера нужен адрес.*
- Leftover ran out → toast *На завтра уже нет.*

**Success → screen 6.**

---

### 6. Order status (`OrderDetail`)

Guest return visit: **Заказы** while logged in → list (polls ~7s) → this screen. No phone-lookup form.

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ JA-…                      │  │
│  │ Заказ оформлен            │  │
│  │ Кухня · на 12 мая · слот  │  │
│  │                           │  │
│  │ ● Принят — Печётся —      │  │
│  │   Готово — Выдано         │  │
│  │ Статус меняет пекарь.     │  │
│  └───────────────────────────┘  │
│                                 │
│  Самса ×2              24 000   │
│  Итого                 24 000   │
│  Получение: Самовывоз           │
│                                 │
│  [ Заказать снова ]             │
│  [ Отменить ]  ← only if Принят │
│  [ Сообщить о проблеме ]        │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Card | Order id, kitchen · date · slot |
| Stepper | Принят → Печётся → Готово → Выдано (updates live) |
| Lines | items × qty, Итого, delivery, phone |
| Actions | **Заказать снова**. If Принят: **Отменить**. Report problem → support ticket |

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
│  Главная  …  Пекарь  Аккаунт    │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Header | Кабинет пекаря. Tabs **Заказы** · **Меню** · **Кухня** |
| If no kitchen | Form: name, owner full name, full address, district, cutoff, pickup/courier, confirm “I cook here” → **Отправить на проверку** |
| Pending | Amber: kitchen not in the district list yet |
| Orders | Guest, phone, slot, items, sum, **status buttons** (polls ~5s) |
| Menu | Dishes for tomorrow: photo or emoji, price, leftover, on/off. **Добавить блюдо** |

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

---

## Defense, 15 seconds

«Гость выбирает район, видит меню и цену на завтра, кладёт в корзину. Чтобы оформить — входит по email. Пекарь с того же аккаунта отправляет кухню на проверку. После verify гости видят меню. Пекарь двигает статус — гость видит то же без чата. Наличные при передаче.»
