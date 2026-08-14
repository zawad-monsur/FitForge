# FitForge — Build Log

Running log of what's been built, decided, and what's left. Newest checkpoint at the bottom.

---

## Project brief

A gym + diet app that:
- asks about lifestyle, goals, schedule, injuries
- asks what **equipment** the user has (home / gym / nothing)
- asks what the user **can cook**, what kitchen gear they own, time and budget
- generates a personalised **training plan** and **diet plan** from those answers
- tracks workouts and food, and lets everything be customised afterwards

**Constraints chosen** (user did not answer the stack question, so recommended defaults were used):
- Zero-install: plain HTML/CSS/JS, no npm, no build step — open `index.html` and it runs
- Data persists in `localStorage`, with JSON export/import
- Full scope: onboarding + plan generator + workout tracker + meal planner + customisation studio

**Design direction:** Soft Modern / athletic.
General Sans + Satoshi · warm bone ground `#FDFBF7` · terracotta `#C4633F` accent ·
sage `#3F7C6A` secondary · warm-tinted shadows · radii 14/10/999 · spring motion.
Deliberately avoids the default dark-slate + neon-green look most fitness apps ship.

---

## Checkpoint 1 — Design system

| File | What's in it |
|---|---|
| `css/tokens.css` | All design tokens: type scale (1.25 modular), 4px spacing, radii, motion easings, light + dark palettes, 6 swappable accent presets, compact density mode |
| `css/base.css` | Reset, typography, app shell (desktop rail + mobile tab bar), grid utilities, responsive breakpoints, reduced-motion block |
| `css/components.css` | Buttons (5 variants × 6 states), cards, chips, option cards, fields, stepper, segmented control, switch, range, progress bars, calorie ring, charts, empty states, skeletons, modal/sheet, toasts, tooltips, accordion |
| `css/screens.css` | Onboarding layout, dashboard hero, workout set-logging rows, rest timer bar, meal cards, recipe view, grocery list, studio editors |

Neutrals are warm-tinted (never pure gray) — that single choice does most of the
work separating this from a templated look.

## Checkpoint 2 — Data layer

| File | What's in it |
|---|---|
| `js/data/exercises.js` | **135 exercises**. Each tagged with primary/secondary muscle, movement pattern, *required equipment*, difficulty 1-3, joint stress (for injury filtering), and a coaching cue. Covers bodyweight → full commercial gym, plus conditioning and mobility. |
| `js/data/recipes.js` | **40 recipes** across breakfast/lunch/dinner/snack + **38 quick-log foods**. Each recipe tagged with cooking skill (0 = no-cook → 3 = ambitious), active minutes, *required kitchen equipment*, allergen/diet flags, cuisine, cost tier, per-serving macros, ingredients with grocery aisles, and steps. |

Both files are written to be hand-edited — the header comment in each explains
the row format so new exercises/recipes can be appended without touching logic.

## Checkpoint 3 — State store

`js/core/store.js` — single source of truth, persisted to `localStorage` under
`fitforge.v1`, with pub/sub so screens re-render on change.

API: `FF.store.get() / .load() / .save() / .update(fn) / .patch(section, values) /
.on(fn) / .emit() / .reset() / .export() / .import(json)`

Saves are **hydrated over a blank shape**, so adding new fields in a later
version won't break an existing user's save.

### State shape (the contract every other file codes against)

```
onboarded  createdAt
profile  { name age sex heightCm weightKg targetWeightKg units goal pace
           activity job sleep stress experience daysPerWeek sessionMins
           trainingTime location equipment[] injuries[] focus[] cardio }
kitchen  { skill equip[] cookMins mealsPerDay snacks diet allergies[]
           dislikes[] cuisines[] budget water }
targets  { bmr tdee kcal protein carbs fat custom }
plan     { name note days[ { id name focus exercises[ {exId sets reps restSec} ] } ] }
mealPlan { days[ { meals[ {slot recipeId servings} ] } ] }
logs     { workouts{date→…} food{date→[]} meals{date→{}} weight[] }
grocery  { checked{} extra[] }
prefs    { theme accent density restTimer defaultRest weekStart }
```

## Checkpoint 4 — Generation engines

| File | What's in it |
|---|---|
| `js/core/calc.js` | Mifflin-St Jeor BMR → TDEE (activity × job × training-volume × sleep) → calorie target (goal × pace, with a hard floor so nothing under-eats) → macros (protein g/kg by goal, fat floor, carbs fill the rest; dedicated keto path). Plus unit conversion (`kg↔lb`, `cm↔in`), and all date helpers (`todayKey`, `relativeDay`, `startOfWeek`, `greeting`). |
| `js/core/planner.js` | `eligible()` filters all 135 exercises by owned equipment (`location:'gym'`→`FF.GYM_EQUIPMENT` ∪ picks), injury stress overlap, and level vs experience. `pickSplit()` maps `daysPerWeek` 2→6 to Full Body / Upper-Lower / PPL / PPL+UL / PPL×2. Each day is a slot template by movement pattern; `fillDay()` scores and picks per slot, time-boxes to `sessionMins`, and can append a cardio finisher. `prescribe()` sets sets/reps/rest from a goal-keyed scheme table. `alternatives()` powers exercise swap. |
| `js/core/mealplanner.js` | `eligibleRecipes()` filters all 40 recipes by diet (derived exclude-lists per diet incl. vegan/vegetarian/pescatarian/halal/keto), allergies, skill cap, `cookMins`, owned kitchen `equip`, and dislikes. Fills breakfast/lunch/dinner/snack slots per day for 7 days, avoiding recent repeats. Servings are scaled per-meal blending a calorie factor and a protein factor (70/30) so protein isn't sacrificed for calorie accuracy. `groceryList()` merges ingredients × servings across the week, grouped by aisle. `alternatives()` powers meal swap. |

All three are pure functions — `(state) -> result`, no DOM, no store writes — so screens call them and decide what to do with the output.

---

## PAUSED HERE — resume point

Nothing half-written: everything above is complete and internally consistent.

## Checkpoint 5 — UI helper layer

| File | What's in it |
|---|---|
| `js/ui/icons.js` | `FF.icon(name, opts)` — ~65 inline SVG icons, Lucide-style 1.75px stroke, no emoji anywhere in the UI |
| `js/ui/ui.js` | `FF.el()` DOM builder, `FF.frag()`/`FF.esc()`/`FF.fmtNum()`, `FF.toast(msg, kind)`, `FF.modal(opts)` + `FF.closeModal()` (focus trap in/out, Esc, backdrop click), `FF.confirm(opts)` |
| `js/ui/charts.js` | `FF.ringSVG()` calorie ring (overflows into warn color past 100%), `FF.lineChartSVG()`, `FF.barChartSVG()`, `FF.macroRow()` — all inline SVG using CSS custom properties so they theme automatically, no chart library |

## Checkpoint 6 — Onboarding wizard

`js/screens/onboarding.js` — 19-step wizard over 3 groups (About you /
Training / Kitchen), rendered into the `.ob` overlay. Works on a **local draft**
clone of `profile`/`kitchen` — the store isn't touched until the final step, so
closing mid-way leaves existing data untouched. Generic builders
(`optionGrid`, `chipGroup`, `stepperField`, `segmented`) drive every step from
data, so adding a new question is a new array entry, not new markup.

Branching: the equipment step is skipped entirely when `location === "gym"`
(handled by a `skip(draft)` predicate per step); outdoors shows a bodyweight-only
note. On finish: computes `targets`, runs both `planner.generate` and
`mealplanner.generate`, sets `onboarded = true`, and calls `FF.app.boot()`.

Also patched `js/core/planner.js`: `profile.focus` (collected in onboarding,
step "Any priority areas?") is now threaded into `scoreExercise`/`pickForSlot`
so nominated priority muscles actually bias exercise selection — it was
previously collected but unused.

## Checkpoint 7 — Remaining screens, shell, and QA

| File | What's in it |
|---|---|
| `js/screens/dashboard.js` | Hero with greeting, calorie ring, streak/target/weekly-change stats; quickbar (log food, log weight, start workout, regenerate plan); today's workout card (reads the plan day matching today's weekday); today's meals card with eaten-state; macro bars; 7-day streak strip. |
| `js/screens/workout.js` | Day picker across the plan's split days; `.ex-card` per exercise with coaching cue, badges, and a set-logging grid (weight/reps inputs + done toggle); floating auto-starting rest timer with pause/skip; swap-exercise modal via `planner.alternatives`; regenerate-day and finish-session actions. |
| `js/screens/nutrition.js` | Meals/Groceries segmented view; 7-day picker; meal cards with macro chips, recipe modal (scaled ingredients + method), swap-meal modal; food log with search-based quick-add against `FF.FOODS`; grocery checklist grouped by aisle. |
| `js/screens/progress.js` | Bodyweight line chart, weekly adherence bar chart (last 8 weeks vs target), lifetime stats, personal records (heaviest logged set per exercise, all-time). |
| `js/screens/studio.js` | Training tab (add/reorder/remove exercises per day, regenerate one day or the whole plan); Nutrition tab (custom macro override toggle, diet switch, regenerate meals); Appearance tab (theme/accent/density, all six accents); Data tab (JSON export/import, full reset). |
| `js/app.js` | Builds the rail nav, topbar and mobile tab bar from one `SCREENS` array so desktop/mobile can't drift apart; router (`navigate`/`render`); applies `prefs` to `<html data-theme data-accent data-density>`; boots onboarding or the main shell depending on `onboarded`. |
| `index.html` | Loads Fontshare's actual CSS API for General Sans + Satoshi (they're Fontshare fonts, not Google Fonts — an initial mistake caught and fixed), then all CSS/JS in dependency order. |
| `README.md` | Run instructions, feature list, customisation guide, file map. |

### QA pass (Chrome via the Browser pane, served over `http://localhost` — file:// doesn't execute JS in the preview pane)

Walked the full onboarding wizard, generated a plan and meal plan, and exercised
every screen. **Found and fixed one real bug**: `optionGrid`/`chipGroup` in
onboarding.js mutated the draft correctly on click but never updated the
clicked element's own `aria-pressed` — so selections silently didn't visualize
until you left and returned to a step. Rewrote both to self-update on click.
Also tightened the "Skip" button to an explicit `optional: true` flag per step
instead of regex-sniffing the hint text, and removed a phantom "Review" group
from the sidebar that no step ever actually reached.

Verified: equipment-aware exercise selection (home equipment → only
matching exercises appear), rest timer (auto-starts, counts down, pause/skip),
recipe modal serving-scaling, macro bars, calorie ring, line/bar charts, theme
switching (light/dark), all 6 accent presets, mobile layout (375px, bottom tab
bar, onboarding aside collapses to a step counter). No console errors on any
screen.

---

## Status: feature-complete

Every item from the original plan is built and manually verified working.
Open `index.html` directly, or serve the folder (`npx serve fitforge`) and
visit the printed URL — `file://` works for viewing but some browsers block
`localStorage` on it, so serving locally is the more reliable option during
further development.

## Checkpoint 8 — User feedback fixes

Four issues reported after first use, all fixed and verified in-browser:

1. **Units toggle did nothing.** Switching Metric/Imperial in onboarding's
   "The basics" step updated `draft.profile.units` but never touched the
   height/weight inputs or their `cm`/`kg` suffix labels. Fixed by making the
   segmented control call the wizard's existing (previously unused) `rerender`
   callback, and computing the displayed height/weight values + suffix from
   `draft.profile.units` on each render (175cm → 69in, 75kg → 165.3lb, verified).
   Storage stays metric internally either way — only the display converts.

2. **"What equipment do you have?" was ambiguous for hybrid (gym + home) users.**
   `planner.ownedEquipment()` already unioned `FF.GYM_EQUIPMENT` with picks for
   `location: 'hybrid'`, but the step's copy ("Your plan will only use what you
   select here") contradicted that and never explained gym access was already
   assumed. Fixed by making the step's `hint` support a `function(draft)` (wizard
   render loop updated to call it when it's a function) and adding a location-aware
   callout: hybrid users now see "Gym equipment is already included... only pick
   items you ALSO have at home." Question text also renamed to "What equipment do
   you have at home?" for clarity.

3. **No way to flag a religious diet beyond a bare "Halal" option.** Added
   **Kosher** (excludes pork + shellfish) alongside the existing Halal (excludes
   pork) in `FF.DIETS` (`js/data/recipes.js`) and `DIET_EXCLUDES`
   (`js/core/mealplanner.js`), gave every diet option a descriptive one-line
   subtitle, and reworded the onboarding question to "Any dietary pattern or
   religious diet to follow?" so it's explicit rather than implicit. (Kosher's
   meat/dairy-mixing rule is a per-dish combination constraint, not a single
   ingredient flag — out of scope for tag-based filtering, noted in a code comment.)

4. **No exercise instructions or equipment guidance in the workout tab.** Real
   photos/video can't be embedded (no rights to license or host content for 135
   exercises), so implemented the closest honest equivalent: added
   `FF.EQUIPMENT_TIPS` (`js/data/exercises.js`) — one practical usage tip per
   equipment type (24 total, e.g. dumbbell progressive-overload cue, barbell
   collar safety, kettlebell hip-hinge mechanics) — surfaced through a new
   expandable "How to" accordion on every exercise card in `js/screens/workout.js`.
   It shows the relevant equipment tip(s) for that exercise plus a "Watch form
   videos on YouTube" link that opens a pre-filled YouTube search
   (`<exercise name> proper form`) in a new tab — clearly external, not a fake
   embed. Bodyweight exercises (no equipment) get just the video link.

All four verified working via the running app (see QA notes above for the
general pattern — this pass used direct JS driving of the onboarding wizard's
DOM plus `FF.store`/`FF.planner`/`FF.mealplanner` calls, since the Browser
pane's screenshot compositing was unavailable mid-session; console stayed
clean throughout).

## Checkpoint 9 — Second round of user feedback

Eight items reported after using the running app. Six were real, fixed and
verified live in-browser; two (AI chat, smartwatch integration) are genuine
scope/architecture decisions surfaced back to the user rather than built
silently.

1. **Toasts never disappeared, and a stuck one was sitting in the bottom-right
   corner** (this was one bug, reported as two symptoms). Root cause: this
   environment (and any user with the OS-level "reduce motion" accessibility
   setting on — not rare) has `prefers-reduced-motion: reduce` active, which
   the global reduced-motion CSS block collapses every animation to 0.01ms.
   Near-zero-duration CSS animations can fail to ever fire `animationend` in
   some browsers, and `js/ui/ui.js`'s toast dismissal depended entirely on
   that event to call `node.remove()` — so the toast stayed forever. Fixed
   with a defensive fallback: `setTimeout(remove, 200)` alongside the
   `animationend` listener, whichever fires first. Verified: a toast now
   disappears within 4s where before it was still present.

2. ~~"design isn't aligned"~~ — Re-inspected the Studio Training/Nutrition
   tabs (the screens shown in the report) directly in-browser at the actual
   rendered layout; grid/field/chip spacing matched the design system with no
   visible misalignment. Likely what read as "off" was actually issues #1
   (stuck toast) and #3 (dead-looking duplicate nav button) sitting in view
   at the same time — both now fixed.

3. **"Settings button doesn't work."** `js/app.js`'s rail had a second
   "Studio" button in the footer, below the real "Studio" nav item — clicking
   it while already on the Studio screen (as in the report's screenshot)
   re-rendered the same screen with no visible change, reading as broken.
   It was pure duplication with no distinct behavior. Removed.

4. **No way to change "small decided things" after onboarding** — the
   biggest gap. Studio only ever exposed diet + macros + split-exercise
   editing; every other onboarding answer (schedule, equipment, injuries,
   priority areas, allergies, cooking skill, kitchen gear, meals/snacks,
   cook time, budget, cuisine) was write-once. Added:
   - `js/screens/studio.js`: a **Profile & schedule** card at the top of the
     Training tab (goal, pace, experience, activity, days/week, session
     length, training location, cardio preference, plus equipment/injuries/
     priority-area chip pickers) and expanded **Kitchen settings** on the
     Nutrition tab (diet, cooking skill, budget, meals/snacks/cook-time,
     allergy/kitchen-equipment/cuisine chip pickers). All commit immediately
     to the store; the existing "Regenerate whole plan"/"Regenerate meals"
     buttons apply them to the actual split/meal plan.
   - **"Food I won't eat anymore, decided"** — literally missing before:
     `kitchen.dislikes` existed in the data model but nothing ever wrote to
     it. Added a **"Don't suggest again"** action on every meal card in
     `js/screens/nutrition.js` — confirms, permanently bans the recipe, and
     instantly swaps that slot to the next-best alternative — plus a
     **"Recipes you've ruled out"** manager in Studio → Nutrition to un-ban
     them later. Verified end-to-end: ban → slot swaps immediately → shows
     up in the ruled-out list → "Allow again" removes it.
   - New shared helpers in studio.js: `chipGroupLive` (same self-updating
     click fix as onboarding's chips), `numberField` (commits on
     change/blur, not per keystroke, so typing doesn't fight a re-render).

5. Same bug as #1 — the toast host is genuinely positioned bottom-right
   (`.toasts { bottom: var(--s-5); right: var(--s-5); }`), so the "what's
   that in the corner" was the stuck toast itself. Resolved by the same fix.

6. **"Integrate a good free LLM to ask and get answers?"** Not implemented —
   this needs a decision only the user can make, not a default I should pick
   silently. A browser-only app with no backend has no safe place to hold an
   API key: anything embedded in the client JS is visible to anyone who opens
   dev tools or views source. For a genuinely single-user local app that's a
   real but bounded risk (bring-your-own-key, stored in `localStorage`, used
   directly from the browser) — workable, but it's a security tradeoff the
   user should choose knowingly, and it also means picking a specific
   provider (e.g. Groq, OpenRouter, Gemini each have a free tier with
   different setup). Asked the user directly rather than guessing.

7. QA re-run after all fixes: onboarding units conversion, hybrid equipment
   copy, Studio Training/Nutrition new sections, chip persistence, dislike
   flow — all exercised live via the running app, console clean throughout.

8. **Smartwatch data collection + changing the watch's face.** Flagged as
   out of scope for the current architecture rather than attempted: this is
   a static browser app with zero backend. Reading live sensor/workout data
   from a smartwatch requires a *native* mobile app using platform APIs
   (Apple HealthKit, Android Health Connect, or a vendor SDK like Garmin
   Connect IQ / Fitbit Web API) — browsers have no such access. Changing a
   watch's face from a third-party app is generally not possible on any
   major platform at all (Apple Watch faces are OS-controlled with only
   limited third-party "complications"; Wear OS and Garmin both require
   building the face through their own dedicated watch-face tooling, not
   from an unrelated companion app). This would be a separate native-app
   project, not an extension of this one — explained plainly to the user
   rather than half-building something that can't actually work.

## Checkpoint 10 — AI Coach, pantry/fridge, substitutions

1. **AI Coach** (user chose "bring-your-own-key, free tier" — Groq — when
   asked). Built as a real, working feature, verified live with the user's
   own key (tested one round-trip, then key was cleared from the test
   browser — never written to any file):
   - `js/core/store.js`: API key/model live in **separate** localStorage keys
     (`fitforge.ai_key`, `fitforge.ai_model`), deliberately outside the main
     `fitforge.v1` state blob so `export`/`import`/`reset` never touch them —
     a backup file can be shared without leaking the key. `coach.messages`
     (the conversation) *does* live in the main state, since it's not secret.
   - `js/core/ai.js`: calls Groq's OpenAI-compatible endpoint directly from
     the browser (there is no server to proxy through). Builds a system
     prompt from the user's real profile/targets/plan/meals — see Checkpoint
     11 below, this got substantially richer in the next round.
   - `js/screens/coach.js`: chat UI — bubbles, typing indicator, suggested
     prompts, empty state when no key is set (links to Studio).
   - `js/screens/studio.js`: new **AI Coach** tab — key input (password
     field), model picker, link to get a free key, clear-conversation.
   - Added to `js/app.js` SCREENS list (rail + mobile tab bar pick it up
     automatically, no separate wiring needed).

2. **Pantry / "what's in your fridge"** — `kitchen.pantry: []` added to the
   state shape. `js/core/mealplanner.js`'s `scoreRecipe` now gives a soft
   scoring bonus (`pantryMatchCount × 1.5`) to recipes whose ingredients
   loosely match what's in the pantry — *soft*, not a hard filter, since
   hard-filtering ~40 recipes against a sparse pantry would break generation
   entirely for most users. Meal cards in `js/screens/nutrition.js` show a
   "Uses N from your fridge" badge when it applies. Managed from Studio →
   Nutrition (add/remove chips). Verified: a pantry of turkey mince/onion/
   garlic/pasta correctly surfaced "Turkey Bolognese" with a "Uses 4" badge.

3. **Ingredient substitutions** (for regional availability, e.g. turkey/
   salmon/tahini being hard to find in Bangladesh) — `FF.SUBSTITUTES` in
   `js/data/recipes.js`, ~25 entries, substring-matched against ingredient
   names. Shown as a small note under the matching ingredient in the recipe
   modal (`js/screens/nutrition.js`). Verified: Turkey Bolognese's "Turkey
   mince" row shows "↔ Chicken mince, or lean beef mince".

4. **PWA groundwork — started, not finished.** Drew app icons via an
   in-browser `<canvas>` (512, 512-maskable, 192) as a proof of concept; the
   base64 PNG output was never actually saved to disk before context ran out
   on that sub-task. Switched approach to a plain SVG icon instead (no
   binary/base64 round-trip needed) — `icons/icon.svg` now exists (terracotta
   rounded square + cream crossed-dumbbell mark, matching the existing
   favicon). **Still missing:** a maskable-safe-zone variant, `manifest.json`,
   a service worker for offline caching, and the `<link rel="manifest">` /
   `apple-touch-icon` tags in `index.html`. None of this is wired up yet —
   the app is not currently installable as a PWA.
   - Mobile app path (user's ask: "ultimately a mobile app, Android first for
     my wife, then iPhone for me"): the plan discussed but not yet executed —
     PWA install (today's work, once finished) gets a real home-screen icon
     and standalone window on both Android and iOS with **zero extra
     toolchain**. A store-listed native app would be a further step
     (Capacitor-wrapping this same code — needs Android Studio + a Play
     Developer account for Android, Xcode + Apple Developer Program for
     iOS) — not started, needs the user's go-ahead before scaffolding since
     it pulls in a real native toolchain.
   - **Persistence question answered** (asked by user, text-only, not a code
     change): everything lives in `localStorage`, which is per-browser,
     per-device — it does not sync between the user's phone and their wife's
     phone, or between devices at all. Studio → Data's export/import is the
     only current way to move data between devices, manually. True
     multi-device sync would need real user accounts + a cloud database —
     a genuinely separate, backend-requiring project, not attempted.

## Checkpoint 11 — Split styles + richer AI context + a real spacing bug

1. **Explicit split-style selection** (user: "there are many types of
   routines, PPL etc. — these can be added, user can select which one").
   Previously the split (Full Body / Upper-Lower / PPL / etc.) was always
   auto-picked from `daysPerWeek` + experience with no way to override.
   `js/core/planner.js` now has `STYLE_CANON`: four explicit styles
   (`full_body`, `upper_lower`, `ppl`, `bro_split`), each a **fixed ordered
   list of exactly 6 day templates** — picking N days is just
   `.slice(0, N)`, so every style works at every day-count (2–6) without a
   bespoke template per combination; quality degrades gracefully at the
   edges rather than breaking (e.g. a 2-day bro split just covers Chest +
   Back). `profile.splitStyle` (`"auto"` default) added to the state shape.
   Editable in **Studio → Training** (new "Split style" select) and as a new
   **onboarding step** ("How do you want your week structured?", inserted
   right after the schedule step — wizard is now 20 steps, was 19). Verified
   live: switching to `bro_split` at 5 days produced
   Chest/Back/Shoulders/Legs/Arms exactly as named; switching to `ppl`
   produced Push A/Pull A/Legs A/Push B/Pull B.

2. **AI Coach couldn't actually see the workout/meal plan** (user: "can you
   make the llm chat also see the routines and diets"). The system prompt in
   `js/core/ai.js` previously only included the split's *name* (e.g. "Upper /
   Lower · 4x/week"), not its content. Added `planBreakdown()` (every day
   name + its exercises with sets×reps) and `mealBreakdown()` (today's
   planned meals with kcal/protein) to the prompt, plus pantry contents when
   set. The coach can now answer questions like "what's on my back day" or
   "swap something in today's dinner" with the real data instead of guessing.

3. **Real spacing bug, fixed**: the dashboard's quickbar buttons (Log food /
   Log weight / …) were touching the hero card directly above them with zero
   gap — confirmed from the user's screenshot, root cause was `.hero` having
   no `margin-bottom` in `css/screens.css` (fixed) while `.quickbar`'s
   `section` class only ever adds margin *below* itself, never above.

### Deferred — user said "flag it, I'll say when to fix"

Screenshots supplied for all three; not fixed yet on purpose:

- **Selected-option checkmark circle looks like odd blank space** — the
  `.option__tick` icon in the top-right corner of a selected `.option` card
  (see onboarding's "Both" location card). Needs a visual pass — likely the
  circle's own padding/background reads as a stray gap rather than a
  checkmark at a glance.
- **Same missing-gap bug pattern as the quickbar fix, recurring elsewhere**
  — user explicitly said this shows up on *almost every page*, e.g. the
  hybrid-equipment tinted callout card touching the chip grid directly below
  it with zero gap. The quickbar instance is fixed; the general pattern
  (content directly following a `card--tint` or similar callout with no
  spacing utility applied) is not — needs a systematic pass, not a
  one-off fix, once the user says go.
- **Workout day-picker top label is misleading** — e.g. a Push day (chest +
  shoulders + triceps) shows just "CHEST" as its top label, because
  `js/screens/workout.js`'s daypicker only ever displays `d.focus[0]` (the
  first entry in the day's focus array). Should probably show the day's
  *pattern* (Push/Pull/Legs/Full/Upper/Lower) instead of a single muscle
  name, or something else — needs a decision on what's actually most useful
  there, not just a quick label swap.

## Checkpoint 12 — In progress: diet pattern vs. religious dietary law

User's point (not deferred — flagged as a real logic issue, fixing now):
Halal/Kosher were bundled into the same single-select `diet` field as
lifestyle patterns (Vegetarian/Vegan/Pescatarian/Keto), as if mutually
exclusive — but an omnivore, a pescatarian, or anyone else might *also* need
halal or kosher food. The fix in progress: split into two independent
questions/fields — "eating pattern" (omnivore/vegetarian/vegan/pescatarian/
keto, unchanged) and a separate "religious dietary law" (none/halal/kosher)
that filters on top of whichever pattern is chosen, instead of one field
trying to represent both axes at once.

**Not yet done as of this checkpoint** — data model change plus updates to
onboarding, Studio, and `js/core/mealplanner.js`'s `DIET_EXCLUDES` logic
(needs to become two independent exclude-lists that combine, not one lookup
table). If a session reset happens before this lands, the state to pick back
up from: `kitchen.diet` currently still holds 7 combined values including
`"halal"` and `"kosher"` — those two need to move to a new
`kitchen.religious` field (or similar) and `diet` goes back to 5 lifestyle-
only values.

## Checkpoint 13 — Fixes from comprehensive_report.md (external code review)

User dropped a review document (`comprehensive_report.md`) covering deep code
review of the generation engines plus UX/feature suggestions. Verified each
claim against actual code before acting — one was stale (already fixed
Checkpoint 12), four were real and fixed:

1. **5th meal silently dropped** (`js/core/mealplanner.js` `slotsForDay`) —
   `["breakfast","lunch","dinner"].slice(0, mealsPerDay)` can never return
   more than 3 items regardless of `mealsPerDay`, so 4 and 5 produced the
   *identical* 4-slot result. Fixed: slots beyond the first 3 now add that
   many extra snack-tagged slots (`mealsPerDay - 3`), so 5 correctly yields
   5 (plus whatever the separate `kitchen.snacks` count adds on top).
2. **Dead code** — `scaleDay()` in `mealplanner.js` was fully orphaned
   (generation uses inline `shareMap` scaling instead). Removed.
3. **Time-box priority inversion** (`js/core/planner.js` `fillDay`) — used
   `forEach` with an early `return` to skip a slot that didn't fit the
   remaining time budget, which only skips *that* slot (like `continue`),
   letting a lower-priority accessory later in the list sneak in after a
   higher-priority compound lift got dropped. Converted to a `for` loop with
   a real `break` once budget runs out (past the first 3 guaranteed items),
   so running out of time stops the day rather than skipping ahead.
4. **Exercises repeating across days** — `fillDay`'s `used` Set (which
   `scoreExercise` already penalizes at -100, strongly) was created fresh
   *inside* `fillDay`, so it reset every day with zero memory of previous
   days in the same week. Now created once in `generate()` and threaded
   through every `fillDay` call for the week. Verified: a 6-day PPL split
   with decent equipment went from heavy repetition to 35 distinct exercises
   out of 36 slots (only one unavoidable repeat). Confirmed the penalty
   mechanism was always well-designed — it just was never wired to persist
   across the week.
5. **Imperial height was raw total inches** (e.g. "70") instead of feet+inches
   — real friction, most people don't think in total inches. `onboarding.js`'s
   height field now splits into two small feet/inches inputs when Imperial is
   selected, converting to cm for storage same as before. Verified: 175cm
   now shows as 5 ft / 9 in.

Everything re-verified live in-browser afterward, console clean.

**Not acted on from the same report** (feature suggestions, not bugs —
surfaced back to the user for prioritization rather than built blind):
quick-start onboarding path, streak-freeze/gamified streak, in-workout PR
celebration, weekly volume chart, rest-timer +30s button, custom grocery
items, CSV export, finishing the PWA service worker, empty-state
quick-actions when zero recipes match.

## Checkpoint 14 — Motion pass: boot splash + set-complete checkmark

User asked for "some animated icons somewhere" and "something motion with a
logo" on entering the app. Two scoped additions (not a broad motion pass —
per the frontend-design skill, motion should be rare/high-value, not
sprinkled everywhere):

1. A one-time **boot splash** — the brand mark scales/fades in, the
   wordmark follows, then the whole thing fades out — shown once per page
   load in `js/app.js`, not on every screen navigation. Skips instantly
   under `prefers-reduced-motion`.
2. A **checkmark draw-on animation** when a set is marked complete in the
   Workout screen (`js/screens/workout.js` / `css/screens.css`) — the
   most frequent "success" moment in the app — using stroke-dasharray/
   dashoffset on the check icon rather than a plain instant swap. Triggered
   only by the click itself (a transient class added/removed in JS), not by
   a CSS rule reacting to `aria-pressed` — otherwise every already-completed
   set would replay the draw-on animation every time the screen re-renders
   or a day is reopened, which is exactly the "entrance animation on content
   the user is waiting for" anti-pattern.

Both verified live: the splash shows on first paint and self-removes via a
class-toggle + fallback timer (same defensive pattern as the toast fix —
never trust a single `transitionend`/`animationend` alone); the checkmark
animation is correctly wired (`animation-name` resolves to `check-draw`) and
correctly suppressed under `prefers-reduced-motion` at two independent
layers — a scoped guard on `.check-draw` plus the pre-existing app-wide
0.01ms override.

## Checkpoint 15 — Spacing bug fixed (the deferred one, now greenlit)

User pointed at a screenshot of the exact issue flagged in Checkpoint 11 and
`comprehensive_report.md`: the hybrid-equipment callout card in onboarding
touching the chip grid below it with zero gap. Root cause confirmed: both
`.card--tint` callouts in `js/screens/onboarding.js` (the "hybrid" and
"outdoors" equipment-step notes) were missing the `section` class that
provides `margin-bottom` — the *same* card pattern used correctly elsewhere
(e.g. Studio's header card already has `"card card--tint section"`) just
never got it here. Fixed by adding `section` to both. Verified: gap went
from 0px to 32px, confirmed both by direct DOM measurement and a screenshot.

Scope note: did **not** blanket-add `section` to every plain `.card` in the
codebase — a grep turned up ~15+ other card instances without it, but most
are either the last element in their list or already spaced by a parent
grid's `gap`, so adding margin there could double up spacing rather than
fix anything. Only touched the two confirmed-broken `.card--tint` callouts,
which were the specific instances in both the user's screenshot and the
report.

**Also answered directly**: user asked whether *everything* in
`comprehensive_report.md` had been solved — no. Checkpoint 13 fixed the 4
confirmed logic bugs; the report's other 3 UI bugs are the ones already
on record as user-deferred (2 now still deferred: `.option__tick` blank
space, misleading day-picker label — this checkpoint only closes the
spacing one); and the report's feature suggestions (gamification, volume
chart, CSV export, quick-start onboarding, etc.) were never built — they're
product decisions surfaced back to the user, not silently implemented.

## Checkpoint 16 — Both deferred items closed; starting on report enhancements

User said "do the still deferred ones, then the enhancements" — greenlighting
everything that had been intentionally held back.

1. **`.option__tick` blank-space look, fixed.** It was an unfilled
   outline `check-circle` icon (stroke only, no fill) floating alone in the
   corner of a selected option card — against the tinted selected-state
   background it read as a stray ring, not a checkmark. Every other
   "selected" indicator in the app (chips, grocery checkboxes, set-complete
   button) uses a solid filled badge, so brought this in line:
   `css/components.css`'s `.option__tick` is now a solid 22px accent-filled
   circle, with a plain `check` glyph inside instead of the combined
   `check-circle` icon. Verified visually — clear solid terracotta circle
   with a white check, matching the rest of the design system.

2. **Misleading day-picker label, fixed.** Root cause: the top small label
   and the larger label below it were derived from two *different* sources
   that could disagree — `d.focus[0]` (first muscle in the day's focus
   array) vs. `d.name` (the day's actual name). A "Push" day has focus
   `["chest","delts","triceps"]`, so the top label showed "chest" while the
   name below said "Push" — implying (wrongly) the session was chest-only.
   Fixed in `js/screens/workout.js` with `dayTypeLabel()`: both labels now
   derive from `d.name` alone (first word, uppercased) — same day, same
   source, impossible to disagree. Verified for both PPL (now shows
   PUSH/Push, PULL/Pull, LEGS/Legs consistently) and bro_split (CHEST/Chest,
   BACK/Back, etc.).

Console clean both times (aside from one stale entry left over from my own
earlier test script, confirmed by its `<anonymous>` stack trace, not any
real app file — persists across navigations because the browser tool's
console buffer doesn't clear on reload, not because it's re-occurring).

### Report enhancements — starting now, checkpointing as each lands

Working through, in roughly small-to-large order: rest-timer +30s, custom
grocery items, empty-state quick-actions, CSV export, PWA manifest +
service worker, weekly volume chart, in-workout PR celebration, quick-start
onboarding, gamified streak/streak-freeze.

## Checkpoint 17 — Six report enhancements, a PWA fix, an About card, and two bugs the user caught

Large batch. All verified live in-browser (screenshots weren't available for
part of this session — Browser pane wasn't compositing frames — so
verification leaned on direct DOM/computed-style/store-state assertions
instead, which is actually more precise for confirming exact pixel/behavior
claims than eyeballing a screenshot).

**Report enhancements, done:**

1. **Rest timer +30s** — button added to the rest bar (`js/screens/workout.js`,
   `css/screens.css`). Verified: 0:54 → 1:24 on click.
2. **Custom grocery items** — the data plumbing (`kitchen.grocery.extra`)
   already existed from the original build but had no UI. Added an add-item
   input and a remove button on custom entries in
   `js/screens/nutrition.js`. Verified add and remove both round-trip
   through the store correctly.
3. **Empty-state quick-action** — when zero recipes match the current diet/
   allergy/equipment settings (`mealPlan.empty`), the Nutrition screen now
   offers "Adjust kitchen settings" (jumps straight to Studio → Nutrition)
   instead of just "Generate meal plan" again, which would only retry the
   same failing generation. Uses the same `FF.screens.studio.openTab()`
   pattern built earlier for the Coach screen's empty state.
4. **CSV export** — two new buttons in Studio → Data, alongside the existing
   JSON backup: workout log and bodyweight, both plain CSV for spreadsheets.
   Verified actual file content by intercepting `URL.createObjectURL` in a
   test and reading the generated blob text directly — correct headers,
   correct rows, correct quoting logic.
5. **PWA — finished, not just started.** `manifest.json`, `icons/icon.svg` +
   `icons/icon-maskable.svg` (safe-zone checked by hand — the mark's
   farthest extent from center is ~170px against a 205px safe radius),
   `sw.js`, and the `<link rel="manifest">` / `apple-touch-icon` /
   `apple-mobile-web-app-*` tags in `index.html`. Verified: service worker
   registers and activates, manifest parses correctly with both icon
   purposes, all 27 app files precache with real (not empty) content.
   **Caught and fixed a real caching bug during verification**: the
   service worker's original stale-while-revalidate strategy (`cached ||
   network`) meant editing a file only took effect on the *second* reload
   after the edit — first reload always got the pre-edit snapshot while the
   cache quietly updated in the background. Rewrote as network-first
   (always try the network while online; only fall back to cache if the
   fetch actually fails, i.e. genuinely offline) — this both fixes the dev
   confusion and means real users always get the current code when online,
   with offline capability as a true fallback rather than the default path.
   Bumped `CACHE` to `fitforge-shell-v2` so the old cache gets swept.
6. **Weekly volume chart** — `js/screens/progress.js`: total weekly volume
   (sets × reps × weight, completed sets only, last 8 weeks) as a bar chart
   reusing the existing `FF.barChartSVG`, plus a this-week breakdown by
   primary muscle group below it. Has its own empty state.

**Deferred items, closed:**

7. `.option__tick` — was an unfilled outline icon reading as a stray blank
   ring; now a solid accent-filled badge like every other "selected"
   indicator in the app.
8. Day-picker label mismatch — both labels now derive from the day's name
   alone instead of two disagreeing sources.

**Also added, not from the report:**

9. **About FitForge card** (Studio → Data, bottom) — short description,
   "Built by Zawad", and the dedication line: *"This app is dedicated to my
   wife, Raisa."*

**Two more bugs the user caught after screenshots — fixed:**

10. **Chip blank-space bug** — every unselected chip (equipment, injuries,
    allergies, cuisine — used throughout onboarding and Studio) had dead
    space on the left where the hidden checkmark icon "would" go, because
    `.chip`'s flex `gap` applied even when the checkmark was `opacity: 0` at
    full width. Fixed in `css/components.css`: checkmark now animates
    `width`/`margin-right` from 0 instead of relying on a `gap` that can't
    be conditional — unselected chips have zero reserved space, selected
    ones expand smoothly. Verified by measuring actual computed widths:
    unselected checkmark is `0px` (17px total left padding, just the
    button's own padding), selected is `14px` + 8px margin (39px total,
    correct).
11. **Studio exercise list — real drag-and-drop**, not just up/down arrows
    (which stay, as a keyboard/precision-friendly alternative — not
    replaced). Built with the Pointer Events API rather than native HTML5
    drag-and-drop, since native DnD has poor/inconsistent touch support and
    this needs to work on the user's and his wife's phones. Grip handle
    initiates the drag (`touch-action: none` so a touch-drag doesn't just
    scroll the page); siblings visually shift out of the way as the dragged
    row crosses their midpoint; the array is only actually spliced on
    pointer-up. `setPointerCapture`/`releasePointerCapture` wrapped in
    try/catch since it can throw in edge cases across browsers and isn't
    load-bearing for the drag logic itself. Verified with synthetic
    PointerEvents: a drag past 2.5 row-heights moved an exercise from index
    0 to index 3 exactly as predicted, store state matched the DOM exactly,
    and a sub-threshold nudge (5px) correctly caused no reorder.

**Still open from the original enhancement list** (not done this round —
flagging plainly rather than claiming otherwise): in-workout PR
celebration, quick-start onboarding path, gamified streak/streak-freeze.

**Android/iOS install check** (user's ask: "make it install ready to
android and ios, for ios not installable i know just make usable there"):
the PWA work above (item 5) covers the Android install criteria (valid
manifest + icons + registered service worker with a fetch handler — all
confirmed present). iOS Safari doesn't offer an automatic install prompt by
design (as the user already knew) but honors `apple-touch-icon` and
`apple-mobile-web-app-capable` for a manual "Add to Home Screen", both now
in `index.html`. Confirmed mobile layout itself holds up at a 375px
viewport: rail correctly hides, tab bar correctly shows, zero horizontal
overflow.

## Checkpoint 18 — A real data-loss bug, and the About card settling in

User asked two questions that led to finding and fixing an actual bug, plus
iterated on the About card's placement and content.

1. **"Session complete — log again" — investigated, confirmed safe.**
   Pressing that button repeatedly does *not* reset anything — `finishSession`
   just re-sets `done = true` (already true) and shows the same toast. Tested
   directly: weight value, set data, and `done` all stayed intact across
   repeated clicks.

2. **But found the real bug while checking: switching days in the picker
   silently destroyed today's logged session.** `js/screens/workout.js` only
   ever stored one workout log per *calendar date*, keyed without regard to
   which day-template it belonged to. `ensureTodayLog` would silently
   overwrite that single slot the instant the viewed day didn't match its
   `dayId` — so clicking through the day picker just to glance at a
   different day (not intending to log anything) would wipe out real logged
   sets with zero warning. Reproduced directly: logged a weight, clicked a
   different day tab, and the entire session — including `done: true` —
   was gone, replaced by a blank log.

   Fixed with `logHasProgress()` + `switchActiveDay()`: switching is still
   instant and frictionless when there's nothing to lose (the common
   "just browsing" case — verified this still switches with zero friction,
   no modal), but the moment a switch would actually destroy logged
   progress, it now requires an explicit confirm ("Switch to Chest? You've
   already logged progress on Arms today... this can't be undone") with
   Cancel/Switch anyway. Verified all three paths: blocked-until-confirmed,
   Cancel leaves data untouched, and explicit confirm performs the switch
   correctly.

3. **About card — user couldn't find it, then asked for it front-and-center.**
   It was rendering correctly all along, just as the *last* card in Studio →
   Data (after Backup/CSV/Reset), so it needed scrolling past three other
   cards to reach — a discoverability problem, not a rendering bug. Also
   caught the same missing-`section`-class spacing bug at its old spot
   (`dangerCard` had no bottom margin either). Moved to the *top* of the
   Data tab, and — per a direct follow-up ask — changed Studio's default
   landing tab from Training to Data, so it's now the first thing visible
   the moment Studio opens at all, zero clicks needed.
4. **Corrected names and added a contact.** "Built by Zawad" → "Built by
   K. M. Zawad Monsur." Dedication now reads "my wife, Mumtaheena Binte
   Ahmed (Raisa)" (her formal name plus the nickname already in use). Added
   a mailto link for bug reports: zawadmonsur1@gmail.com.

All four changes verified live: About renders first with correct content and
a working mailto link; the day-switch confirmation shows the right day names
in its message and correctly gates the destructive path while leaving the
safe path frictionless.

## Checkpoint 19 — About card placement, corrected

User's actual intent wasn't "put it in Data" or "make Data the default tab"
— it was: About stays at the **bottom of the Studio page, on every tab,
regardless of which one is active**. My previous fix (top of Data tab +
Data as default) was a guess that missed that. Corrected:

- Moved `aboutCard()` out of `renderData()` into its own function, appended
  once in the main `render(root)` after whichever tab's body renders — so
  it's structurally "always last" rather than tied to one tab.
- Reverted Studio's default tab back to `"training"` (no longer needed to
  force Data open just to surface About).
- Gave the card its own explicit `marginTop` instead of depending on the
  preceding tab's last element having a `section` class — the last card
  differs per tab and isn't consistent about that, so relying on it would
  have just relocated the same missing-spacing bug rather than fixing it.

Verified across all 5 tabs (Training/Nutrition/Coach/Appearance/Data):
About is the last card title on every one, exactly once each — confirmed
programmatically, not just by eyeballing one tab. Also confirmed the
default tab is Training again on a fresh session.

### Ideas for a next pass (not started, not blocking)

- Drag-and-drop reordering in the Studio (currently up/down buttons — works
  fine, just less fluid).
- A dedicated "volume chart" on Progress (sets × weight over time per muscle
  group) — only PRs and adherence are there today.
- Exposing the macro-scaling blend weights (0.7 calorie / 0.3 protein) as a
  Studio setting instead of a hardcoded constant in `mealplanner.js`.
- Service worker for offline use / installability (PWA manifest).
