# Day 4 — Screens on paper

**JOL-Ashkana** — preorder homemade baking for **tomorrow** in your district. Price, menu, slot, and status live in the app, not in Telegram.

This pack matches the live prototype 1:1 (`Landing`, `Catalog`, `Baker`, `Cart`, `Checkout`, `OrderDetail`, `Cabinet`). Draw these 7 screens on paper. Do not invent extra pages.

Two roles. **Guest is first.** Baker is the second path.

---

## Who arrives first, and what they do first

**Person:** a guest, 24–38, city (Tashkent / Almaty / Bishkek). They already buy homemade food from chats. They open the link on a phone. No login.

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
3. **Catalog:** city chip (e.g. Ташкент) → district chip (e.g. Юнусабад). See kitchen cards.
4. Tap a kitchen → **Menu** (`Baker`). See price, leftover, cutoff.
5. Tap **В корзину** on 1–2 dishes.
6. **Cart** → **К оформлению**.
7. **Checkout:** pickup or courier, slot, name, phone (≥9 digits), address if courier → **Заказать на завтра**.
8. **Order status** (`OrderDetail`): Принят → later the baker moves Печётся → Готово → Выдано. Guest reopens **Заказы** with the same phone.

### Hard rules on this path

- One kitchen per cart. Another kitchen → replace/keep modal.
- After cutoff, the order date is **day after tomorrow**.
- Leftover 0 → cannot add.
- Guest identity = **phone**, not an account.

### Baker is not the first scenario

Paper it as a short second strip: Landing → **Я пекарь** → create kitchen → menu on/off → change order status.

---

## Paper arrows (main path only)

```
[1 Landing] --CTA район--> [2 Catalog] --кухня--> [3 Menu]
    --в корзину--> [4 Cart] --оформить--> [5 Checkout]
    --заказ--> [6 Status]
[1] --Я пекарь--> [7 Cabinet]   (second strip, thinner arrow)
```

---

## Shared chrome (screens 2–7)

Phone: ~375×812, cream background.

**Sticky header**

```
[ JA ]  JOL-Ashkana
```

**Bottom nav** (not on Landing)

```
⌂ Главная   ◎ Район   ◉ Корзина   ☰ Заказы   ♨ Пекарь
```

Active tab:

| Screen | Nav |
|---|---|
| Landing | none (nav hidden) |
| Catalog, Menu | Район |
| Cart, Checkout | Корзина |
| Order status, Заказы lookup | Заказы |
| Cabinet | Пекарь |

---

## The 7 screens

Skip as full pages: toast, replace-cart modal, leftover-out, kitchen editor, add-dish form. Mark them as callouts on 3 and 7.

---

### 1. Landing — first screen (`Landing`)

No bottom nav.

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │ JOL-ASHKANA               │  │
│  │                           │  │
│  │ Домашняя выпечка завтра.  │  │
│  │ Не ищи в чатах — закажи   │  │
│  │ в приложении.             │  │
│  │                           │  │
│  │ Меню, цена и слот —       │  │
│  │ без чатов.                │  │
│  │                           │  │
│  │ ┌───────────────────────┐ │  │
│  │ │ Выбери район и        │ │  │  ★ FIRST TAP
│  │ │ закажи на завтра      │ │  │
│  │ └───────────────────────┘ │  │
│  │                           │  │
│  │      Я пекарь             │  │  → screen 7
│  │                           │  │
│  │ 8 домашних кухонь в демо  │  │
│  │ · Ташкент, Алматы, Бишкек │  │
│  └───────────────────────────┘  │
│                                 │
│  Как это работает               │
│  ┌───────────────────────────┐  │
│  │ 1  Район                  │  │
│  │    Город и район — кухни  │  │
│  │    рядом, не весь город.  │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 2  Меню на завтра         │  │
│  │    Цена, состав и слот    │  │
│  │    сразу. Без «сколько?»  │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 3  Статус                 │  │
│  │    Принят → печётся →     │  │
│  │    готово → выдано.       │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Не Telegram и не Яндекс   │  │
│  │ чат-хаос → одно меню      │  │
│  │ Instagram → корзина+слот  │  │
│  │ комиссия 25–35% → 0% демо │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Hero card | Label `JOL-ASHKANA`. Headline: *Домашняя выпечка завтра. Не ищи в чатах — закажи в приложении.* Sub: *Меню, цена и слот — без чатов.* |
| Primary CTA | Big orange: **Выбери район и закажи на завтра** ← star this. Arrow to screen 2. |
| Secondary | Text link **Я пекарь** → screen 7. |
| Proof | `8 домашних кухонь в демо · Ташкент, Алматы, Бишкек` |
| Below fold | 3 steps: Район → Меню на завтра → Статус. Dark block: Telegram/Instagram/Yandex vs JOL. |

**Empty/error:** none. Always this.

---

### 2. Catalog — district + kitchens (`Catalog`)

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  Кухни в районе                 │
│  Предзаказ на завтра.           │
│  Цена видна сразу.              │
│                                 │
│  ( Ташкент )  Алматы  Бишкек    │
│  ( Юнусабад ) Чиланзар  …       │
│  ( Все )  Самовывоз  Курьер     │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [🥐]  Пекарня …           │  │
│  │       ★ 4.8 · адрес       │  │
│  │       самса 12 000 · …    │  │
│  │       приём до 20:00      │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ [🍞]  …                   │  │
│  └───────────────────────────┘  │
│                                 │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Title | Кухни в районе. Sub: Предзаказ на завтра. Цена видна сразу. |
| Row 1 chips | Ташкент · Алматы · Бишкек |
| Row 2 chips | Districts of that city (Юнусабад, Чиланзар, …) |
| Row 3 chips | Все · Самовывоз · Курьер — only after a district is chosen |
| Cards | Emoji tile, name, ★ rating, short address, 2–3 dish prices, cutoff hour |

**Empty A:** no district → *Сначала выбери район.*  
**Empty B:** district with no kitchens → *В этом районе пока нет кухонь. Выбери соседний.*  
**Tap card → screen 3.**

---

### 3. Kitchen menu (`Baker`)

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │ [🥐]  Название кухни      │  │
│  │ Юнусабад · ★ 4.8 · N отз. │  │
│  │ bio                       │  │
│  │ Приём до 20:00 · на завтра│  │
│  │ короткий адрес            │  │
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
| Header card | Emoji, name, district · ★ · reviews, bio, *Приём до HH:00 · на завтра*, short address |
| Late banner | Amber if past cutoff: *Приём заказов до {hour}:00. Сейчас уже поздно — заказ уйдёт на послезавтра.* |
| Groups | Категория → rows: emoji, name, composition, price, leftover. CTA **В корзину** or **На завтра уже нет** |
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
│  ┌───────────────────────────┐  │
│  │ [🍞] …                    │  │
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
| Lines | Emoji, name, price, − qty + (44px targets) |
| Footer | Итого. **К оформлению** |

**Empty:** *Корзина пустая. Выбери район и добавь блюда на завтра.* + CTA **Выбери район и закажи на завтра** back to catalog.

---

### 5. Checkout (`Checkout`)

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  Оформление                     │
│  Пекарня · на завтра            │
│                                 │
│  Получение                      │
│  ┌──────────┐  ┌──────────┐     │
│  │Самовывоз │  │  Курьер  │     │
│  │ адрес    │  │ Yandex Go│     │
│  └──────────┘  └──────────┘     │
│                                 │
│  Слот                           │
│  (10:00–12:00) 12:00–14:00  …   │
│                                 │
│  Имя         [              ]   │
│  Телефон     [ 90 123 45 67 ]   │
│  Адрес       [ если курьер  ]   │
│  Комментарий [              ]   │
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
| Title | Оформление. Sub: kitchen · date (завтра / послезавтра) |
| Delivery | 2 big tiles: **Самовывоз** (kitchen address) / **Курьер** (Yandex Go). Only modes the kitchen has. |
| Slot | Chips, e.g. 10:00–12:00, 12:00–14:00, 16:00–18:00 |
| Fields | Имя, Телефон, Адрес (courier only), Комментарий |
| Submit | **Заказать на завтра** + total |

**Errors (stay on this screen)**

- Name empty → *Как к вам обращаться?*
- Phone &lt; 9 digits → *Введите телефон — не меньше 9 цифр.*
- Courier without address → *Для курьера нужен адрес.*
- Leftover ran out → toast *На завтра уже нет.*

**Success → screen 6.**

---

### 6. Order status (`OrderDetail`)

Guest return visit uses **Заказы** (`Orders`) first: phone form → list → this screen. Draw the status screen as the paper page; note the lookup as a callout.

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
│  ─────────────────────────────  │
│  Итого                 24 000   │
│                                 │
│  Получение: Самовывоз           │
│  Телефон: 90 123 45 67          │
│                                 │
│  [ Заказать снова ]             │
│  [ Отменить ]  ← only if Принят │
│                                 │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Card | Order id, *Заказ оформлен*, kitchen · date · slot |
| Stepper | Принят → Печётся → Готово → Выдано (active = filled) |
| Hint | *Статус меняет пекарь. Откройте заказ — увидите: принят, печётся, готово, выдано.* |
| Lines | items × qty, Итого |
| Meta | delivery, address, phone |
| Actions | **Заказать снова**. If Принят: **Отменить** |

**Return-visit callout (not a 8th screen)**

Заказы → *Введите телефон с оформления — покажем только ваши заказы и их статус.* → **Показать заказы**.

- Wrong/short phone → *Введите телефон — не меньше 9 цифр.*
- No orders → *По этому телефону заказов нет.* + CTA to catalog.
- Link **Другой телефон** to change number.

---

### 7. Baker cabinet (`Cabinet`) — second role

```
┌─────────────────────────────────┐
│  [JA]  JOL-Ashkana              │
├─────────────────────────────────┤
│  Кабинет пекаря                 │
│  Название кухни                 │
│  Моя кухня · завтра, дата       │
│  до 20:00                       │
│  ┌──────────┐  ┌──────────┐     │
│  │Заказы на │  │  Сумма   │     │
│  │завтра  3 │  │  86 000  │     │
│  └──────────┘  └──────────┘     │
│                                 │
│  [if no kitchen]                │
│  Создать свою кухню             │
│  имя · район · адрес · cutoff   │
│  самовывоз / курьер             │
│                                 │
│  Демо-кухни  (не ваша кухня)    │
│  ( Моя кухня )  Пекарня А  …    │
│                                 │
│  ( Заказы )  Меню  Кухня        │
│                                 │
│  ┌───────────────────────────┐  │
│  │ Гость · телефон · слот    │  │
│  │ самса ×2 · 24 000         │  │
│  │ [Принят][Печётся][Готово] │  │
│  │ [Выдано]                  │  │
│  └───────────────────────────┘  │
│  Главная  Район  Корзина  …     │
└─────────────────────────────────┘
```

| Zone | What to draw |
|---|---|
| Header | Кабинет пекаря. Name. *Моя кухня* or *Демо-кухни*. Tomorrow date · cutoff. Two stats: orders tomorrow, sum |
| If no kitchen | Form: name, short name, city, district, address, cutoff, pickup/courier → **Создать свою кухню**. Hint: *Имя, район и адрес сохранятся в этом браузере. Гости в районе увидят ваше меню.* |
| Chips | **Моя кухня** + demo kitchens (labeled *Демо-кухни — только для демо, это не ваша кухня.*) |
| Tabs | **Заказы** · **Меню** · **Кухня** (mine only) |
| Orders | Guest, phone, slot, items, sum, **status buttons** |
| Menu | Toggle tomorrow (На завтра / Скрыто), leftover, + **Добавить блюдо** (mine) |

Guest and baker see the **same** status words: Принят, Печётся, Готово, Выдано.

**Callouts (do not draw as full screens):** kitchen editor tab, add-dish form.

---

## What not to draw

Keeps the set to 7 screens:

- Toast
- Replace-cart modal
- Leftover-out as its own page
- Kitchen editor as its own page
- Add-dish form as its own page
- Phone-lookup as its own page (callout on screen 6)

---

## Defense, 15 seconds

«Человек не регистрируется. Он выбирает район, видит меню и цену на завтра, берёт слот, оставляет телефон. Пекарь в кабинете двигает статус. Тот же статус видит гость.»
