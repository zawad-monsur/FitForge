/* ==========================================================================
   FitForge — State store
   Single source of truth, persisted to localStorage, with a tiny pub/sub so
   screens re-render when something changes.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var KEY = "fitforge.v1";
  var listeners = [];

  function blank() {
    return {
      version: 1,
      onboarded: false,
      createdAt: null,

      /* Answers from the lifestyle half of onboarding */
      profile: {
        name: "",
        age: 28,
        sex: "male",
        heightCm: 175,
        weightKg: 75,
        targetWeightKg: null,
        units: "metric",          // metric | imperial
        goal: "muscle",           // fatloss | muscle | recomp | strength | endurance | health
        pace: "steady",           // easy | steady | aggressive
        activity: "light",        // sedentary | light | moderate | high | athlete
        job: "desk",              // desk | mixed | active | shift
        sleep: 7,
        stress: "medium",         // low | medium | high
        experience: "beginner",   // beginner | intermediate | advanced
        daysPerWeek: 4,
        splitStyle: "auto",       // auto | full_body | upper_lower | ppl | bro_split
        sessionMins: 60,
        trainingTime: "evening",  // morning | midday | evening | varies
        location: "gym",          // gym | home | hybrid | outdoors
        equipment: [],
        injuries: [],             // knee | shoulder | lower_back | elbow | wrist | neck | hip
        focus: [],                // chest | back | delts | arms | glutes | quads | core
        cardio: "some",           // none | some | lots
      },

      /* Answers from the food half of onboarding */
      kitchen: {
        skill: 1,                 // 0 no-cook · 1 basic · 2 confident · 3 ambitious
        equip: ["stove"],
        cookMins: 30,
        mealsPerDay: 3,
        snacks: 1,
        diet: "omnivore",         // omnivore | vegetarian | vegan | pescatarian | keto — the eating pattern
        religious: "none",        // none | halal | kosher — independent of diet; applies on top of it
        allergies: [],            // dairy egg gluten nuts soy fish shellfish
        dislikes: [],             // recipe ids the user banned
        pantry: [],                // free-text ingredients the user has on hand right now
        cuisines: [],
        budget: 2,                // 1 tight · 2 normal · 3 flexible
        water: 2500,
      },

      /* Computed by calc.js, overridable in the Studio */
      targets: {
        bmr: 0, tdee: 0, kcal: 0, protein: 0, carbs: 0, fat: 0,
        custom: false,
      },

      plan: null,        // { name, note, days: [...] }
      mealPlan: null,    // { days: [ { meals: [...] } ] }

      logs: {
        workouts: {},    // 'YYYY-MM-DD' -> { dayId, sets: { exId: [ {w,r,done} ] }, done, mins }
        food: {},        // 'YYYY-MM-DD' -> [ { name, kcal, p, c, f } ]
        meals: {},       // 'YYYY-MM-DD' -> { 'slotIndex': true }
        weight: [],      // [ { d: 'YYYY-MM-DD', kg } ]
      },

      grocery: { checked: {}, extra: [] },

      /* AI Coach conversation only — the API key itself is intentionally
         NOT stored here. See getApiKey/setApiKey below: it lives in its own
         localStorage key so it never ends up inside an exported JSON backup
         that might get shared or synced elsewhere. */
      coach: { messages: [] },

      prefs: {
        theme: "auto",         // auto | light | dark
        accent: "terracotta",
        density: "cozy",       // cozy | compact
        restTimer: true,
        defaultRest: 90,
        weekStart: 1,          // 1 = Monday
        sawGuide: false,       // "Around the app" tour — shown once automatically, replayable via the topbar's "?" button
      },
    };
  }

  var state = blank();

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* Shallow-merge saved data over the blank shape so new fields added in a
     later version don't break an existing save. */
  function hydrate(saved) {
    var base = blank();
    Object.keys(base).forEach(function (k) {
      if (saved[k] === undefined) return;
      if (base[k] && typeof base[k] === "object" && !Array.isArray(base[k]) && base[k] !== null) {
        base[k] = Object.assign({}, base[k], saved[k]);
      } else {
        base[k] = saved[k];
      }
    });
    return base;
  }

  var AI_KEY_STORAGE = "fitforge.ai_key";
  var AI_MODEL_STORAGE = "fitforge.ai_model";
  var AI_DEFAULT_MODEL = "llama-3.1-8b-instant";

  var store = {
    get: function () { return state; },

    /* Deliberately separate from the main state blob (see the `coach`
       comment above) — never touched by export/import/reset. */
    getApiKey: function () {
      try { return localStorage.getItem(AI_KEY_STORAGE) || ""; } catch (err) { return ""; }
    },
    setApiKey: function (key) {
      try {
        if (key) localStorage.setItem(AI_KEY_STORAGE, key);
        else localStorage.removeItem(AI_KEY_STORAGE);
      } catch (err) { /* ignore */ }
    },
    getAiModel: function () {
      try { return localStorage.getItem(AI_MODEL_STORAGE) || AI_DEFAULT_MODEL; } catch (err) { return AI_DEFAULT_MODEL; }
    },
    setAiModel: function (model) {
      try { localStorage.setItem(AI_MODEL_STORAGE, model); } catch (err) { /* ignore */ }
    },

    load: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (raw) state = hydrate(JSON.parse(raw));
      } catch (err) {
        console.warn("FitForge: could not read saved data —", err);
      }
      return state;
    },

    save: function () {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (err) {
        console.warn("FitForge: could not save —", err);
        if (FF.toast) FF.toast("Storage is full or blocked — changes may not persist.", "warn");
      }
    },

    /* Mutate through a callback, then persist + notify. */
    update: function (fn, silent) {
      fn(state);
      store.save();
      if (!silent) store.emit();
      return state;
    },

    /* Patch a top-level section: store.patch('profile', { age: 30 }) */
    patch: function (section, values, silent) {
      return store.update(function (s) {
        s[section] = Object.assign({}, s[section], values);
      }, silent);
    },

    reset: function () {
      state = blank();
      try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ }
      store.emit();
    },

    on: function (fn) {
      listeners.push(fn);
      return function off() { listeners = listeners.filter(function (l) { return l !== fn; }); };
    },

    emit: function () {
      listeners.forEach(function (fn) {
        try { fn(state); } catch (err) { console.error(err); }
      });
    },

    export: function () { return JSON.stringify(state, null, 2); },

    import: function (json) {
      var parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== "object" || !parsed.profile) {
        throw new Error("That doesn't look like a FitForge backup.");
      }
      state = hydrate(parsed);
      store.save();
      store.emit();
      return state;
    },

    blank: blank,
    clone: clone,
  };

  FF.store = store;
})();
