/* ==========================================================================
   FitForge — Workout plan generator
   --------------------------------------------------------------------------
   Pure functions: (profile) -> plan. No DOM, no store writes — screens call
   FF.planner.generate(state) and decide what to do with the result.

   Pipeline:
     1. eligible()   filter FF.EXERCISES by owned equipment, injuries, level
     2. splitFor()   pick a weekly split template from daysPerWeek + goal
     3. fillDay()    for each day, walk its pattern slots and pick exercises
     4. prescribe()  attach sets / reps / rest per exercise from goal + slot
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var EXPERIENCE_LEVEL_CAP = { beginner: 2, intermediate: 3, advanced: 3 };

  /* ------------------------------------------------------------ Eligibility */

  function ownsEquipment(owned, required) {
    if (!required || !required.length) return true;
    return required.every(function (item) { return owned.indexOf(item) !== -1; });
  }

  function hitsInjury(exercise, injuries) {
    if (!injuries || !injuries.length) return false;
    return exercise.stress.some(function (s) { return injuries.indexOf(s) !== -1; });
  }

  function ownedEquipment(profile) {
    if (profile.location === "gym" || profile.location === "hybrid") {
      /* Union of anything explicitly picked plus the standard gym set —
         hybrid users may also have home kit the gym set doesn't cover. */
      var set = {};
      FF.GYM_EQUIPMENT.forEach(function (e) { set[e] = true; });
      (profile.equipment || []).forEach(function (e) { set[e] = true; });
      return Object.keys(set);
    }
    return profile.equipment || [];
  }

  function eligible(profile) {
    var owned = ownedEquipment(profile);
    var cap = EXPERIENCE_LEVEL_CAP[profile.experience] || 2;
    return FF.EXERCISES.filter(function (ex) {
      return ownsEquipment(owned, ex.equip)
        && !hitsInjury(ex, profile.injuries)
        && ex.level <= cap;
    });
  }

  /* ------------------------------------------------------------- Splits */

  /* Each split is a list of day templates. A day template names its focus
     and lists movement-pattern "slots" to fill, in priority order, tagged
     with a target muscle group when it matters for exercise selection. */

  var SPLITS = {
    full2: [
      { name: "Full Body A", focus: ["full"], slots: fullBodySlots(1) },
      { name: "Full Body B", focus: ["full"], slots: fullBodySlots(2) },
    ],
    full3: [
      { name: "Full Body A", focus: ["full"], slots: fullBodySlots(1) },
      { name: "Full Body B", focus: ["full"], slots: fullBodySlots(2) },
      { name: "Full Body C", focus: ["full"], slots: fullBodySlots(3) },
    ],
    ul4: [
      { name: "Upper Body A", focus: ["chest", "back", "delts", "arms"], slots: upperSlots(1) },
      { name: "Lower Body A", focus: ["quads", "hamstrings", "glutes"], slots: lowerSlots(1) },
      { name: "Upper Body B", focus: ["back", "chest", "delts", "arms"], slots: upperSlots(2) },
      { name: "Lower Body B", focus: ["hamstrings", "quads", "glutes"], slots: lowerSlots(2) },
    ],
    ppl3: [
      { name: "Push", focus: ["chest", "delts", "triceps"], slots: pushSlots() },
      { name: "Pull", focus: ["back", "lats", "biceps"], slots: pullSlots() },
      { name: "Legs", focus: ["quads", "hamstrings", "glutes"], slots: legSlots() },
    ],
    ppl5: [
      { name: "Push", focus: ["chest", "delts", "triceps"], slots: pushSlots() },
      { name: "Pull", focus: ["back", "lats", "biceps"], slots: pullSlots() },
      { name: "Legs", focus: ["quads", "hamstrings", "glutes"], slots: legSlots() },
      { name: "Upper Body", focus: ["chest", "back", "delts"], slots: upperSlots(2) },
      { name: "Lower Body", focus: ["glutes", "hamstrings", "quads"], slots: lowerSlots(2) },
    ],
    ppl6: [
      { name: "Push A", focus: ["chest", "delts", "triceps"], slots: pushSlots() },
      { name: "Pull A", focus: ["back", "lats", "biceps"], slots: pullSlots() },
      { name: "Legs A", focus: ["quads", "hamstrings", "glutes"], slots: legSlots() },
      { name: "Push B", focus: ["delts", "chest", "triceps"], slots: pushSlots(true) },
      { name: "Pull B", focus: ["lats", "back", "biceps"], slots: pullSlots(true) },
      { name: "Legs B", focus: ["hamstrings", "glutes", "quads"], slots: legSlots(true) },
    ],
  };

  function fullBodySlots(variant) {
    var lead = variant === 1 ? "squat" : variant === 2 ? "hinge" : "lunge";
    return [
      { pattern: lead, count: 1 },
      { pattern: "horizontal_push", count: 1 },
      { pattern: "horizontal_pull", count: 1 },
      { pattern: "vertical_push", count: variant === 2 ? 1 : 0 },
      { pattern: "vertical_pull", count: variant === 3 ? 1 : 0 },
      { pattern: "accessory", muscle: variant === 1 ? "side_delts" : variant === 2 ? "biceps" : "triceps", count: 1 },
      { pattern: "core", count: 1 },
    ];
  }

  function upperSlots(variant) {
    return [
      { pattern: variant === 1 ? "horizontal_push" : "horizontal_pull", count: 1 },
      { pattern: variant === 1 ? "horizontal_pull" : "vertical_push", count: 1 },
      { pattern: variant === 1 ? "vertical_push" : "horizontal_push", count: 1 },
      { pattern: "vertical_pull", count: 1 },
      { pattern: "accessory", muscle: "side_delts", count: 1 },
      { pattern: "arms", muscle: variant === 1 ? "triceps" : "biceps", count: 1 },
      { pattern: "arms", muscle: variant === 1 ? "biceps" : "triceps", count: 1 },
    ];
  }

  function lowerSlots(variant) {
    return [
      { pattern: variant === 1 ? "squat" : "hinge", count: 1 },
      { pattern: variant === 1 ? "hinge" : "squat", count: 1 },
      { pattern: "lunge", count: 1 },
      { pattern: "accessory", muscle: "hamstrings", count: 1 },
      { pattern: "accessory", muscle: "calves", count: 1 },
      { pattern: "core", count: 1 },
    ];
  }

  function pushSlots(alt) {
    return [
      { pattern: "horizontal_push", count: 1 },
      { pattern: "vertical_push", count: 1 },
      { pattern: alt ? "vertical_push" : "horizontal_push", count: 1 },
      { pattern: "accessory", muscle: "side_delts", count: 1 },
      { pattern: "arms", muscle: "triceps", count: 2 },
    ];
  }

  function pullSlots(alt) {
    return [
      { pattern: "vertical_pull", count: 1 },
      { pattern: "horizontal_pull", count: 1 },
      { pattern: alt ? "horizontal_pull" : "vertical_pull", count: 1 },
      { pattern: "accessory", muscle: "rear_delts", count: 1 },
      { pattern: "arms", muscle: "biceps", count: 2 },
    ];
  }

  function legSlots(alt) {
    return [
      { pattern: alt ? "hinge" : "squat", count: 1 },
      { pattern: alt ? "squat" : "hinge", count: 1 },
      { pattern: "lunge", count: 1 },
      { pattern: "accessory", muscle: alt ? "quads" : "hamstrings", count: 1 },
      { pattern: "accessory", muscle: "calves", count: 1 },
      { pattern: "core", count: 1 },
    ];
  }

  /* ------------------------------------------------------- Explicit styles */

  /* Body-part ("bro") split day builders — one or two muscle groups a day. */
  function chestSlots() {
    return [
      { pattern: "horizontal_push", count: 2 },
      { pattern: "accessory", muscle: "chest", count: 2 },
      { pattern: "arms", muscle: "triceps", count: 1 },
    ];
  }
  function backSlots() {
    return [
      { pattern: "vertical_pull", count: 2 },
      { pattern: "horizontal_pull", count: 2 },
      { pattern: "accessory", muscle: "rear_delts", count: 1 },
      { pattern: "arms", muscle: "biceps", count: 1 },
    ];
  }
  function shoulderSlots() {
    return [
      { pattern: "vertical_push", count: 2 },
      { pattern: "accessory", muscle: "side_delts", count: 2 },
      { pattern: "accessory", muscle: "rear_delts", count: 1 },
      { pattern: "accessory", muscle: "traps", count: 1 },
    ];
  }
  function armsSlots() {
    return [
      { pattern: "arms", muscle: "biceps", count: 3 },
      { pattern: "arms", muscle: "triceps", count: 3 },
    ];
  }
  function coreConditioningSlots() {
    return [
      { pattern: "core", count: 3 },
      { pattern: "accessory", muscle: "calves", count: 2 },
      { pattern: "conditioning", count: 1 },
    ];
  }

  /* Each explicit style is a fixed, ordered list of exactly 6 day templates.
     Picking N days just takes the first N — so every style works at every
     day count without needing a bespoke template per combination. Quality
     degrades gracefully at the edges (e.g. a 2-day body-part split only
     covers Chest + Back that week) rather than breaking. */
  var STYLE_CANON = {
    full_body: [1, 2, 3, 1, 2, 3].map(function (variant, i) {
      return { name: "Full Body " + String.fromCharCode(65 + i), focus: ["full"], slots: fullBodySlots(variant) };
    }),
    upper_lower: [
      { name: "Upper Body A", focus: ["chest", "back", "delts", "arms"], slots: upperSlots(1) },
      { name: "Lower Body A", focus: ["quads", "hamstrings", "glutes"], slots: lowerSlots(1) },
      { name: "Upper Body B", focus: ["back", "chest", "delts", "arms"], slots: upperSlots(2) },
      { name: "Lower Body B", focus: ["hamstrings", "quads", "glutes"], slots: lowerSlots(2) },
      { name: "Upper Body C", focus: ["chest", "back", "delts", "arms"], slots: upperSlots(1) },
      { name: "Lower Body C", focus: ["quads", "hamstrings", "glutes"], slots: lowerSlots(1) },
    ],
    ppl: null, // filled in below, once SPLITS.ppl6 exists
    bro_split: [
      { name: "Chest", focus: ["chest", "triceps"], slots: chestSlots() },
      { name: "Back", focus: ["back", "lats", "biceps"], slots: backSlots() },
      { name: "Shoulders", focus: ["delts", "side_delts", "rear_delts", "traps"], slots: shoulderSlots() },
      { name: "Legs", focus: ["quads", "hamstrings", "glutes"], slots: lowerSlots(1) },
      { name: "Arms", focus: ["biceps", "triceps"], slots: armsSlots() },
      { name: "Core & Conditioning", focus: ["core"], slots: coreConditioningSlots() },
    ],
  };
  STYLE_CANON.ppl = SPLITS.ppl6;

  var STYLE_LABELS = {
    full_body: "Full Body",
    upper_lower: "Upper / Lower",
    ppl: "Push Pull Legs",
    bro_split: "Body Part Split",
  };

  function pickSplit(profile) {
    var d = FF.calc.clamp(profile.daysPerWeek || 3, 2, 6);
    var style = profile.splitStyle;

    if (style && style !== "auto" && STYLE_CANON[style]) {
      return { key: style, days: STYLE_CANON[style].slice(0, d) };
    }

    if (d <= 2) return { key: "full2", days: SPLITS.full2 };
    if (d === 3) {
      /* Beginners get more full-body frequency per muscle; more advanced
         lifters usually prefer PPL once they can recover from 3 days. */
      return profile.experience === "beginner"
        ? { key: "full3", days: SPLITS.full3 }
        : { key: "ppl3", days: SPLITS.ppl3 };
    }
    if (d === 4) return { key: "ul4", days: SPLITS.ul4 };
    if (d === 5) return { key: "ppl5", days: SPLITS.ppl5 };
    return { key: "ppl6", days: SPLITS.ppl6 };
  }

  /* ------------------------------------------------------------ Selection */

  function scoreExercise(ex, focusMuscles, usedIds, userFocus) {
    var score = 0;
    if (usedIds.has(ex.id)) score -= 100; // strongly avoid repeats within a plan
    if (focusMuscles.indexOf(ex.primary) !== -1) score += 6;
    if (ex.secondary.some(function (m) { return focusMuscles.indexOf(m) !== -1; })) score += 2;
    if (ex.kind === "compound") score += 3;
    /* User-nominated priority muscles (from onboarding) get a further nudge,
       so "I want bigger arms" actually biases exercise selection. */
    if (userFocus && userFocus.length) {
      if (userFocus.indexOf(ex.primary) !== -1) score += 4;
      else if (ex.secondary.some(function (m) { return userFocus.indexOf(m) !== -1; })) score += 1.5;
    }
    score += Math.random() * 2; // light shuffle so re-rolls vary
    return score;
  }

  function pickForSlot(pool, slot, focusMuscles, usedIds, userFocus) {
    var candidates = pool.filter(function (ex) { return ex.pattern === slot.pattern; });
    if (slot.muscle) {
      var narrowed = candidates.filter(function (ex) { return ex.primary === slot.muscle; });
      if (narrowed.length) candidates = narrowed;
    }
    if (!candidates.length) return null;
    candidates.sort(function (a, b) { return scoreExercise(b, focusMuscles, usedIds, userFocus) - scoreExercise(a, focusMuscles, usedIds, userFocus); });
    return candidates[0];
  }

  /* --------------------------------------------------------- Prescription */

  /* sets / reps / rest by goal — the shape of the stimulus. */
  var SCHEME = {
    fatloss: { compound: [3, "8-12", 75], isolation: [3, "12-15", 50], cardio: [1, "-", 0] },
    muscle: { compound: [4, "8-12", 90], isolation: [3, "10-15", 60], cardio: [1, "-", 0] },
    recomp: { compound: [3, "8-12", 80], isolation: [3, "10-14", 55], cardio: [1, "-", 0] },
    strength: { compound: [5, "3-6", 150], isolation: [3, "8-12", 75], cardio: [1, "-", 0] },
    endurance: { compound: [3, "12-20", 45], isolation: [2, "15-20", 40], cardio: [1, "-", 0] },
    health: { compound: [3, "10-14", 75], isolation: [2, "12-15", 55], cardio: [1, "-", 0] },
  };

  function prescribe(ex, goal) {
    var scheme = SCHEME[goal] || SCHEME.health;
    var row = scheme[ex.kind === "compound" ? "compound" : ex.kind === "cardio" ? "cardio" : "isolation"];
    return { sets: row[0], reps: row[1], restSec: row[2] };
  }

  /* Roughly how many minutes one exercise costs: sets * (35s work + rest). */
  function estMinutes(item) {
    var reps = item.sets;
    var rest = item.restSec || 60;
    return Math.round((reps * (35 + rest)) / 60);
  }

  /* ------------------------------------------------------------- Assembly */

  function fillDay(dayTemplate, pool, profile, used) {
    used = used || new Set();
    var items = [];
    var budget = profile.sessionMins - 8; // warm-up buffer

    var slots = [];
    dayTemplate.slots.forEach(function (slot) {
      for (var i = 0; i < slot.count; i++) slots.push(slot);
    });

    /* A plain for-loop, not forEach, because once the time box is full we
       need to actually stop — forEach's `return` only skips to the next
       slot (like `continue`), which let a short accessory near the end of
       the list sneak in after a higher-priority compound lift earlier in
       the list had already been dropped for not fitting. Slots are listed
       in priority order, so running out of budget should stop the day, not
       skip ahead looking for something smaller. */
    for (var s = 0; s < slots.length; s++) {
      var slot = slots[s];
      var ex = pickForSlot(pool, slot, dayTemplate.focus, used, profile.focus);
      if (!ex) continue; // no eligible exercise for this slot — try the next one
      var rx = prescribe(ex, profile.goal);
      var mins = estMinutes(rx);
      if (items.length >= 3 && budget - mins < 0) break; // core work is in; out of time — stop rather than skip ahead
      used.add(ex.id);
      budget -= mins;
      items.push({
        exId: ex.id,
        sets: rx.sets,
        reps: rx.reps,
        restSec: rx.restSec,
      });
    }

    /* Optional finisher cardio for fat-loss / endurance goals or explicit
       cardio preference, if there's room and the pattern isn't already the
       whole session. */
    var wantsCardio = profile.cardio === "lots" || (profile.cardio === "some" && (profile.goal === "fatloss" || profile.goal === "endurance"));
    if (wantsCardio && budget > 8) {
      var cardioPool = pool.filter(function (ex) { return ex.kind === "cardio"; });
      if (cardioPool.length) {
        var pick = cardioPool[Math.floor(Math.random() * cardioPool.length)];
        items.push({ exId: pick.id, sets: 1, reps: budget >= 15 ? "12-15 min" : "8-10 min", restSec: 0 });
      }
    }

    return items;
  }

  function generate(state) {
    var profile = state.profile;
    var pool = eligible(profile);
    var split = pickSplit(profile);

    /* Shared across every day in the week, not reset per day — scoreExercise
       already strongly penalizes (-100) an already-used exercise, so this
       naturally spreads variety across the split instead of e.g. Barbell
       Squat winning the "squat" slot on every single leg day. The penalty
       is a preference, not a hard exclusion, so a small equipment pool
       never runs out of valid picks — it just re-uses the least-bad option
       once everything distinct has been used at least once. */
    var used = new Set();

    var days = split.days.map(function (tpl, i) {
      var exercises = fillDay(tpl, pool, profile, used);
      return {
        id: "d" + i,
        name: tpl.name,
        focus: tpl.focus,
        exercises: exercises,
      };
    });

    return {
      splitKey: split.key,
      name: splitLabel(split.key, profile.daysPerWeek),
      note: planNote(profile, pool.length),
      generatedAt: new Date().toISOString(),
      days: days,
    };
  }

  function splitLabel(key, days) {
    var labels = {
      full2: "Full Body", full3: "Full Body",
      ul4: "Upper / Lower", ppl3: "Push Pull Legs",
      ppl5: "Push Pull Legs +", ppl6: "Push Pull Legs ×2",
    };
    return (labels[key] || STYLE_LABELS[key] || "Custom") + " · " + days + "x/week";
  }

  function planNote(profile, poolSize) {
    var bits = [];
    bits.push(profile.location === "gym" ? "Built for a full gym." : profile.location === "hybrid" ? "Mixes home and gym kit." : "Built for your home setup.");
    if (profile.injuries && profile.injuries.length) bits.push("Avoiding moves that load: " + profile.injuries.join(", ") + ".");
    if (poolSize < 25) bits.push("Equipment is limited, so some sessions lean on bodyweight work — add gear in the Studio to unlock more variety.");
    return bits.join(" ");
  }

  /* Swap a single exercise for another that fills the same pattern, without
     disturbing anything else in the day. Used by the workout screen. */
  function alternatives(exId, profile) {
    var current = FF.EX_BY_ID[exId];
    if (!current) return [];
    var pool = eligible(profile);
    return pool.filter(function (ex) {
      return ex.id !== exId && ex.pattern === current.pattern;
    }).sort(function (a, b) { return scoreExercise(b, [current.primary], new Set()) - scoreExercise(a, [current.primary], new Set()); });
  }

  FF.planner = {
    eligible: eligible,
    ownedEquipment: ownedEquipment,
    pickSplit: pickSplit,
    generate: generate,
    alternatives: alternatives,
    prescribe: prescribe,
    SPLITS: SPLITS,
    STYLE_LABELS: STYLE_LABELS,
  };
})();
