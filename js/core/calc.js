/* ==========================================================================
   FitForge — Energy & macro maths, plus shared date/unit helpers
   --------------------------------------------------------------------------
   BMR: Mifflin-St Jeor (the most accurate of the common equations for
   non-athlete populations). TDEE layers an activity multiplier plus a small
   bump for physical jobs. Targets are then adjusted by goal and pace.

   These are estimates, not measurements. The Studio lets any of them be
   overridden by hand.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var ACTIVITY = {
    sedentary: { f: 1.2, label: "Sedentary", desc: "Desk-bound, little walking" },
    light: { f: 1.375, label: "Lightly active", desc: "Some walking, light chores" },
    moderate: { f: 1.55, label: "Moderately active", desc: "On your feet a fair bit" },
    high: { f: 1.725, label: "Very active", desc: "Physical job or long daily walks" },
    athlete: { f: 1.9, label: "Extremely active", desc: "Manual labour or two-a-days" },
  };

  var JOB_BUMP = { desk: 0, mixed: 0.04, active: 0.09, shift: 0.03 };

  var GOALS = {
    fatloss: { label: "Lose fat", short: "Fat loss", protein: 2.2, dir: -1 },
    muscle: { label: "Build muscle", short: "Muscle", protein: 1.9, dir: 1 },
    recomp: { label: "Recomposition", short: "Recomp", protein: 2.2, dir: 0 },
    strength: { label: "Get stronger", short: "Strength", protein: 2.0, dir: 1 },
    endurance: { label: "Build endurance", short: "Endurance", protein: 1.6, dir: 0 },
    health: { label: "General health", short: "Health", protein: 1.6, dir: 0 },
  };

  /* Percentage of TDEE added or removed, by goal direction and pace. */
  var PACE = {
    fatloss: { easy: -0.1, steady: -0.18, aggressive: -0.25 },
    muscle: { easy: 0.05, steady: 0.1, aggressive: 0.16 },
    strength: { easy: 0.04, steady: 0.08, aggressive: 0.12 },
    recomp: { easy: 0, steady: -0.05, aggressive: -0.08 },
    endurance: { easy: 0, steady: 0.03, aggressive: 0.05 },
    health: { easy: 0, steady: 0, aggressive: 0 },
  };

  function round(n, step) {
    step = step || 1;
    return Math.round(n / step) * step;
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  /* ---------------------------------------------------------------- Energy */

  function bmr(p) {
    var base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
    if (p.sex === "male") return base + 5;
    if (p.sex === "female") return base - 161;
    return base - 78; // unspecified — midpoint of the two constants
  }

  function tdee(p) {
    var act = (ACTIVITY[p.activity] || ACTIVITY.light).f;
    var job = JOB_BUMP[p.job] || 0;

    /* Training itself is part of TDEE. Roughly 60 kcal per session-hour
       spread across the week, expressed as a multiplier nudge. */
    var sessions = (p.daysPerWeek || 0) * ((p.sessionMins || 60) / 60);
    var train = clamp(sessions * 0.018, 0, 0.14);

    /* Chronic short sleep measurably lowers activity thermogenesis. */
    var sleepPenalty = p.sleep < 6 ? -0.02 : 0;

    return Math.round(bmr(p) * (act + job + train + sleepPenalty));
  }

  function kcalTarget(p) {
    var t = tdee(p);
    var pct = (PACE[p.goal] || PACE.health)[p.pace || "steady"] || 0;
    var target = t * (1 + pct);

    /* Never program below a sane floor — under-eating wrecks adherence,
       training quality and sleep long before it wrecks bodyfat. */
    var floor = Math.max(bmr(p) * 1.05, p.sex === "female" ? 1300 : 1550);
    return Math.round(clamp(target, floor, t * 1.3) / 10) * 10;
  }

  /* ---------------------------------------------------------------- Macros */

  function macros(p, kitchen, kcal) {
    var goal = GOALS[p.goal] || GOALS.health;
    var w = p.weightKg;

    /* Protein scales to bodyweight, but very high bodyweights don't need
       proportionally more, so lean-mass-ish capping keeps it realistic. */
    var refWeight = Math.min(w, heightIdealMax(p.heightCm) * 1.15);
    var protein = Math.round(refWeight * goal.protein);

    var fat, carbs;

    if (kitchen && kitchen.diet === "keto") {
      carbs = 30;
      protein = Math.round(refWeight * 1.8);
      fat = Math.round((kcal - protein * 4 - carbs * 4) / 9);
    } else {
      /* Fat: 25% of calories, with a 0.7 g/kg hormonal floor. */
      fat = Math.round(Math.max((kcal * 0.25) / 9, w * 0.7));
      carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);

      /* If carbs land too low (very low calorie targets), trade protein down
         before starving the training fuel entirely. */
      if (carbs < w * 1.2) {
        protein = Math.round(Math.max(refWeight * 1.6, protein * 0.85));
        carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
      }
    }

    return {
      protein: Math.max(protein, 40),
      carbs: Math.max(carbs, 20),
      fat: Math.max(fat, 25),
    };
  }

  /* Rough upper end of a healthy weight for a height — used only to stop
     protein targets running away at very high bodyweights. */
  function heightIdealMax(cm) {
    var m = cm / 100;
    return 25 * m * m;
  }

  function computeTargets(state) {
    var p = state.profile;
    var b = bmr(p);
    var t = tdee(p);
    var kcal = kcalTarget(p);
    var m = macros(p, state.kitchen, kcal);
    return {
      bmr: Math.round(b),
      tdee: t,
      kcal: kcal,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      custom: false,
    };
  }

  /* Weekly weight change implied by the current target, in kg. */
  function weeklyDelta(state) {
    var diff = state.targets.kcal - state.targets.tdee;
    return (diff * 7) / 7700;
  }

  function waterTarget(p) {
    return Math.round((p.weightKg * 35 + (p.daysPerWeek > 3 ? 400 : 200)) / 50) * 50;
  }

  /* ----------------------------------------------------------------- Units */

  function kgToLb(kg) { return kg * 2.20462; }
  function lbToKg(lb) { return lb / 2.20462; }
  function cmToIn(cm) { return cm / 2.54; }
  function inToCm (i) { return i * 2.54; }

  function fmtWeight(kg, units, dp) {
    if (kg === null || kg === undefined || isNaN(kg)) return "—";
    var v = units === "imperial" ? kgToLb(kg) : kg;
    return v.toFixed(dp === undefined ? 1 : dp) + (units === "imperial" ? " lb" : " kg");
  }

  function fmtHeight(cm, units) {
    if (units !== "imperial") return Math.round(cm) + " cm";
    var total = cmToIn(cm);
    var ft = Math.floor(total / 12);
    return ft + "' " + Math.round(total - ft * 12) + '"';
  }

  /* ----------------------------------------------------------------- Dates */

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function dateKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function todayKey() { return dateKey(new Date()); }

  function addDays(d, n) {
    var x = new Date(d.getTime());
    x.setDate(x.getDate() + n);
    return x;
  }

  function parseKey(key) {
    var bits = key.split("-");
    return new Date(+bits[0], +bits[1] - 1, +bits[2]);
  }

  /* Monday-first index: Mon = 0 … Sun = 6 */
  function weekIndex(d) { return (d.getDay() + 6) % 7; }

  function startOfWeek(d) { return addDays(d, -weekIndex(d)); }

  var DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var DOW_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  var MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function fmtDate(d) { return DOW[weekIndex(d)] + " " + d.getDate() + " " + MON[d.getMonth()]; }

  function relativeDay(key) {
    var t = todayKey();
    if (key === t) return "Today";
    if (key === dateKey(addDays(new Date(), -1))) return "Yesterday";
    if (key === dateKey(addDays(new Date(), 1))) return "Tomorrow";
    return fmtDate(parseKey(key));
  }

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }

  FF.calc = {
    ACTIVITY: ACTIVITY,
    GOALS: GOALS,
    bmr: bmr,
    tdee: tdee,
    kcalTarget: kcalTarget,
    macros: macros,
    computeTargets: computeTargets,
    weeklyDelta: weeklyDelta,
    waterTarget: waterTarget,
    round: round,
    clamp: clamp,
    kgToLb: kgToLb, lbToKg: lbToKg, cmToIn: cmToIn, inToCm: inToCm,
    fmtWeight: fmtWeight, fmtHeight: fmtHeight,
    dateKey: dateKey, todayKey: todayKey, addDays: addDays, parseKey: parseKey,
    weekIndex: weekIndex, startOfWeek: startOfWeek, fmtDate: fmtDate,
    relativeDay: relativeDay, greeting: greeting,
    DOW: DOW, DOW_LONG: DOW_LONG, MON: MON,
  };
})();
