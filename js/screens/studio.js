/* ==========================================================================
   FitForge — Studio: edit the split, override macros, theme, data management.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var activeTab = "training"; // training | nutrition | coach | appearance | data

  var ACCENTS = [
    { id: "terracotta", label: "Terracotta", h: 16, s: 52, l: 51 },
    { id: "sage", label: "Sage", h: 162, s: 33, l: 37 },
    { id: "plum", label: "Plum", h: 328, s: 30, l: 42 },
    { id: "amber", label: "Amber", h: 38, s: 68, l: 44 },
    { id: "ocean", label: "Ocean", h: 199, s: 48, l: 37 },
    { id: "ember", label: "Ember", h: 4, s: 62, l: 49 },
  ];

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
  var ALLERGY_OPTIONS = [
    { id: "dairy", label: "Dairy" }, { id: "egg", label: "Egg" }, { id: "gluten", label: "Gluten" },
    { id: "nuts", label: "Nuts" }, { id: "soy", label: "Soy" }, { id: "fish", label: "Fish" }, { id: "shellfish", label: "Shellfish" },
  ];
  var HOME_EQUIPMENT = Object.keys(FF.EQUIPMENT).map(function (k) { return { id: k, label: FF.EQUIPMENT[k] }; });
  var KITCHEN_EQUIPMENT = Object.keys(FF.KITCHEN).map(function (k) { return { id: k, label: FF.KITCHEN[k] }; });
  var CUISINE_OPTIONS = Object.keys(FF.CUISINES).filter(function (k) { return k !== "general"; })
    .map(function (k) { return { id: k, label: FF.CUISINES[k] }; });

  function render(root) {
    var s = FF.store.get();
    root.innerHTML = "";
    root.appendChild(FF.el("h1", { text: "Studio", class: "section" }));

    var tabs = FF.el("div", { class: "studio-nav" });
    [["training", "Training"], ["nutrition", "Nutrition"], ["coach", "AI Coach"], ["appearance", "Appearance"], ["data", "Data"]].forEach(function (t) {
      tabs.appendChild(FF.el("button", {
        class: "chip", type: "button", "aria-pressed": activeTab === t[0] ? "true" : "false", text: t[1],
        onClick: function () { activeTab = t[0]; render(root); },
      }));
    });
    root.appendChild(tabs);

    var body = FF.el("div", {});
    if (activeTab === "training") renderTraining(body, s);
    else if (activeTab === "nutrition") renderNutrition(body, s);
    else if (activeTab === "coach") renderCoach(body, s);
    else if (activeTab === "appearance") renderAppearance(body, s);
    else renderData(body, s);
    root.appendChild(body);

    /* Always last, on every tab — not tied to Data specifically. */
    root.appendChild(aboutCard());
  }

  function aboutCard() {
    /* marginTop set directly here rather than relying on whatever tab
       content precedes it having a "section" class — the last element on
       each tab is inconsistent about that, and this card needs its own
       spacing regardless of which tab it's trailing. */
    var card = FF.el("div", { class: "card", style: { marginTop: "var(--s-6)" } });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "About FitForge" })]));
    card.appendChild(FF.el("p", { class: "small muted", text: "A personal gym and diet planner, built around real equipment, real kitchens and real schedules — not a generic template. Everything lives only in this browser; nothing is sent anywhere without your say-so." }));
    card.appendChild(FF.el("p", { class: "small muted", text: "Built by K. M. Zawad Monsur.", style: { marginTop: "10px" } }));
    card.appendChild(FF.el("p", { class: "small", style: { marginTop: "14px", fontStyle: "italic", color: "var(--accent-text)" } }, [
      FF.el("span", { html: FF.icon("heart", { size: 13 }), style: { marginRight: "6px", verticalAlign: "-2px" } }),
      FF.el("span", { text: "This app is dedicated to my wife, Mumtaheena Binte Ahmed (Raisa)." }),
    ]));
    card.appendChild(FF.el("p", { class: "small muted", style: { marginTop: "14px" } }, [
      FF.el("span", { text: "Found a bug? Email " }),
      FF.el("a", { href: "mailto:zawadmonsur1@gmail.com", text: "zawadmonsur1@gmail.com" }),
    ]));
    return card;
  }

  /* ------------------------------------------------------------- Training */

  function renderTraining(root, s) {
    root.appendChild(profileScheduleCard(s));

    if (!s.plan) {
      root.appendChild(FF.el("div", { class: "empty" }, [
        FF.el("div", { class: "empty__title", text: "No plan yet" }),
        FF.el("button", { class: "btn btn--primary", text: "Generate a plan", onClick: function () { FF.store.update(function (st) { st.plan = FF.planner.generate(st); }); render(root.parentElement); } }),
      ]));
      return;
    }

    var head = FF.el("div", { class: "card card--tint section" }, [
      FF.el("div", { class: "row between wrap g-3" }, [
        FF.el("div", {}, [
          FF.el("strong", { text: s.plan.name }),
          FF.el("div", { class: "small muted", text: s.plan.note }),
        ]),
        FF.el("button", { class: "btn btn--soft btn--sm", html: FF.icon("refresh", { size: 14 }) + "<span>Regenerate whole plan</span>", onClick: regenerateWholePlan }),
      ]),
    ]);
    root.appendChild(head);

    s.plan.days.forEach(function (day) {
      root.appendChild(dayEditor(day, s));
    });
  }

  function dayEditor(day, s) {
    var wrap = FF.el("div", { class: "split-day" });
    wrap.appendChild(FF.el("div", { class: "split-day__head" }, [
      FF.el("span", { class: "split-day__title", text: day.name }),
      FF.el("span", { class: "spacer" }),
      FF.el("button", { class: "btn btn--ghost btn--sm", html: FF.icon("plus", { size: 14 }) + "<span>Add exercise</span>", onClick: function () { openAddExercise(day); } }),
    ]));

    day.exercises.forEach(function (item, idx) {
      var ex = FF.EX_BY_ID[item.exId];
      if (!ex) return;
      wrap.appendChild(FF.el("div", { class: "reorder-row" }, [
        FF.el("span", { html: FF.icon("grip", { size: 15 }), class: "dim reorder-row__handle", "aria-label": "Drag to reorder", role: "button", tabindex: "0" }),
        FF.el("div", { class: "grow" }, [
          FF.el("div", { class: "reorder-row__name", text: ex.name }),
          FF.el("div", { class: "reorder-row__meta", text: item.sets + " × " + item.reps + " · rest " + item.restSec + "s" }),
        ]),
        FF.el("div", { class: "reorder-row__tools" }, [
          FF.el("button", { class: "btn btn--ghost btn--icon btn--sm", "aria-label": "Move up", html: FF.icon("chevron-left", { size: 15, class: "rot90" }), disabled: idx === 0, onClick: function () { moveExercise(day, idx, -1); } }),
          FF.el("button", { class: "btn btn--ghost btn--icon btn--sm", "aria-label": "Move down", html: FF.icon("chevron-right", { size: 15, class: "rot90" }), disabled: idx === day.exercises.length - 1, onClick: function () { moveExercise(day, idx, 1); } }),
          FF.el("button", { class: "btn btn--ghost btn--icon btn--sm", "aria-label": "Remove", html: FF.icon("trash", { size: 15 }), onClick: function () { removeExercise(day, idx); } }),
        ]),
      ]));
    });

    if (!day.exercises.length) {
      wrap.appendChild(FF.el("div", { class: "empty tiny", style: { padding: "24px" } }, [FF.el("span", { class: "dim", text: "No exercises — add one above." })]));
    } else {
      attachDragReorder(wrap, day);
    }
    return wrap;
  }

  /* Pointer-based drag reordering (not native HTML5 drag-and-drop, which
     has poor/inconsistent touch support) — works with mouse and touch alike
     via the Pointer Events API. Only the grip handle initiates a drag; the
     rest of the row stays a normal click target for its buttons. The
     up/down arrow buttons stay too, as a keyboard/precision-friendly
     alternative to dragging, not a replacement for it. */
  function attachDragReorder(wrap, day) {
    var GAP = 8; // matches --s-2, the CSS gap between .reorder-row siblings

    wrap.querySelectorAll(".reorder-row__handle").forEach(function (handle) {
      handle.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();

        var row = handle.closest(".reorder-row");
        var rows = Array.prototype.slice.call(wrap.querySelectorAll(".reorder-row"));
        var startIndex = rows.indexOf(row);
        var currentIndex = startIndex;
        var startY = e.clientY;
        var rowHeight = row.getBoundingClientRect().height + GAP;

        try { row.setPointerCapture(e.pointerId); } catch (err) { /* not fatal — drag still tracks via listeners below */ }
        row.classList.add("is-dragging");

        function onMove(ev) {
          var dy = ev.clientY - startY;
          row.style.transform = "translateY(" + dy + "px)";

          var shift = Math.round(dy / rowHeight);
          var newIndex = FF.calc.clamp(startIndex + shift, 0, rows.length - 1);
          if (newIndex !== currentIndex) {
            rows.forEach(function (r, idx) {
              if (r === row) return;
              var displaced = newIndex > currentIndex ? (idx > currentIndex && idx <= newIndex) : (idx >= newIndex && idx < currentIndex);
              r.style.transition = "transform 160ms ease";
              r.style.transform = displaced ? "translateY(" + (newIndex > currentIndex ? -rowHeight : rowHeight) + "px)" : "";
            });
            currentIndex = newIndex;
          }
        }

        function onUp(ev) {
          try { row.releasePointerCapture(ev.pointerId); } catch (err) { /* ignore — see setPointerCapture above */ }
          row.removeEventListener("pointermove", onMove);
          row.removeEventListener("pointerup", onUp);
          row.removeEventListener("pointercancel", onUp);
          row.classList.remove("is-dragging");
          rows.forEach(function (r) { r.style.transform = ""; r.style.transition = ""; });

          if (currentIndex !== startIndex) {
            FF.store.update(function (s) {
              var d = s.plan.days.filter(function (x) { return x.id === day.id; })[0];
              var moved = d.exercises.splice(startIndex, 1)[0];
              d.exercises.splice(currentIndex, 0, moved);
            });
          }
          FF.app.render();
        }

        row.addEventListener("pointermove", onMove);
        row.addEventListener("pointerup", onUp);
        row.addEventListener("pointercancel", onUp);
      });
    });
  }

  function moveExercise(day, idx, dir) {
    var target = idx + dir;
    FF.store.update(function (s) {
      var d = s.plan.days.filter(function (x) { return x.id === day.id; })[0];
      var tmp = d.exercises[idx];
      d.exercises[idx] = d.exercises[target];
      d.exercises[target] = tmp;
    });
    FF.app.render();
  }

  function removeExercise(day, idx) {
    FF.store.update(function (s) {
      var d = s.plan.days.filter(function (x) { return x.id === day.id; })[0];
      d.exercises.splice(idx, 1);
    });
    FF.app.render();
  }

  function openAddExercise(day) {
    var s = FF.store.get();
    var pool = FF.planner.eligible(s.profile);
    var search = FF.el("input", { class: "input", type: "text", placeholder: "Search exercises…", autofocus: true });
    var results = FF.el("div", { class: "stack g-2", style: { maxHeight: "320px", overflowY: "auto", marginTop: "12px" } });

    function renderResults(q) {
      results.innerHTML = "";
      var matches = pool.filter(function (ex) { return ex.name.toLowerCase().indexOf(q.toLowerCase()) !== -1; }).slice(0, 30);
      matches.forEach(function (ex) {
        results.appendChild(FF.el("button", {
          class: "lib-item", type: "button",
          onClick: function () {
            FF.store.update(function (state) {
              var d = state.plan.days.filter(function (x) { return x.id === day.id; })[0];
              var rx = FF.planner.prescribe(ex, state.profile.goal);
              d.exercises.push({ exId: ex.id, sets: rx.sets, reps: rx.reps, restSec: rx.restSec });
            });
            FF.closeModal();
            FF.toast(ex.name + " added.", "ok");
            FF.app.render();
          },
        }, [
          FF.el("div", { class: "grow" }, [
            FF.el("div", { class: "lib-item__name", text: ex.name }),
            FF.el("div", { class: "lib-item__meta", text: FF.MUSCLES[ex.primary] + " · " + FF.PATTERNS[ex.pattern] }),
          ]),
        ]));
      });
    }
    search.addEventListener("input", function () { renderResults(search.value); });
    renderResults("");
    FF.modal({ title: "Add exercise to " + day.name, body: FF.el("div", {}, [search, results]), wide: true });
  }

  /* All the "changeable, decided-later" profile fields from onboarding,
     editable in place. Selects/number fields commit + re-render immediately;
     chip toggles update their own visual state and just persist, so
     multi-selecting several items in a row doesn't re-render the whole tab
     on every click. None of this retroactively edits the already-generated
     plan — the "Regenerate whole plan" button above applies it. */
  function profileScheduleCard(s) {
    var card = FF.el("div", { class: "card section" });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Profile & schedule" })]));
    card.appendChild(FF.el("p", { class: "small muted", text: "Changes apply next time you regenerate the plan or a single day, below." }));

    function patchProfile(values) { FF.store.patch("profile", values); FF.app.render(); }

    var grid = FF.el("div", { class: "grid grid--2", style: { marginTop: "14px" } });
    grid.appendChild(field("Goal", null, selectControl(
      Object.keys(FF.calc.GOALS).map(function (k) { return { id: k, label: FF.calc.GOALS[k].label }; }),
      s.profile.goal, function (v) { patchProfile({ goal: v }); }
    )));
    grid.appendChild(field("Pace", null, selectControl([
      { id: "easy", label: "Gentle" }, { id: "steady", label: "Steady" }, { id: "aggressive", label: "Aggressive" },
    ], s.profile.pace, function (v) { patchProfile({ pace: v }); })));
    grid.appendChild(field("Experience", null, selectControl([
      { id: "beginner", label: "Beginner" }, { id: "intermediate", label: "Intermediate" }, { id: "advanced", label: "Advanced" },
    ], s.profile.experience, function (v) { patchProfile({ experience: v }); })));
    grid.appendChild(field("Activity level", null, selectControl(
      Object.keys(FF.calc.ACTIVITY).map(function (k) { return { id: k, label: FF.calc.ACTIVITY[k].label }; }),
      s.profile.activity, function (v) { patchProfile({ activity: v }); }
    )));
    grid.appendChild(numberField("Days per week", s.profile.daysPerWeek, function (v) { patchProfile({ daysPerWeek: FF.calc.clamp(v, 2, 6) }); }));
    grid.appendChild(numberField("Minutes per session", s.profile.sessionMins, function (v) { patchProfile({ sessionMins: FF.calc.clamp(v, 20, 120) }); }, "m"));
    grid.appendChild(field("Split style", "\"Auto\" picks the best fit for your days/week and experience.", selectControl([
      { id: "auto", label: "Auto (recommended)" },
      { id: "full_body", label: "Full Body" },
      { id: "upper_lower", label: "Upper / Lower" },
      { id: "ppl", label: "Push Pull Legs" },
      { id: "bro_split", label: "Body Part Split (bro split)" },
    ], s.profile.splitStyle || "auto", function (v) { patchProfile({ splitStyle: v }); })));
    grid.appendChild(field("Where you train", null, selectControl([
      { id: "gym", label: "Commercial gym" }, { id: "home", label: "Home" }, { id: "hybrid", label: "Both" }, { id: "outdoors", label: "Outdoors / bodyweight" },
    ], s.profile.location, function (v) { patchProfile({ location: v }); })));
    grid.appendChild(field("Cardio preference", null, selectControl([
      { id: "none", label: "None" }, { id: "some", label: "Some" }, { id: "lots", label: "Lots" },
    ], s.profile.cardio, function (v) { patchProfile({ cardio: v }); })));
    card.appendChild(grid);

    card.appendChild(field("Equipment you have at home", "A commercial gym's full equipment is always included automatically when you train there.",
      chipGroupLive(HOME_EQUIPMENT, s.profile.equipment, function (id) { toggleInArray(s.profile.equipment, id); FF.store.save(); })));

    card.appendChild(field("Areas to train around", "We'll avoid exercises that load these heavily.",
      chipGroupLive(INJURY_OPTIONS, s.profile.injuries, function (id) { toggleInArray(s.profile.injuries, id); FF.store.save(); })));

    card.appendChild(field("Priority areas", "Optional — biases accessory exercise selection toward these.",
      chipGroupLive(FOCUS_OPTIONS, s.profile.focus, function (id) { toggleInArray(s.profile.focus, id); FF.store.save(); })));

    return card;
  }

  function regenerateWholePlan() {
    FF.confirm({
      title: "Regenerate the whole plan?",
      message: "All manual edits to your split will be replaced with a freshly generated plan from your onboarding answers.",
      confirmLabel: "Regenerate",
      onConfirm: function () {
        FF.store.update(function (s) { s.plan = FF.planner.generate(s); });
        FF.toast("Plan regenerated.", "ok");
        FF.app.render();
      },
    });
  }

  /* ------------------------------------------------------------- Nutrition */

  function renderNutrition(root, s) {
    var card = FF.el("div", { class: "card section" });
    card.appendChild(FF.el("div", { class: "card__head" }, [
      FF.el("span", { class: "card__title", text: "Calorie & macro targets" }),
      switchControl(s.targets.custom, function (v) {
        FF.store.update(function (state) { state.targets.custom = v; if (!v) state.targets = Object.assign(FF.calc.computeTargets(state), { custom: false }); });
        FF.app.render();
      }, "Custom"),
    ]));

    if (!s.targets.custom) {
      card.appendChild(FF.el("p", { class: "small muted", text: "Targets are calculated automatically from your profile. Toggle Custom to fine-tune them by hand." }));
      card.appendChild(kv([
        ["BMR", FF.fmtNum(s.targets.bmr) + " kcal"],
        ["TDEE", FF.fmtNum(s.targets.tdee) + " kcal"],
        ["Target", FF.fmtNum(s.targets.kcal) + " kcal"],
        ["Protein", s.targets.protein + " g"],
        ["Carbs", s.targets.carbs + " g"],
        ["Fat", s.targets.fat + " g"],
      ]));
    } else {
      ["kcal", "protein", "carbs", "fat"].forEach(function (key) {
        var input = FF.el("input", { class: "input", type: "number", value: s.targets[key] });
        input.addEventListener("change", function () {
          FF.store.update(function (state) { state.targets[key] = +input.value || 0; });
        });
        card.appendChild(field(key === "kcal" ? "Calories" : capitalize(key) + " (g)", null, input));
      });
    }
    root.appendChild(card);

    var kitchenCard = FF.el("div", { class: "card section" });
    kitchenCard.appendChild(FF.el("div", { class: "card__head" }, [
      FF.el("span", { class: "card__title", text: "Kitchen settings" }),
      FF.el("button", { class: "btn btn--soft btn--sm", html: FF.icon("refresh", { size: 14 }) + "<span>Regenerate meals</span>", onClick: function () { FF.store.update(function (st) { st.mealPlan = FF.mealplanner.generate(st); }); FF.toast("Meal plan regenerated.", "ok"); FF.app.render(); } }),
    ]));
    function patchKitchen(values) { FF.store.patch("kitchen", values); FF.app.render(); }

    var dietGrid = FF.el("div", { class: "grid grid--2" });
    dietGrid.appendChild(field("Diet", "Recipes that don't fit are excluded entirely.", selectControl(Object.keys(FF.DIETS).map(function (k) { return { id: k, label: FF.DIETS[k].split(" — ")[0] }; }), s.kitchen.diet, function (v) {
      patchKitchen({ diet: v });
    })));
    dietGrid.appendChild(field("Religious dietary law", "Independent of diet — applies on top of it.", selectControl(Object.keys(FF.RELIGIOUS).map(function (k) { return { id: k, label: FF.RELIGIOUS[k].split(" — ")[0] }; }), s.kitchen.religious || "none", function (v) {
      patchKitchen({ religious: v });
    })));
    kitchenCard.appendChild(dietGrid);

    var grid = FF.el("div", { class: "grid grid--2", style: { marginTop: "4px" } });
    grid.appendChild(field("Cooking skill", null, selectControl([
      { id: 0, label: "I don't cook" }, { id: 1, label: "Basics" }, { id: 2, label: "Confident" }, { id: 3, label: "Ambitious" },
    ], s.kitchen.skill, function (v) { patchKitchen({ skill: +v }); })));
    grid.appendChild(field("Grocery budget", null, selectControl([
      { id: 1, label: "Tight" }, { id: 2, label: "Normal" }, { id: 3, label: "Flexible" },
    ], s.kitchen.budget, function (v) { patchKitchen({ budget: +v }); })));
    grid.appendChild(numberField("Meals per day", s.kitchen.mealsPerDay, function (v) { patchKitchen({ mealsPerDay: FF.calc.clamp(v, 2, 5) }); }));
    grid.appendChild(numberField("Snacks per day", s.kitchen.snacks, function (v) { patchKitchen({ snacks: FF.calc.clamp(v, 0, 3) }); }));
    grid.appendChild(numberField("Cooking time you're OK with", s.kitchen.cookMins, function (v) { patchKitchen({ cookMins: FF.calc.clamp(v, 5, 60) }); }, "m"));
    kitchenCard.appendChild(grid);

    kitchenCard.appendChild(field("Allergies / foods to avoid", "Recipes containing these are excluded entirely.",
      chipGroupLive(ALLERGY_OPTIONS, s.kitchen.allergies, function (id) { toggleInArray(s.kitchen.allergies, id); FF.store.save(); })));

    kitchenCard.appendChild(field("Kitchen equipment", null,
      chipGroupLive(KITCHEN_EQUIPMENT, s.kitchen.equip, function (id) { toggleInArray(s.kitchen.equip, id); FF.store.save(); })));

    kitchenCard.appendChild(field("Cuisine preference", "Leave blank for no preference.",
      chipGroupLive(CUISINE_OPTIONS, s.kitchen.cuisines, function (id) { toggleInArray(s.kitchen.cuisines, id); FF.store.save(); })));

    root.appendChild(kitchenCard);
    root.appendChild(pantryCard(s));
    root.appendChild(dislikesCard(s));
  }

  function pantryCard(s) {
    var card = FF.el("div", { class: "card section" });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "What's in your fridge right now" })]));
    card.appendChild(FF.el("p", { class: "small muted", text: "Add what you actually have on hand — meal suggestions favor recipes that use it, without ruling everything else out." }));

    var chips = FF.el("div", { class: "chips", style: { marginTop: "10px" } });
    (s.kitchen.pantry || []).forEach(function (item, idx) {
      var chip = FF.el("button", { class: "chip", type: "button", "aria-pressed": "true", "aria-label": "Remove " + item }, [
        FF.el("span", { class: "chip__check", html: FF.icon("check", { size: 14 }) }),
        FF.el("span", { text: item }),
        FF.el("span", { html: FF.icon("x", { size: 12 }), style: { marginLeft: "2px", opacity: "0.6" } }),
      ]);
      chip.addEventListener("click", function () {
        FF.store.update(function (state) { state.kitchen.pantry.splice(idx, 1); });
        FF.app.render();
      });
      chips.appendChild(chip);
    });
    if (!s.kitchen.pantry || !s.kitchen.pantry.length) {
      chips.appendChild(FF.el("span", { class: "dim small", text: "Nothing added yet." }));
    }
    card.appendChild(chips);

    var input = FF.el("input", { class: "input", type: "text", placeholder: "e.g. chicken breast, onion, cumin…", style: { marginTop: "12px" } });
    function addItem() {
      var v = input.value.trim();
      if (!v) return;
      FF.store.update(function (state) {
        state.kitchen.pantry = state.kitchen.pantry || [];
        if (state.kitchen.pantry.indexOf(v) === -1) state.kitchen.pantry.push(v);
      });
      input.value = "";
      FF.app.render();
    }
    var addBtn = FF.el("button", { class: "btn btn--soft btn--sm", type: "button", text: "Add", onClick: addItem });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addItem(); } });
    card.appendChild(FF.el("div", { class: "row g-2", style: { marginTop: "10px" } }, [input, addBtn]));

    return card;
  }

  function dislikesCard(s) {
    var card = FF.el("div", { class: "card" });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Recipes you've ruled out" })]));
    var ids = s.kitchen.dislikes || [];
    if (!ids.length) {
      card.appendChild(FF.el("div", { class: "empty tiny", style: { padding: "20px" } }, [
        FF.el("span", { class: "dim small", text: "None yet — use “Don't suggest again” on any meal in Nutrition to rule it out for good." }),
      ]));
      return card;
    }
    var list = FF.el("div", { class: "list" });
    ids.forEach(function (id) {
      var r = FF.RECIPE_BY_ID[id];
      if (!r) return;
      list.appendChild(FF.el("div", { class: "list__item" }, [
        FF.el("span", { class: "grow list__title", text: r.name }),
        FF.el("button", {
          class: "btn btn--ghost btn--sm", type: "button", text: "Allow again",
          onClick: function () {
            FF.store.update(function (state) { state.kitchen.dislikes = state.kitchen.dislikes.filter(function (x) { return x !== id; }); });
            FF.toast(r.name + " can be suggested again.", "ok");
            FF.app.render();
          },
        }),
      ]));
    });
    card.appendChild(list);
    return card;
  }

  function toggleInArray(arr, id) {
    var i = arr.indexOf(id);
    if (i === -1) arr.push(id); else arr.splice(i, 1);
    return arr;
  }

  /* Multi-select chips that update their own aria-pressed on click instead
     of depending on a parent re-render — see the same fix in onboarding.js
     for why (selections used to silently not visualize). */
  function chipGroupLive(items, selectedArr, onToggle) {
    var wrap = FF.el("div", { class: "chips" });
    items.forEach(function (item) {
      var btn = FF.el("button", {
        class: "chip", type: "button",
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

  /* Commits on change (blur/enter), not on every keystroke, so typing a
     number doesn't trigger a full-tab re-render and steal focus mid-edit. */
  function numberField(labelText, value, onChange, suffix) {
    var input = FF.el("input", { class: "input", type: "number", value: value });
    input.addEventListener("change", function () {
      var v = +input.value;
      if (!isNaN(v) && v !== 0) onChange(v);
    });
    if (!suffix) return field(labelText, null, input);
    var row = FF.el("div", { class: "input-group" }, [input, FF.el("span", { class: "input-suffix", text: suffix })]);
    return field(labelText, null, row);
  }

  function selectControl(items, value, onChange) {
    var sel = FF.el("select", { class: "select" });
    items.forEach(function (item) {
      sel.appendChild(FF.el("option", { value: item.id, text: item.label, selected: item.id === value }));
    });
    sel.addEventListener("change", function () { onChange(sel.value); });
    return sel;
  }

  function switchControl(checked, onChange, label) {
    var track = FF.el("span", { class: "switch__track" }, [FF.el("span", { class: "switch__thumb" })]);
    var sw = FF.el("div", { class: "switch", role: "switch", "aria-checked": checked ? "true" : "false", tabindex: "0" }, [
      track, label ? FF.el("span", { class: "small", text: label }) : null,
    ]);
    sw.addEventListener("click", function () {
      var next = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", next ? "true" : "false");
      onChange(next);
    });
    return sw;
  }

  function kv(rows) {
    var dl = FF.el("dl", { class: "kv" });
    rows.forEach(function (r) {
      dl.appendChild(FF.el("dt", { text: r[0] }));
      dl.appendChild(FF.el("dd", { text: r[1] }));
    });
    return dl;
  }

  /* ----------------------------------------------------------- AI Coach */

  function renderCoach(root, s) {
    var card = FF.el("div", { class: "card section" });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "AI Coach" })]));
    card.appendChild(FF.el("p", { class: "small muted", text: "FitForge has no server, so this calls Groq's API directly from your browser using your own free key — nothing passes through us, because there's nothing to pass through. The key is stored only in this browser, kept separately from your backup export so it never leaks into a shared file." }));

    var keyInput = FF.el("input", { class: "input", type: "password", placeholder: "gsk_...", value: FF.store.getApiKey(), autocomplete: "off", style: { marginTop: "12px" } });
    card.appendChild(field("Groq API key", null, keyInput));

    card.appendChild(field("Model", null, selectControl(
      FF.ai.MODELS.map(function (m) { return { id: m.id, label: m.label }; }),
      FF.store.getAiModel(),
      function (v) { FF.store.setAiModel(v); }
    )));

    var saveBtn = FF.el("button", {
      class: "btn btn--primary btn--sm", type: "button", text: "Save key",
      onClick: function () {
        FF.store.setApiKey(keyInput.value.trim());
        FF.toast(keyInput.value.trim() ? "API key saved to this browser." : "API key cleared.", "ok");
        FF.app.render();
      },
    });
    var getKeyLink = FF.el("a", {
      class: "btn btn--ghost btn--sm", href: "https://console.groq.com/keys", target: "_blank", rel: "noopener noreferrer",
      text: "Get a free key ↗",
    });
    card.appendChild(FF.el("div", { class: "row g-3", style: { marginTop: "4px" } }, [saveBtn, getKeyLink]));
    root.appendChild(card);

    if (s.coach.messages.length) {
      var clearCard = FF.el("div", { class: "card" }, [
        FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Conversation" })]),
        FF.el("p", { class: "small muted", text: s.coach.messages.length + " messages stored in this browser." }),
        FF.el("button", {
          class: "btn btn--danger btn--sm", style: { marginTop: "8px" }, text: "Clear conversation",
          onClick: function () {
            FF.store.update(function (state) { state.coach.messages = []; });
            FF.toast("Conversation cleared.", "ok");
            FF.app.render();
          },
        }),
      ]);
      root.appendChild(clearCard);
    }
  }

  /* ------------------------------------------------------------ Appearance */

  function renderAppearance(root, s) {
    var themeCard = FF.el("div", { class: "card section" });
    themeCard.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Theme" })]));
    var seg = FF.el("div", { class: "segmented" });
    [["auto", "Auto", "monitor"], ["light", "Light", "sun"], ["dark", "Dark", "moon"]].forEach(function (t) {
      seg.appendChild(FF.el("button", {
        class: "segmented__item", type: "button", "aria-pressed": s.prefs.theme === t[0] ? "true" : "false",
        html: FF.icon(t[2], { size: 14 }) + "<span style='margin-left:6px'>" + t[1] + "</span>",
        onClick: function () { FF.store.patch("prefs", { theme: t[0] }); FF.app.applyPrefs(); render(root.parentElement); },
      }));
    });
    themeCard.appendChild(seg);
    root.appendChild(themeCard);

    var accentCard = FF.el("div", { class: "card section" });
    accentCard.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Accent color" })]));
    var swatches = FF.el("div", { class: "swatches" });
    ACCENTS.forEach(function (a) {
      var sw = FF.el("button", {
        class: "swatch", type: "button", "aria-pressed": s.prefs.accent === a.id ? "true" : "false", "aria-label": a.label,
        onClick: function () { FF.store.patch("prefs", { accent: a.id }); FF.app.applyPrefs(); render(root.parentElement); },
      }, [
        FF.el("span", { class: "swatch__fill", style: { background: "hsl(" + a.h + " " + a.s + "% " + a.l + "%)" } }),
        FF.el("span", { class: "swatch__name", text: a.label }),
      ]);
      swatches.appendChild(sw);
    });
    accentCard.appendChild(swatches);
    root.appendChild(accentCard);

    var densityCard = FF.el("div", { class: "card section" });
    densityCard.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Density" })]));
    var densitySeg = FF.el("div", { class: "segmented" });
    [["cozy", "Cozy"], ["compact", "Compact"]].forEach(function (d) {
      densitySeg.appendChild(FF.el("button", {
        class: "segmented__item", type: "button", "aria-pressed": s.prefs.density === d[0] ? "true" : "false", text: d[1],
        onClick: function () { FF.store.patch("prefs", { density: d[0] }); FF.app.applyPrefs(); render(root.parentElement); },
      }));
    });
    densityCard.appendChild(densitySeg);
    root.appendChild(densityCard);

    var restCard = FF.el("div", { class: "card section" });
    restCard.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Rest timer" })]));
    restCard.appendChild(FF.el("div", { class: "row between g-3" }, [
      FF.el("span", { class: "small muted", text: "Auto-start after logging a set" }),
      switchControl(s.prefs.restTimer, function (v) { FF.store.patch("prefs", { restTimer: v }); }),
    ]));
    root.appendChild(restCard);
  }

  /* ------------------------------------------------------------------ Data */

  function renderData(root, s) {

    var card = FF.el("div", { class: "card section" });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Backup" })]));
    card.appendChild(FF.el("p", { class: "small muted", text: "Everything lives only in this browser. Export a backup before clearing site data, or to move to another device." }));
    var row = FF.el("div", { class: "row g-3 wrap", style: { marginTop: "12px" } });
    row.appendChild(FF.el("button", { class: "btn btn--primary", html: FF.icon("download", { size: 15 }) + "<span>Export backup</span>", onClick: exportData }));

    var fileInput = FF.el("input", { type: "file", accept: "application/json", class: "hidden" });
    fileInput.addEventListener("change", function () {
      var file = fileInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          FF.store.import(reader.result);
          FF.toast("Backup restored.", "ok");
          FF.app.boot();
        } catch (err) {
          FF.toast(err.message || "Could not read that file.", "danger");
        }
      };
      reader.readAsText(file);
    });
    row.appendChild(FF.el("button", { class: "btn", html: FF.icon("upload", { size: 15 }) + "<span>Import backup</span>", onClick: function () { fileInput.click(); } }));
    row.appendChild(fileInput);
    card.appendChild(row);
    root.appendChild(card);

    var csvCard = FF.el("div", { class: "card section" });
    csvCard.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Export for spreadsheets" })]));
    csvCard.appendChild(FF.el("p", { class: "small muted", text: "Plain CSV — for your own analysis in Excel, Sheets, or anywhere else. The JSON backup above is what restores state back into FitForge; these are one-way exports." }));
    var csvRow = FF.el("div", { class: "row g-3 wrap", style: { marginTop: "12px" } });
    csvRow.appendChild(FF.el("button", { class: "btn btn--soft", html: FF.icon("download", { size: 15 }) + "<span>Workout log (CSV)</span>", onClick: exportWorkoutCsv }));
    csvRow.appendChild(FF.el("button", { class: "btn btn--soft", html: FF.icon("download", { size: 15 }) + "<span>Bodyweight (CSV)</span>", onClick: exportWeightCsv }));
    csvCard.appendChild(csvRow);
    root.appendChild(csvCard);

    var dangerCard = FF.el("div", { class: "card" });
    dangerCard.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Reset" })]));
    dangerCard.appendChild(FF.el("p", { class: "small muted", text: "Erases your profile, plans and logs and returns to onboarding. This cannot be undone." }));
    dangerCard.appendChild(FF.el("button", { class: "btn btn--danger", style: { marginTop: "12px" }, text: "Erase all data", onClick: confirmReset }));
    root.appendChild(dangerCard);
  }

  function csvCell(v) {
    var s = String(v === null || v === undefined ? "" : v);
    return /[,"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function downloadCsv(rows, filename) {
    var csv = rows.map(function (row) { return row.map(csvCell).join(","); }).join("\r\n");
    var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    FF.toast("CSV downloaded.", "ok");
  }

  function exportWorkoutCsv() {
    var s = FF.store.get();
    var rows = [["date", "day", "exercise", "set", "weight", "reps", "done"]];
    Object.keys(s.logs.workouts).sort().forEach(function (date) {
      var log = s.logs.workouts[date];
      Object.keys(log.sets || {}).forEach(function (exId) {
        var ex = FF.EX_BY_ID[exId];
        (log.sets[exId] || []).forEach(function (set, i) {
          rows.push([date, log.dayId || "", ex ? ex.name : exId, i + 1, set.w || "", set.r || "", set.done ? "yes" : "no"]);
        });
      });
    });
    if (rows.length === 1) { FF.toast("No workout log entries yet.", "warn"); return; }
    downloadCsv(rows, "fitforge-workout-log-" + FF.calc.todayKey() + ".csv");
  }

  function exportWeightCsv() {
    var s = FF.store.get();
    var rows = [["date", "weight_kg"]];
    (s.logs.weight || []).forEach(function (w) { rows.push([w.d, w.kg]); });
    if (rows.length === 1) { FF.toast("No bodyweight entries logged yet.", "warn"); return; }
    downloadCsv(rows, "fitforge-bodyweight-" + FF.calc.todayKey() + ".csv");
  }

  function exportData() {
    var blob = new Blob([FF.store.export()], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "fitforge-backup-" + FF.calc.todayKey() + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    FF.toast("Backup downloaded.", "ok");
  }

  function confirmReset() {
    FF.confirm({
      title: "Erase everything?",
      message: "This deletes your profile, plans, food and workout logs from this browser permanently.",
      confirmLabel: "Erase everything",
      danger: true,
      onConfirm: function () {
        FF.store.reset();
        FF.app.boot();
      },
    });
  }

  function field(labelText, hintText, control) {
    var wrap = FF.el("div", { class: "field", style: { marginBottom: "12px" } }, [FF.el("label", { class: "field__label", text: labelText })]);
    wrap.appendChild(control);
    if (hintText) wrap.appendChild(FF.el("div", { class: "field__hint", text: hintText }));
    return wrap;
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  FF.screens = FF.screens || {};
  FF.screens.studio = { render: render, openTab: function (tab) { activeTab = tab; } };
})();
