# FitForge

A gym + diet planner that asks about your lifestyle, equipment, and cooking
ability, then generates a personalised workout split and weekly meal plan —
fully trackable and fully customisable afterwards.

No build step, no server, no account, no tracking. It's plain HTML/CSS/JS,
installable as a PWA on Android and iOS, and everything lives in your
browser's `localStorage`.

## Features

- **Onboarding** — a step-by-step wizard covering body stats, goal, training
  schedule, split style, equipment, injuries, diet, religious dietary law,
  allergies, cooking skill, and kitchen gear.
- **Workout plan** — generated from a library of 135 exercises, filtered to
  what you actually own (bodyweight → full commercial gym) and what's safe
  given any injuries you flagged. Choose an explicit split style — Full Body,
  Upper/Lower, Push Pull Legs, or Body Part Split — or let it auto-pick one
  based on your schedule and experience.
- **Meal plan** — generated from a recipe and quick-log food library, filtered
  by diet, religious dietary law, allergies, cooking skill, kitchen equipment,
  and budget, then scaled to your calorie and protein targets. Favors recipes
  that use what's already in your fridge (Studio → Nutrition), suggests
  regional ingredient substitutes, and produces a grocery list grouped by
  aisle — including your own custom items.
- **Tracking** — log sets (weight × reps) with a rest timer, mark meals eaten,
  log arbitrary food, track bodyweight, and see trends, weekly training
  volume, and personal records on the Progress screen.
- **AI Coach** — an optional chat screen that can see your actual profile,
  targets, workout split, and today's meals, so answers are grounded in your
  real plan instead of generic advice. Bring your own free API key (see
  below) — there's no backend to hold one for you.
- **Studio** — reorder (drag-and-drop or arrow buttons), add, remove, or swap
  exercises and meals; override calorie/macro targets by hand; manage your
  pantry and permanently ruled-out recipes; change theme, accent color, and
  density; export a JSON backup or CSV logs; reset everything.
- **Installable** — a full PWA with an offline-capable service worker. Add it
  to your home screen on Android (real install prompt) or iOS (Share → Add to
  Home Screen) and it opens full-screen, no browser chrome.

## Run it

Just open [`index.html`](index.html) in a browser. That's it.

If your browser blocks `localStorage` or fetches on `file://` URLs, serve it
locally instead — any static server works:

```bash
npx serve .
```

```bash
python -m http.server 8080
```

Then visit the printed `localhost` URL.

## Installing on your phone

Once it's hosted somewhere reachable (e.g. GitHub Pages):

**Android** — open the URL in Chrome, then tap the install icon in the
address bar, or ⋮ menu → **Install app**.

**iOS** — open the URL in **Safari** (required — other browsers can't do
this on iOS), tap the **Share** icon, then **Add to Home Screen**.

## AI Coach setup

The Coach screen calls [Groq](https://console.groq.com/keys)'s API directly
from your browser using your own free API key — there's no server to hold
one for you. Add your key in **Studio → AI Coach**. It's stored in
`localStorage` *separately* from your profile/plan data, so it's never
included in an exported JSON backup.

## Customising

Everything about "how the app looks" lives in `css/tokens.css` — change a
value there and it applies everywhere. Six accent presets ship out of the
box (Studio → Appearance); add another by copying one of the
`[data-accent="…"]` blocks near the bottom of that file.

Everything about "what the app can suggest" lives in a few data files, each
documented at the top with the exact row format:

- [`js/data/exercises.js`](js/data/exercises.js) — add a row to teach the
  planner a new exercise. Also home to per-equipment usage tips.
- [`js/data/recipes.js`](js/data/recipes.js) — add a row to teach the meal
  planner a new recipe, extend `FF.FOODS` for the quick-add food log, or add
  an entry to `FF.SUBSTITUTES` for regional ingredient swaps.

The generation logic itself is in `js/core/planner.js` (workouts) and
`js/core/mealplanner.js` (meals) if you want to change how a split is chosen
or how servings are scaled — both are plain functions with no framework.

## Project layout

```
index.html              App shell + script/style loading order
manifest.json            PWA manifest
sw.js                     Service worker — offline app-shell caching
icons/                     PWA icons (regular + maskable)
css/
  tokens.css             Design tokens — edit this to reskin the whole app
  base.css                Reset, typography, app shell, responsive rules
  components.css          Buttons, cards, chips, modals, charts, etc.
  screens.css              Per-screen layout
js/
  data/
    exercises.js           Exercise library + equipment tips
    recipes.js               Recipes, quick-log foods, ingredient substitutes
  core/
    store.js                localStorage state + pub/sub
    calc.js                  BMR/TDEE/macro math, date & unit helpers
    planner.js                 Equipment-aware workout generator
    mealplanner.js               Diet/skill/pantry-aware meal generator
    ai.js                          AI Coach — Groq API wiring
  ui/
    icons.js                   Inline SVG icon set
    ui.js                       DOM helper, toasts, modals
    charts.js                     SVG chart renderers
  screens/
    onboarding.js                  Setup wizard
    dashboard.js                    Today view
    workout.js                       Set logging, rest timer, day switching
    nutrition.js                      Meal plan, recipes, groceries, food log
    progress.js                        Trends, volume, personal records
    coach.js                            AI Coach chat screen
    studio.js                           Editors + settings + backup
  app.js                    Boot, routing, theme application, service worker
BUILD_LOG.md              Development log — what's built, what's next
```

## Data & privacy

Nothing is sent to a server, except the AI Coach's requests — which go
directly from your browser to Groq's API, using your own key, only when you
send a message. Your profile, plans, and logs live in `localStorage` under
the key `fitforge.v1`. Clearing your browser's site data deletes it — export
a backup first from Studio → Data.

## Design

Direction: **Soft Modern / athletic** — General Sans + Satoshi, warm bone
ground, terracotta accent with a sage secondary, warm-tinted shadows,
spring-eased motion. Full light and dark themes; six swappable accents;
a compact density mode.

## License

MIT — see [LICENSE](LICENSE).

---

*Dedicated to my wife, Mumtaheena Binte Ahmed.*
