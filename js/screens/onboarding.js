/* ==========================================================================
   FitForge — Onboarding wizard
   --------------------------------------------------------------------------
   Renders into the fixed `.ob` overlay defined in index.html / screens.css.
   Works on a local draft (profile + kitchen) so nothing touches the store
   until the very last step generates and commits both plans.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var GROUPS = ["About you", "Training", "Kitchen"];

  var INJURY_OPTIONS = [
    { id: "knee", label: "Knee" }, { id: "shoulder", label: "Shoulder" },
    { id: "lower_back", label: "Lower back" }, { id: "elbow", label: "Elbow" },
    { id: "wrist", label: "Wrist" }, { id: "hip", label: "Hip" }, { id: "neck", label: "Neck" },
  ];

  var FOCUS_OPTIONS = [
    { id: "chest", label: "Chest" }, { id: "back", label: "Back" }, { id: "lats", label: "Lats" },
    { id: "delts", label: "Shoulders" }, { id: "biceps", label: "Arms" }, { id: "glutes", label: "Glutes" },
    { id: "quads", label: "Legs" }, { id: "core", label: "Core" },
  ];

  var CUISINE_OPTIONS = Object.keys(FF.CUISINES).filter(function (k) { return k !== "general"; })
    .map(function (k) { return { id: k, label: FF.CUISINES[k] }; });

  var HOME_EQUIPMENT = Object.keys(FF.EQUIPMENT).map(function (k) { return { id: k, label: FF.EQUIPMENT[k] }; });
  var KITCHEN_EQUIPMENT = Object.keys(FF.KITCHEN).map(function (k) { return { id: k, label: FF.KITCHEN[k] }; });

  /* ---------------------------------------------------------------- Helpers */

  function toggleInArray(arr, id) {
    var i = arr.indexOf(id);
    if (i === -1) arr.push(id); else arr.splice(i, 1);
    return arr;
  }

  function optionCard(item, pressed) {
    return FF.el("button", {
      class: "option rise", type: "button", "aria-pressed": pressed ? "true" : "false",
    }, [
      item.icon ? FF.el("span", { class: "option__icon", html: FF.icon(item.icon, { size: 18 }) }) : null,
      FF.el("span", { class: "grow" }, [
        FF.el("div", { class: "option__title", text: item.title }),
        item.desc ? FF.el("div", { class: "option__desc", text: item.desc }) : null,
      ]),
      FF.el("span", { class: "option__tick", html: FF.icon("check", { size: 13, strokeWidth: 3 }) }),
    ]);
  }

  /* Single-select grid. Updates every button's aria-pressed itself on click
     so the newly picked card highlights and the old one clears — no full
     re-render needed (and no risk of forgetting to wire one up). */
  function optionGrid(items, selected, cols, onSelect) {
    var wrap = FF.el("div", { class: "options options--" + cols });
    var entries = [];
    items.forEach(function (item) {
      var btn = optionCard(item, selected === item.id);
      btn.addEventListener("click", function () {
        selected = item.id;
        entries.forEach(function (e) { e.btn.setAttribute("aria-pressed", e.id === selected ? "true" : "false"); });
        onSelect(item.id);
      });
      entries.push({ id: item.id, btn: btn });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  /* Multi-select chips. Each chip owns its own visual state — click toggles
     the shared array (in place) then re-reads it to set this chip's own
     aria-pressed, so it doesn't depend on anything outside itself. */
  function chipGroup(items, selectedArr, onToggle) {
    var wrap = FF.el("div", { class: "chips" });
    items.forEach(function (item) {
      var btn = FF.el("button", {
        class: "chip rise", type: "button",
        "aria-pressed": selectedArr.indexOf(item.id) !== -1 ? "true" : "false",
      }, [
        FF.el("span", { class: "chip__check", html: FF.icon("check", { size: 14 }) }),
        FF.el("span", { text: item.label }),
      ]);
      btn.addEventListener("click", function () {
        onToggle(item.id);
        btn.setAttribute("aria-pressed", selectedArr.indexOf(item.id) !== -1 ? "true" : "false");
      });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function stepperField(value, min, max, step, suffix, onChange) {
    var display = FF.el("span", { class: "stepper__value", text: value + (suffix || "") });
    function set(v) { value = FF.calc.clamp(v, min, max); display.textContent = value + (suffix || ""); onChange(value); }
    return FF.el("div", { class: "stepper" }, [
      FF.el("button", { class: "stepper__btn", type: "button", "aria-label": "Decrease", html: FF.icon("minus", { size: 16 }), onClick: function () { set(value - step); } }),
      display,
      FF.el("button", { class: "stepper__btn", type: "button", "aria-label": "Increase", html: FF.icon("plus", { size: 16 }), onClick: function () { set(value + step); } }),
    ]);
  }

  function segmented(items, value, onChange) {
    var wrap = FF.el("div", { class: "segmented" });
    var buttons = [];
    items.forEach(function (item) {
      var btn = FF.el("button", {
        class: "segmented__item", type: "button", "aria-pressed": value === item.id ? "true" : "false", text: item.label,
        onClick: function () {
          buttons.forEach(function (b) { b.el.setAttribute("aria-pressed", b.id === item.id ? "true" : "false"); });
          onChange(item.id);
        },
      });
      buttons.push({ id: item.id, el: btn });
      wrap.appendChild(btn);
    });
    return wrap;
  }

  function field(labelText, hintText, control) {
    var wrap = FF.el("div", { class: "field" }, [FF.el("label", { class: "field__label", text: labelText })]);
    wrap.appendChild(control);
    if (hintText) wrap.appendChild(FF.el("div", { class: "field__hint", text: hintText }));
    return wrap;
  }

  /* ------------------------------------------------------------------ Steps */
  /* Each step: { group, kicker, question, hint, build(container, draft, refresh) } */

  var STEPS = [
    {
      group: 0, kicker: "Welcome", question: "How this works",
      hint: "Four quick things before we start.",
      build: function (root) {
        var items = [
          { icon: "list", title: "A few quick questions", desc: "About you, your equipment, your kitchen, and your schedule — mostly just tapping, a couple of minutes." },
          { icon: "dumbbell", title: "We build your plan", desc: "A workout split and a weekly meal plan, generated specifically from what you tell us — not a generic template." },
          { icon: "chart", title: "Track as you go", desc: "Log your sets and meals from Workout and Nutrition. Everything stays on this device — nothing is sent anywhere." },
          { icon: "sliders", title: "Change anything, anytime", desc: "Studio lets you edit the plan, swap exercises or meals, override targets, and more. Nothing here is final." },
        ];
        var list = FF.el("div", { class: "stack g-5" });
        items.forEach(function (item, i) {
          list.appendChild(FF.el("div", { class: "row g-4", style: { alignItems: "flex-start" } }, [
            FF.el("span", { class: "option__icon", html: FF.icon(item.icon, { size: 18 }) }),
            FF.el("div", {}, [
              FF.el("div", { class: "option__title", text: (i + 1) + ". " + item.title }),
              FF.el("div", { class: "option__desc", text: item.desc }),
            ]),
          ]));
        });
        root.appendChild(list);
      },
    },
    {
      group: 0, kicker: "Welcome", question: "What should we call you?",
      hint: "Just for your dashboard greeting — nothing is sent anywhere.",
      build: function (root, draft) {
        var input = FF.el("input", { class: "input", type: "text", placeholder: "Your name", value: draft.profile.name, maxlength: 30, autofocus: true });
        input.addEventListener("input", function () { draft.profile.name = input.value; });
        root.appendChild(field("Name", null, input));
      },
    },
    {
      group: 0, kicker: "About you", question: "The basics",
      hint: "This drives your calorie and macro math — accuracy here matters more than anywhere else.",
      build: function (root, draft, rerender) {
        var g = FF.el("div", { class: "ob__group" });
        g.appendChild(field("Sex", "Used for the BMR formula.", segmented(
          [{ id: "male", label: "Male" }, { id: "female", label: "Female" }, { id: "other", label: "Other" }],
          draft.profile.sex, function (v) { draft.profile.sex = v; }
        )));
        root.appendChild(g);

        var g2 = FF.el("div", { class: "ob__group grid grid--2" });
        g2.appendChild(field("Age", null, stepperField(draft.profile.age, 13, 90, 1, "", function (v) { draft.profile.age = v; })));
        g2.appendChild(field("Units", null, segmented(
          [{ id: "metric", label: "Metric" }, { id: "imperial", label: "Imperial" }],
          draft.profile.units,
          /* Height/weight are always stored in cm/kg — switching units only
             changes how they're displayed, so re-render this step to convert
             the shown values and swap the "cm"/"kg" labels for "in"/"lb". */
          function (v) { draft.profile.units = v; rerender(); }
        )));
        root.appendChild(g2);

        var imperial = draft.profile.units === "imperial";

        var g3 = FF.el("div", { class: "ob__group grid grid--2" });
        var heightRow;
        if (imperial) {
          /* Most imperial users think in feet+inches (5'10"), not raw total
             inches — a single "70" field is real friction at onboarding. */
          var totalIn = FF.calc.cmToIn(draft.profile.heightCm);
          var feetVal = Math.floor(totalIn / 12);
          var inVal = Math.round(totalIn - feetVal * 12);
          if (inVal === 12) { feetVal += 1; inVal = 0; }

          var feetInput = FF.el("input", { class: "input", type: "number", value: feetVal, style: { maxWidth: "64px", textAlign: "center" } });
          var inchInput = FF.el("input", { class: "input", type: "number", value: inVal, style: { maxWidth: "64px", textAlign: "center" } });
          function commitFeetInches() {
            var f = +feetInput.value || 0;
            var i = +inchInput.value || 0;
            draft.profile.heightCm = FF.calc.inToCm(f * 12 + i);
          }
          feetInput.addEventListener("input", commitFeetInches);
          inchInput.addEventListener("input", commitFeetInches);

          heightRow = FF.el("div", { class: "input-group" }, [
            feetInput, FF.el("span", { class: "input-suffix", text: "ft" }),
            inchInput, FF.el("span", { class: "input-suffix", text: "in" }),
          ]);
        } else {
          var heightInput = FF.el("input", { class: "input", type: "number", value: Math.round(draft.profile.heightCm) });
          heightInput.addEventListener("input", function () {
            var v = +heightInput.value;
            if (!v) return;
            draft.profile.heightCm = v;
          });
          heightRow = FF.el("div", { class: "input-group" }, [heightInput, FF.el("span", { class: "input-suffix", text: "cm" })]);
        }
        g3.appendChild(field("Height", null, heightRow));

        var weightRow = FF.el("div", { class: "input-group" });
        var weightVal = imperial ? Math.round(FF.calc.kgToLb(draft.profile.weightKg) * 10) / 10 : Math.round(draft.profile.weightKg * 10) / 10;
        var weightInput = FF.el("input", { class: "input", type: "number", step: "0.1", value: weightVal });
        weightInput.addEventListener("input", function () {
          var v = +weightInput.value;
          if (!v) return;
          draft.profile.weightKg = imperial ? FF.calc.lbToKg(v) : v;
        });
        weightRow.appendChild(weightInput);
        weightRow.appendChild(FF.el("span", { class: "input-suffix", text: imperial ? "lb" : "kg" }));
        g3.appendChild(field("Weight", null, weightRow));
        root.appendChild(g3);
      },
    },
    {
      group: 0, kicker: "About you", question: "What's the main goal?",
      hint: "You can change this any time from the Studio.",
      build: function (root, draft) {
        var items = Object.keys(FF.calc.GOALS).map(function (k) {
          return { id: k, title: FF.calc.GOALS[k].label, icon: k === "fatloss" ? "flame" : k === "muscle" ? "dumbbell" : k === "strength" ? "zap" : k === "endurance" ? "heart" : "target" };
        });
        root.appendChild(optionGrid(items, draft.profile.goal, 2, function (id) { draft.profile.goal = id; refreshOptions(root); }));
      },
    },
    {
      group: 0, kicker: "About you", question: "How aggressive should the pace be?",
      hint: "Faster isn't better — a sustainable pace beats a stalled one.",
      build: function (root, draft) {
        var items = [
          { id: "easy", title: "Gentle", desc: "Small, comfortable weekly change" },
          { id: "steady", title: "Steady", desc: "The recommended default" },
          { id: "aggressive", title: "Aggressive", desc: "Faster results, harder to sustain" },
        ];
        root.appendChild(optionGrid(items, draft.profile.pace, 3, function (id) { draft.profile.pace = id; refreshOptions(root); }));
      },
    },
    {
      group: 0, kicker: "About you", question: "Training experience?",
      hint: "Decides how much variety and load your plan starts with.",
      build: function (root, draft) {
        var items = [
          { id: "beginner", title: "Beginner", desc: "New, or back after a long break" },
          { id: "intermediate", title: "Intermediate", desc: "Training consistently, 6+ months" },
          { id: "advanced", title: "Advanced", desc: "Years of structured training" },
        ];
        root.appendChild(optionGrid(items, draft.profile.experience, 3, function (id) { draft.profile.experience = id; refreshOptions(root); }));
      },
    },
    {
      group: 1, kicker: "Training", question: "How active is daily life, outside workouts?",
      hint: null,
      build: function (root, draft) {
        var items = Object.keys(FF.calc.ACTIVITY).map(function (k) {
          var a = FF.calc.ACTIVITY[k];
          return { id: k, title: a.label, desc: a.desc };
        });
        root.appendChild(optionGrid(items, draft.profile.activity, 2, function (id) { draft.profile.activity = id; refreshOptions(root); }));
      },
    },
    {
      group: 1, kicker: "Training", question: "What's your job like day to day?",
      hint: null,
      build: function (root, draft) {
        var items = [
          { id: "desk", title: "Desk job", desc: "Mostly sitting" },
          { id: "mixed", title: "Mixed", desc: "On and off your feet" },
          { id: "active", title: "Active", desc: "On your feet most of the day" },
          { id: "shift", title: "Shift work", desc: "Irregular hours" },
        ];
        root.appendChild(optionGrid(items, draft.profile.job, 2, function (id) { draft.profile.job = id; refreshOptions(root); }));
      },
    },
    {
      group: 1, kicker: "Training", question: "Sleep and stress",
      hint: "Both affect recovery capacity and your daily calorie burn.",
      build: function (root, draft) {
        var g = FF.el("div", { class: "ob__group" });
        g.appendChild(field("Average sleep (hours/night)", null, stepperField(draft.profile.sleep, 4, 10, 0.5, "h", function (v) { draft.profile.sleep = v; })));
        root.appendChild(g);
        var g2 = FF.el("div", { class: "ob__group" });
        g2.appendChild(field("Typical stress level", null, segmented(
          [{ id: "low", label: "Low" }, { id: "medium", label: "Medium" }, { id: "high", label: "High" }],
          draft.profile.stress, function (v) { draft.profile.stress = v; }
        )));
        root.appendChild(g2);
      },
    },
    {
      group: 1, kicker: "Training", question: "Set your training schedule",
      hint: "Session length shapes how many exercises fit in each workout.",
      build: function (root, draft) {
        var g = FF.el("div", { class: "ob__group grid grid--2" });
        g.appendChild(field("Days per week", null, stepperField(draft.profile.daysPerWeek, 2, 6, 1, "", function (v) { draft.profile.daysPerWeek = v; })));
        g.appendChild(field("Minutes per session", null, stepperField(draft.profile.sessionMins, 20, 120, 5, "m", function (v) { draft.profile.sessionMins = v; })));
        root.appendChild(g);
        var g2 = FF.el("div", { class: "ob__group" });
        g2.appendChild(field("Usual training time", null, segmented(
          [{ id: "morning", label: "Morning" }, { id: "midday", label: "Midday" }, { id: "evening", label: "Evening" }, { id: "varies", label: "Varies" }],
          draft.profile.trainingTime, function (v) { draft.profile.trainingTime = v; }
        )));
        root.appendChild(g2);
      },
    },
    {
      group: 1, kicker: "Training", question: "How do you want your week structured?",
      hint: "\"Auto\" picks the best fit for your days/week and experience — a solid default if you're not sure.",
      build: function (root, draft) {
        var items = [
          { id: "auto", title: "Auto (recommended)", desc: "We'll choose based on your schedule and experience" },
          { id: "full_body", title: "Full Body", desc: "Every session hits the whole body" },
          { id: "upper_lower", title: "Upper / Lower", desc: "Alternate upper and lower body days" },
          { id: "ppl", title: "Push Pull Legs", desc: "Push, pull and leg days on rotation" },
          { id: "bro_split", title: "Body Part Split", desc: "One or two muscle groups per day" },
        ];
        root.appendChild(optionGrid(items, draft.profile.splitStyle || "auto", 2, function (id) { draft.profile.splitStyle = id; }));
      },
    },
    {
      group: 1, kicker: "Training", question: "Where do you train?",
      hint: null,
      build: function (root, draft) {
        var items = [
          { id: "gym", title: "Commercial gym", desc: "Full equipment access", icon: "layers" },
          { id: "home", title: "Home", desc: "I'll tell you what I have", icon: "home" },
          { id: "hybrid", title: "Both", desc: "Gym sometimes, home sometimes", icon: "swap" },
          { id: "outdoors", title: "Outdoors / bodyweight", desc: "No equipment at all", icon: "location" },
        ];
        root.appendChild(optionGrid(items, draft.profile.location, 2, function (id) { draft.profile.location = id; refreshOptions(root); }));
      },
    },
    {
      group: 1, kicker: "Training", question: "What equipment do you have at home?",
      hint: function (draft) {
        if (draft.profile.location === "hybrid") return "You already get full gym access automatically — this is only for extra equipment you also have at home.";
        if (draft.profile.location === "outdoors") return "Defaults to bodyweight-only exercises. Add anything below if you sometimes have access to it.";
        return "Your plan will only use what you select here.";
      },
      skip: function (draft) { return draft.profile.location === "gym"; },
      build: function (root, draft) {
        if (draft.profile.location === "hybrid") {
          root.appendChild(FF.el("div", { class: "card card--tint small section" }, [
            FF.el("strong", { text: "Gym equipment is already included. " }),
            FF.el("span", { text: "A commercial gym's full equipment set is assumed automatically — only pick items below if you also train at home and have them there." }),
          ]));
        } else if (draft.profile.location === "outdoors") {
          root.appendChild(FF.el("div", { class: "card card--tint small section" }, [
            FF.el("strong", { text: "Bodyweight only. " }), FF.el("span", { text: "Your plan will use no-equipment exercises exclusively. Add anything below if you sometimes have access to it." }),
          ]));
        }
        root.appendChild(chipGroup(HOME_EQUIPMENT, draft.profile.equipment, function (id) {
          toggleInArray(draft.profile.equipment, id);
        }));
      },
    },
    {
      group: 1, kicker: "Training", question: "Anything we should train around?",
      hint: "Pick any joints or areas that are currently sensitive — we'll avoid exercises that load them heavily. Leave blank if nothing applies.",
      optional: true,
      build: function (root, draft) {
        root.appendChild(chipGroup(INJURY_OPTIONS, draft.profile.injuries, function (id) {
          toggleInArray(draft.profile.injuries, id);
          refreshOptions(root);
        }));
      },
    },
    {
      group: 1, kicker: "Training", question: "Any priority areas?",
      hint: "Optional — we'll lean your accessory work toward these. Pick as many as you like.",
      optional: true,
      build: function (root, draft) {
        root.appendChild(chipGroup(FOCUS_OPTIONS, draft.profile.focus, function (id) {
          toggleInArray(draft.profile.focus, id);
          refreshOptions(root);
        }));
      },
    },
    {
      group: 1, kicker: "Training", question: "How much cardio do you want?",
      hint: null,
      build: function (root, draft) {
        var items = [
          { id: "none", title: "None", desc: "Strength sessions only" },
          { id: "some", title: "Some", desc: "A finisher when the goal calls for it" },
          { id: "lots", title: "Lots", desc: "Prioritise conditioning" },
        ];
        root.appendChild(optionGrid(items, draft.profile.cardio, 3, function (id) { draft.profile.cardio = id; refreshOptions(root); }));
      },
    },
    {
      group: 2, kicker: "Kitchen", question: "Any dietary pattern to follow?",
      hint: "Recipes that don't fit will be excluded entirely.",
      build: function (root, draft) {
        var items = Object.keys(FF.DIETS).map(function (k) { return { id: k, title: FF.DIETS[k].split(" — ")[0], desc: FF.DIETS[k].split(" — ")[1] }; });
        root.appendChild(optionGrid(items, draft.kitchen.diet, 2, function (id) { draft.kitchen.diet = id; }));
      },
    },
    {
      group: 2, kicker: "Kitchen", question: "Any religious dietary law to follow?",
      hint: "Independent of the pattern above — an omnivore or pescatarian can still need halal or kosher food, for example.",
      build: function (root, draft) {
        var items = Object.keys(FF.RELIGIOUS).map(function (k) { return { id: k, title: FF.RELIGIOUS[k].split(" — ")[0], desc: FF.RELIGIOUS[k].split(" — ")[1] }; });
        root.appendChild(optionGrid(items, draft.kitchen.religious, 3, function (id) { draft.kitchen.religious = id; }));
      },
    },
    {
      group: 2, kicker: "Kitchen", question: "Any allergies or foods to avoid?",
      hint: "We'll exclude recipes containing these entirely.",
      optional: true,
      build: function (root, draft) {
        var items = [
          { id: "dairy", label: "Dairy" }, { id: "egg", label: "Egg" }, { id: "gluten", label: "Gluten" },
          { id: "nuts", label: "Nuts" }, { id: "soy", label: "Soy" }, { id: "fish", label: "Fish" }, { id: "shellfish", label: "Shellfish" },
        ];
        root.appendChild(chipGroup(items, draft.kitchen.allergies, function (id) {
          toggleInArray(draft.kitchen.allergies, id);
          refreshOptions(root);
        }));
      },
    },
    {
      group: 2, kicker: "Kitchen", question: "How confident are you in the kitchen?",
      hint: "Higher skill unlocks more involved recipes.",
      build: function (root, draft) {
        var items = [
          { id: 0, title: "I don't cook", desc: "Assembly only — no stove needed" },
          { id: 1, title: "Basics", desc: "Simple stovetop meals" },
          { id: 2, title: "Confident", desc: "Comfortable with most recipes" },
          { id: 3, title: "Ambitious", desc: "Happy with anything" },
        ];
        root.appendChild(optionGrid(items, draft.kitchen.skill, 2, function (id) { draft.kitchen.skill = id; refreshOptions(root); }));
      },
    },
    {
      group: 2, kicker: "Kitchen", question: "What kitchen equipment do you have?",
      hint: null,
      build: function (root, draft) {
        root.appendChild(chipGroup(KITCHEN_EQUIPMENT, draft.kitchen.equip, function (id) {
          toggleInArray(draft.kitchen.equip, id);
          refreshOptions(root);
        }));
      },
    },
    {
      group: 2, kicker: "Kitchen", question: "Meals, time and cuisine",
      hint: null,
      build: function (root, draft) {
        var g = FF.el("div", { class: "ob__group grid grid--2" });
        g.appendChild(field("Meals per day", null, stepperField(draft.kitchen.mealsPerDay, 2, 5, 1, "", function (v) { draft.kitchen.mealsPerDay = v; })));
        g.appendChild(field("Snacks per day", null, stepperField(draft.kitchen.snacks, 0, 3, 1, "", function (v) { draft.kitchen.snacks = v; })));
        root.appendChild(g);
        var g2 = FF.el("div", { class: "ob__group" });
        g2.appendChild(field("Active cooking time you're OK with", null, stepperField(draft.kitchen.cookMins, 5, 60, 5, "m", function (v) { draft.kitchen.cookMins = v; })));
        root.appendChild(g2);
        var g3 = FF.el("div", { class: "ob__group" });
        g3.appendChild(field("Grocery budget", null, segmented(
          [{ id: 1, label: "Tight" }, { id: 2, label: "Normal" }, { id: 3, label: "Flexible" }],
          draft.kitchen.budget, function (v) { draft.kitchen.budget = v; }
        )));
        root.appendChild(g3);
        var g4 = FF.el("div", { class: "ob__group" });
        g4.appendChild(field("Cuisine preference", "Optional — leave blank for no preference.", chipGroup(CUISINE_OPTIONS, draft.kitchen.cuisines, function (id) {
          toggleInArray(draft.kitchen.cuisines, id);
          refreshOptions(root);
        })));
        root.appendChild(g4);
      },
    },
  ];

  /* optionGrid/chipGroup now update their own aria-pressed state on click,
     so nothing needs to happen here — kept as a no-op so existing call
     sites (harmless) don't need to be stripped out one by one. */
  function refreshOptions() {}

  /* ------------------------------------------------------------------ Wizard */

  function start() {
    var draft = { profile: FF.store.clone(FF.store.get().profile), kitchen: FF.store.clone(FF.store.get().kitchen) };
    var index = 0;

    var overlay = document.getElementById("ob-overlay");
    overlay.hidden = false;
    overlay.innerHTML = "";

    var barFill = FF.el("span", { style: { transform: "scaleX(0)" } });
    var bar = FF.el("div", { class: "ob__bar" }, [barFill]);

    var stepList = FF.el("div", { class: "ob__steps" });
    var kicker = FF.el("div", { class: "ob__kicker" });
    var question = FF.el("h1", { class: "ob__q" });
    var hint = FF.el("p", { class: "ob__hint" });
    var body = FF.el("div", { class: "ob__body" });

    var backBtn = FF.el("button", { class: "btn btn--ghost", type: "button" }, [
      FF.el("span", { html: FF.icon("arrow-left", { size: 16 }) }), FF.el("span", { text: "Back" }),
    ]);
    var skipBtn = FF.el("button", { class: "btn btn--ghost", type: "button", text: "Skip" });
    var nextBtn = FF.el("button", { class: "btn btn--primary btn--lg", type: "button" });

    /* render()'s own skip handling only ever walks forward (see below) — so
       landing on a skipped step by going *backward* (e.g. the equipment
       step, skipped when location is "gym") would immediately bounce right
       back forward to where we started, making Back silently do nothing.
       Not just a step-1 thing — it happened on whichever step sat right
       after any skipped one. Walk backward past skipped steps here instead
       of relying on render()'s forward-only logic. */
    backBtn.addEventListener("click", function () {
      if (index <= 0) return;
      var i = index - 1;
      while (i > 0 && STEPS[i].skip && STEPS[i].skip(draft)) i--;
      index = i;
      render();
    });
    skipBtn.addEventListener("click", function () { advance(); });
    nextBtn.addEventListener("click", function () { advance(); });

    /* Enter inside a text/number field advances the step, same as clicking
       Continue — none of the step inputs are wrapped in a <form>, so there
       was no native submit behavior to fall back on and Enter did nothing
       at all. Attached once on `body` (event delegation) so it keeps
       working across every re-render without needing to be wired into each
       step's own build() individually. Excludes textareas, where Enter
       should insert a newline instead. */
    body.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var tag = e.target.tagName;
      if (tag === "INPUT" || tag === "SELECT") {
        e.preventDefault();
        advance();
      }
    });

    function advance() {
      if (index < STEPS.length - 1) { index++; render(); }
      else finish(draft);
    }

    var foot = FF.el("div", { class: "ob__foot" }, [backBtn, FF.el("div", { class: "spacer" }), skipBtn, nextBtn]);

    var mobileHead = FF.el("div", { class: "ob__mobilehead" }, [
      FF.el("span", { class: "eyebrow" }, []),
    ]);
    var mobileKicker = mobileHead.firstChild;

    var content = FF.el("div", { class: "ob__content" }, [kicker, question, hint, body]);
    var main = FF.el("div", { class: "ob__main" }, [bar, mobileHead, content, foot]);

    var aside = FF.el("div", { class: "ob__aside" }, [
      FF.el("div", {}, [
        FF.el("div", { class: "brand", style: { padding: 0, marginBottom: "8px" } }, [
          FF.el("span", { class: "brand__mark", html: FF.icon("dumbbell", { size: 20 }) }),
          FF.el("span", { class: "brand__name", text: "FitForge" }),
        ]),
      ]),
      FF.el("div", {}, [
        FF.el("h2", { class: "ob__tagline", text: "A plan built around your actual life." }),
        FF.el("p", { class: "ob__blurb", text: "Not a generic template — your equipment, your kitchen, your schedule." }),
      ]),
      stepList,
    ]);

    overlay.appendChild(FF.el("div", { class: "ob" }, [aside, main]));

    function render() {
      var step = STEPS[index];
      if (step.skip && step.skip(draft)) {
        if (index < STEPS.length - 1) { index++; return render(); }
      }
      barFill.style.transform = "scaleX(" + ((index + 1) / STEPS.length) + ")";
      kicker.textContent = step.kicker;
      mobileKicker.textContent = "Step " + (index + 1) + " of " + STEPS.length + " · " + step.kicker;
      question.textContent = step.question;
      /* hint may be a plain string or a function(draft) -> string, for steps
         whose guidance depends on an earlier answer (e.g. equipment, which
         reads differently depending on where the user trains). */
      var hintText = typeof step.hint === "function" ? step.hint(draft) : step.hint;
      hint.textContent = hintText || "";
      hint.style.display = hintText ? "" : "none";
      body.innerHTML = "";
      step.build(body, draft, render);

      backBtn.disabled = index === 0;
      var isOptional = !!step.optional;
      skipBtn.style.display = isOptional ? "" : "none";
      nextBtn.innerHTML = "";
      nextBtn.appendChild(FF.el("span", { text: index === STEPS.length - 1 ? "Build my plan" : "Continue" }));
      if (index < STEPS.length - 1) nextBtn.appendChild(FF.el("span", { html: FF.icon("arrow-right", { size: 16 }) }));

      renderStepList(step);
    }

    function renderStepList(currentStep) {
      stepList.innerHTML = "";
      GROUPS.forEach(function (label, gi) {
        var state = "upcoming";
        if (gi < currentStep.group) state = "done";
        else if (gi === currentStep.group) state = "current";
        stepList.appendChild(FF.el("div", { class: "ob__stepitem", "data-state": state }, [
          FF.el("span", { class: "ob__dot", html: state === "done" ? FF.icon("check", { size: 11 }) : "" }),
          FF.el("span", { text: label }),
        ]));
      });
    }

    render();
  }

  function finish(draft) {
    var overlay = document.getElementById("ob-overlay");
    var btn = overlay.querySelector(".btn--primary");
    if (btn) { btn.classList.add("is-loading"); btn.disabled = true; }

    setTimeout(function () {
      FF.store.update(function (s) {
        s.profile = draft.profile;
        s.kitchen = draft.kitchen;
        s.targets = FF.calc.computeTargets(s);
        s.plan = FF.planner.generate(s);
        s.mealPlan = FF.mealplanner.generate(s);
        s.onboarded = true;
        s.createdAt = s.createdAt || new Date().toISOString();
      });

      overlay.hidden = true;
      overlay.innerHTML = "";
      if (FF.app && FF.app.boot) FF.app.boot();
      FF.toast("Your plan is ready — welcome to FitForge.", "ok");

      /* The onboarding intro (first step) explains the setup *questions*;
         this explains the *app itself* once there's actually an app to
         look at — a different kind of "confusing at first" that only shows
         up once you're using it, not while answering questions. */
      if (!FF.store.get().prefs.sawGuide) {
        setTimeout(function () {
          FF.store.patch("prefs", { sawGuide: true }, true);
          FF.showGuide();
        }, 700);
      }
    }, 420);
  }

  FF.onboarding = { start: start };
})();
