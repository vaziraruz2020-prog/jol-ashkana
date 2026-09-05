# JOL-Ashkana — master visual / motion prompt

**Use this file as the only design brief.** Do not paste the OYLA jewelry prompt, the Bakery Facilities B2B prompt, or the coffee-profile prompt. Those three are *references for feel*. This document is the rewrite for **this** product.

If a later AI or a human implements UI, they follow **this** file, then `SCREENS.md`, `APP.md`, and the live React screens. If this file and a reference prompt disagree, **this file wins**.

---

## 0. What this is

JOL-Ashkana is already a working app: React 18 + Vite + Tailwind, hash routes, Node `/api/*`, cream mobile shell, guest + baker + support.

The job is **not** a new landing-page repo. The job is to make the **existing** app feel more alive — homemade baking for tomorrow in your district — using motion and layout ideas stolen from three Motionsites refs, then **changed** so they belong here.

**Product in one line:** Home baking for tomorrow. Pick a district, see tomorrow’s menu with a price and a slot, pay cash on handover.

**First tap:** «Pick a district and order for tomorrow» (`#/catalog`). Not «I’m a baker». Not a jewelry Discover. Not Download Brochure.

---

## 1. Hard constraints (do not violate)

### Stack — keep

- React 18, Vite, Tailwind 3, existing `src/` screens
- Hash router (`#/`, `#/catalog`, `#/baker/:id`, `#/cart`, `#/checkout`, `#/orders`, `#/order/:id`, `#/cabinet`, `#/account`, `#/admin`, `#/login`, `#/register`)
- `AppShell` sticky header + bottom nav (hidden on landing? keep current: nav shows except login/register)
- Existing API, cookies, polling, RU/EN copy in `src/copy/`
- `Manrope` as the UI font
- Colors already in `tailwind.config.js`:

```txt
cream     #FFF8F3
ink       #1C1917
mute      #78716C
line      #E7E0D8
primary   #FF6B3B  (dark #E85D04, soft #FFE1D4)
fresh     #2ECC71  (dark #239B56, soft #D8F6E5)
shadow-card  0 10px 28px rgba(28, 25, 23, 0.08)
shadow-pop   0 16px 40px rgba(255, 107, 59, 0.18)
```

### Do not add

- A second Express/tsx server, Higgsfield proxy, or CloudFront jewelry/coffee MP4s
- TypeScript rewrite, Lottie, TanStack Query, Sonner, Framer Motion, liquid-glass SVG displacement maps
- GSAP ScrollTrigger **pin** of 100vh / 500vh sections (kills the phone PWA + bottom nav)
- Scroll-scrubbed video (`video.currentTime` driven by scroll)
- Phone mockup frame around the whole site
- Dark full-site (`#090909`, `#180a06`) as the default guest chrome
- OYLA crimson `#A3111E`, Bakery gold `#CB9D06`, jewelry product names, B2B offices, “Dasha / 154 drinks”
- New fonts as the primary UI (Instrument Serif / Luxurious Script / Neue Haas) — optional *one* display face later, never replace Manrope for body/nav/buttons
- Card payments, SMS, fake demo kitchens

### Do keep working

Country → city → district, verified kitchens only, leftover 0 cannot add, one kitchen per cart, cutoff hour, cash on handover, order statuses Accepted → Baking → Ready → Handed over, baker cabinet, support admin.

---

## 2. How the three refs were merged (not concatenated)

Think in **roles**, not in copy-paste sections.

| Role in JOL | Stolen from | Changed into |
|---|---|---|
| First 10 seconds | Bakery full-screen food hero + OYLA capsule CTA | Cream hero, homemade baking, our slogan, orange CTA to `#/catalog` |
| “Pieces of the day” | OYLA horizontal awards carousel | Tomorrow’s dishes / kitchens: name, price, leftover, cutoff. Snap-scroll on mobile, no pin |
| Appetite grid | Bakery masonry pastry types | Optional type chips only if real dishes have types; otherwise skip. Soft zoom, cream cards |
| Story / trust | Bakery word-by-word About + OYLA stats | Existing 3 steps + vs-Telegram block, light word fade, CIS city strip (not partner logos) |
| Living status | Coffee profile stats + achievements | Guest order screen + baker cabinet: cream cards, stepper fill, leftover / orders today. Not espresso iOS |

**Dropped on purpose:** jewelry video scrub, BAG/ABOUT header, B2B nav, floating LinkedIn, phone bezel, liquid glass, dark gold hover system.

---

## 3. Motion budget (max 6 effects)

Phone-first. If it stutters, cut from the bottom of this list.

1. **Hero text enter** — slogan words (not per-character jewelry split) fade+rise 8–12px, stagger 40–60ms, 500–700ms, ease `cubic-bezier(0.16, 1, 0.3, 1)`.
2. **CTA pulse once** — orange primary button, very slight scale 1 → 1.02 → 1 after text, then stop. No infinite pulse.
3. **Card enter** — kitchen / dish / step cards: opacity 0 + `translateY(16px)` → rest when they hit ~85% viewport. Stagger 50ms. Once.
4. **Horizontal snap carousel** — native CSS `scroll-snap`, no GSAP pin. Optional fade on the edge.
5. **Status stepper fill** — existing `StatusStepper` bars animate width 0→100% when status advances (Accepted → Baking → Ready → Handed over). Color: primary, then amber, then fresh.
6. **Tap feedback** — already `active:scale-[0.99]` on buttons; keep. Cards: 1.02 image/emoji zoom on hover (desktop only, 400ms, not 6s bakery zoom).

**Always:** `@media (prefers-reduced-motion: reduce)` → no stagger, no zoom, instant opacity. Do not ship scroll-driven video.

Implementation preference: CSS + IntersectionObserver (or a 20-line hook). GSAP only if CSS cannot do (1) and (3). No ScrollTrigger pin.

---

## 4. Screen-by-screen brief

### 4.1 Landing (`src/screens/Landing.jsx`) — bakery hero × OYLA CTA

**Atmosphere:** warm kitchen at dawn, cream not black. Homemade, CIS, tomorrow — not Berlin rings, not B2B “SMART BAKERY SOLUTION”.

**Hero card (replace the flat white card, keep the content):**

- Soft food atmosphere: CSS gradient cream → peach (`#FFF8F3` → `#FFE1D4`) plus a large muted food emoji cluster or a **local** still (no remote jewelry/coffee MP4). Optional very slow Ken Burns on a background image if we add one under `public/`. Never a 500vh scroller.
- Eyebrow: `JOL-ASHKANA` in primary orange, small, bold (keep `t('brand')`).
- H1: `t('slogan')` — *Home baking for tomorrow. Don’t hunt chats — order in the app.* Motion: word stagger (effect 1).
- Sub: `t('subline')` — menu, price, slot, cash. Fade after H1, +80ms.
- **Primary CTA:** same label `t('ctaDistrict')`. Shape: full-width on phone, `rounded-full` capsule like OYLA Discover, but **orange** (`bg-primary`, white text, `shadow-pop`). Right side: small circle with a + or →. Click: `go('#/catalog')`. Not scroll-to-footer.
- Secondary: login / register or cabinet (keep current auth branching). Ghost capsules, not crimson text links.
- Proof line: `t('social')` — CIS · no cards, no SMS.

**How it works (keep 3 steps, add bakery word-fade):**

- Title `t('stepsTitle')`.
- Three cards: District → Tomorrow’s menu → Status. Existing copy `t('steps')`.
- On scroll into view: number circle pops, title words fade from 40% opacity (not 10% + blur-4px bakery, too heavy on mobile).

**City strip (bakery marquee, rewritten):**

- Slow CSS marquee of **real geo names** from `app.geo` (Tashkent, Almaty, Bishkek, …) in mute uppercase tracking. Pause on hover. Not Bridor / Traiteur de Paris.

**Vs block (keep):**

- Existing red-soft vs fresh-soft rows. No animation except card enter.

**Do not add:** ABOUT / BAG header, DISCOVER scrolling to newsletter, “for Professionals” script font, clover logo.

---

### 4.2 Catalog (`src/screens/Catalog.jsx`) — district + “today’s pieces”

Keep country / city / district chips. They are the product.

**After a district is chosen:**

- If kitchens exist: optional **horizontal snap row** of the first 6 verified kitchens (or their first available dish if the API already returns it). Card: `FoodTile`, name, cutoff, one price hint if we have it without a new endpoint. Snap-align start, peek the next card (padding-right). This is OYLA’s 33vw awards row **shrunk to a phone strip**, not 100vh pinned.
- Below: existing 1–2 column kitchen list. Card enter (effect 3). Hover: emoji tile scale 1.02.

**Empty district:** keep `EmptyState` + “Open a kitchen”. No fake masonry of 7 pastry SKUs.

**Pastry-type chips:** only if dishes/kitchens already have a category field. If not, **do not invent** Viennese / Culinary Aid. Skip.

---

### 4.3 Kitchen menu (`src/screens/Baker.jsx`) — appetite, leftover, slot

Keep kitchen header (emoji, bio, address, cutoff, order-date label).

Dish rows stay list (not luxury 6-column jewelry). Make them feel edible:

- Leftover > 0: small fresh pill “Few left” when low (existing copy).
- Leftover 0: sold-out state, no add (already).
- Add button: orange capsule, not black bakery “Read more”.
- Optional: if many dishes, a snap carousel of available-tomorrow dishes on top, then the full list.

No second scroll-scrubbed video under the list.

---

### 4.4 Cart / Checkout — calm, not cinematic

Do not restyle into gear-shop / luxury editorial. Keep forms, 16px inputs, cash copy.

Alive = toast “Added”, replace-kitchen modal, cutoff warning. That is enough.

---

### 4.5 Order status (`src/screens/OrderDetail.jsx`) — coffee profile, **in cream**

Guest phone, not a 390×844 bezel.

- Hero band: cream-to-peach, kitchen name + `forDate`, not a looping latte reel.
- Identity: kitchen name as the “title”; slot + pickup/courier as the subtitle (coffee’s “Plum Parfait Latte” → our slot line).
- **Stepper** is the achievement: bars fill (effect 5). Labels stay RU/EN status copy.
- Stats row (3 cream cards, not `rgba(255,255,255,0.06)` on `#180a06`):
  - items count
  - total (`formatMoney`)
  - slot
- Favorite-style card: first dish or “Your order” list (existing items). Shuffle button **out**.
- Report link stays.

Glass: at most `bg-white/80 backdrop-blur` on the header we already have. No SVG feDisplacementMap.

---

### 4.6 Baker cabinet (`src/screens/Cabinet.jsx`) — warm kitchen desk

Slightly warmer than guest, still cream. Not espresso profile.

Orders tab top:

- Mini stats from **data we already load**: open orders count, ready count, leftover sum if cheap to compute from `dishes`. No fake “12 achievements”.
- Then existing order list + status buttons.

Menu / kitchen tabs: keep forms. Card enter only.

Pending / rejected banners stay.

---

### 4.7 Auth, Account, Admin

No cinematic treatment. Clarity > theatre. Tiny card-enter at most.

---

## 5. Copy and brand (do not replace)

Use `useT()` / `src/copy/ru.js` + `en.js`. Do not hardcode OYLA or Bakery Facilities strings.

Landing must still pass the 10-second test:

- What: homemade baking for tomorrow
- Who: guest in a CIS district
- First button: pick district
- After tap: catalog
- Different: not Telegram chaos, not 25–35% delivery apps

---

## 6. Assets

- Prefer existing `FoodTile` emoji + `accent` colors.
- New images only under `public/` if we add stills we own. No hotlink to Motionsites / CloudFront jewelry / Figma coffee PNGs.
- No autoplay video in v1 of this visual pass.

---

## 7. Implementation order (when coding starts)

1. Motion primitives: reduced-motion media query, `useInView` stagger, stepper width transition (`src/index.css` + `ui.jsx`).
2. Landing hero + capsule CTA + city marquee + step fade.
3. Catalog snap strip (only with real kitchens).
4. Order detail stats + stepper fill.
5. Cabinet mini-stats.
6. Stop. Do not restyle every screen.

Each step must still work on a 375px phone with the bottom nav.

---

## 8. Acceptance

- Same flows as today; no new backend.
- Guest chrome stays cream/orange/green.
- Landing CTA still goes to `#/catalog`.
- No 500vh video, no pin-scroll, no phone mockup, no jewelry/B2B/coffee branding.
- `prefers-reduced-motion` respected.
- Hobby/Vercel: no extra serverless functions, no new video CDN.

---

## 9. One-paragraph prompt (pasteable)

Upgrade JOL-Ashkana in place (React + Vite + Tailwind, cream `#FFF8F3`, orange `#FF6B3B`, Manrope, hash routes, existing `/api`). Make it feel more alive like a homemade bakery app, not a luxury jewelry film, not a B2B factory site, not a dark iOS coffee mockup. Landing: warm cream-peach hero, word-stagger on the real slogan, orange capsule CTA “Pick a district and order for tomorrow” → `#/catalog`, three existing how-it-works cards with light word fade, CSS marquee of real CIS cities, keep the vs-Telegram block. Catalog: keep geo chips; if verified kitchens exist, add a horizontal scroll-snap strip of kitchen/dish cards (name, leftover, cutoff, price if already available) then the current grid. Kitchen menu: keep leftover/sold-out/add. Order detail: cream stats (items, total, slot) and animate the existing status stepper. Baker cabinet: small real stats (open orders, ready, leftover) then current tabs. Max six CSS/IO motions; honor prefers-reduced-motion; no GSAP pin, no scroll-scrubbed video, no CloudFront/Figma assets, no new fonts as UI, no stack rewrite.

---

*Refs used only as feel: cinematic bakery landing, food carousel, coffee status. Product source of truth: this repo.*
