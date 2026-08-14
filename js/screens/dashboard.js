/* ==========================================================================
   FitForge — Dashboard screen
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  function todayFoodTotals(s) {
    var key = FF.calc.todayKey();
    var entries = s.logs.food[key] || [];
    return entries.reduce(function (acc, e) {
      acc.kcal += e.kcal; acc.p += e.p; acc.c += e.c; acc.f += e.f;
      return acc;
    }, { kcal: 0, p: 0, c: 0, f: 0 });
  }

  function todayWorkoutDay(s) {
    if (!s.plan || !s.plan.days.length) return null;
    var dow = FF.calc.weekIndex(new Date()); // 0 = Monday
    /* Cycle the plan's days across the week starting Monday, skipping once
       we run out of training days for a short split. */
    var trainDays = s.plan.days.length;
    var restEvery = Math.max(1, Math.round(7 / trainDays));
    var slot = dow % (trainDays + Math.max(0, 7 - trainDays * restEvery > 0 ? 1 : 0));
    if (slot >= trainDays) return null;
    return s.plan.days[dow % trainDays];
  }

  function weekStreak(s) {
    var start = FF.calc.startOfWeek(new Date());
    var cells = [];
    for (var i = 0; i < 7; i++) {
      var d = FF.calc.addDays(start, i);
      var key = FF.calc.dateKey(d);
      var log = s.logs.workouts[key];
      var isFuture = d > new Date() && key !== FF.calc.todayKey();
      cells.push({
        label: FF.calc.DOW[i][0],
        done: log && log.done ? "workout" : (isFuture ? null : (log ? "rest" : null)),
        today: key === FF.calc.todayKey(),
      });
    }
    return cells;
  }

  function streakCount(s) {
    var n = 0;
    var d = new Date();
    while (true) {
      var key = FF.calc.dateKey(d);
      var log = s.logs.workouts[key];
      if (log && log.done) { n++; d = FF.calc.addDays(d, -1); }
      else if (key === FF.calc.todayKey()) { d = FF.calc.addDays(d, -1); } // today not logged yet doesn't break streak
      else break;
    }
    return n;
  }

  function render(root) {
    var s = FF.store.get();
    var totals = todayFoodTotals(s);
    var day = todayWorkoutDay(s);
    var mealPlanDay = s.mealPlan && !s.mealPlan.empty ? s.mealPlan.days[FF.calc.weekIndex(new Date())] : null;
    var name = s.profile.name ? s.profile.name.split(" ")[0] : "there";

    root.innerHTML = "";

    /* ---------------------------------------------------------------- Hero */
    var hero = FF.el("div", { class: "hero" }, [
      FF.el("div", { class: "grow" }, [
        FF.el("div", { class: "hero__greet", text: FF.calc.greeting() + ", " + name }),
        FF.el("div", { class: "hero__sub", text: FF.calc.fmtDate(new Date()) + " · " + (s.plan ? s.plan.name : "No plan yet") }),
        FF.el("div", { class: "hero__stats" }, [
          statBlock("Streak", streakCount(s) + " days", "flame"),
          statBlock("Target", FF.fmtNum(s.targets.kcal) + " kcal", "target"),
          statBlock("Weekly change", weeklyChangeLabel(s), "scale"),
        ]),
      ]),
      FF.el("div", { class: "hero__ring", html: FF.ringSVG(totals.kcal, s.targets.kcal, { cap: "kcal today" }) }),
    ]);
    root.appendChild(hero);

    /* ------------------------------------------------------------- Quickbar */
    var quickbar = FF.el("div", { class: "quickbar section" }, [
      quickBtn("plus", "Log food", function () { FF.screens.nutrition.openQuickAdd(); }),
      quickBtn("scale", "Log weight", function () { openWeightModal(); }),
      quickBtn("play", "Start workout", function () { FF.app.navigate("workout"); }),
      quickBtn("refresh", "Regenerate plan", function () { regeneratePlans(); }),
    ]);
    root.appendChild(quickbar);

    /* ------------------------------------------------------------- Content */
    var grid = FF.el("div", { class: "grid grid--wide" });

    var left = FF.el("div", { class: "stack g-4" });
    left.appendChild(workoutCard(day, s));
    left.appendChild(mealsCard(mealPlanDay, s));
    grid.appendChild(left);

    var right = FF.el("div", { class: "stack g-4" });
    right.appendChild(macrosCard(totals, s));
    right.appendChild(streakCard(s));
    grid.appendChild(right);

    root.appendChild(grid);
  }

  function statBlock(label, value, icon) {
    return FF.el("div", { class: "stat" }, [
      FF.el("div", { class: "stat__label", text: label }),
      FF.el("div", { class: "stat__value", text: value }),
    ]);
  }

  function weeklyChangeLabel(s) {
    var kg = FF.calc.weeklyDelta(s);
    var v = s.profile.units === "imperial" ? kg * 2.20462 : kg;
    var unit = s.profile.units === "imperial" ? "lb" : "kg";
    var sign = v > 0 ? "+" : "";
    return sign + v.toFixed(2) + " " + unit + "/wk";
  }

  function quickBtn(icon, label, onClick) {
    return FF.el("button", { class: "btn", type: "button", onClick: onClick }, [
      FF.el("span", { html: FF.icon(icon, { size: 16 }) }), FF.el("span", { text: label }),
    ]);
  }

  function workoutCard(day, s) {
    var card = FF.el("div", { class: "card today-card" });
    card.appendChild(FF.el("div", { class: "card__head" }, [
      FF.el("span", { class: "eyebrow", text: "Today's session" }),
      FF.el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "View", onClick: function () { FF.app.navigate("workout"); } }),
    ]));

    if (!day) {
      card.appendChild(emptyState("moon", "Rest day", "No training scheduled today. Recovery is part of the plan."));
      return card;
    }

    var todayKey = FF.calc.todayKey();
    var log = s.logs.workouts[todayKey];
    var doneCount = 0;
    if (log) {
      Object.keys(log.sets || {}).forEach(function (exId) {
        if ((log.sets[exId] || []).some(function (set) { return set.done; })) doneCount++;
      });
    }

    card.appendChild(FF.el("div", { class: "today-card__name", text: day.name }));
    var list = FF.el("div", { class: "exlist" });
    day.exercises.slice(0, 5).forEach(function (item, i) {
      var ex = FF.EX_BY_ID[item.exId];
      if (!ex) return;
      list.appendChild(FF.el("div", { class: "exlist__row" }, [
        FF.el("span", { class: "exlist__idx", text: i + 1 }),
        FF.el("span", { class: "grow", text: ex.name }),
        FF.el("span", { class: "exlist__scheme", text: item.sets + " × " + item.reps }),
      ]));
    });
    if (day.exercises.length > 5) {
      list.appendChild(FF.el("div", { class: "exlist__row muted small", text: "+" + (day.exercises.length - 5) + " more" }));
    }
    card.appendChild(list);
    card.appendChild(FF.el("button", {
      class: "btn btn--primary btn--block", type: "button",
      text: log && log.done ? "Session complete" : "Start session",
      onClick: function () { FF.app.navigate("workout"); },
    }));
    return card;
  }

  function mealsCard(mealDay, s) {
    var card = FF.el("div", { class: "card today-card" });
    card.appendChild(FF.el("div", { class: "card__head" }, [
      FF.el("span", { class: "eyebrow", text: "Today's meals" }),
      FF.el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "View", onClick: function () { FF.app.navigate("nutrition"); } }),
    ]));

    if (!mealDay || !mealDay.meals.length) {
      card.appendChild(emptyState("utensils", "No meal plan yet", "Generate one from the Nutrition tab."));
      return card;
    }

    var todayKey = FF.calc.todayKey();
    var eaten = s.logs.meals[todayKey] || {};
    var list = FF.el("div", { class: "stack g-2" });
    mealDay.meals.forEach(function (m, i) {
      var r = FF.RECIPE_BY_ID[m.recipeId];
      if (!r) return;
      var t = FF.mealplanner.mealTotals(m);
      var isEaten = !!eaten[i];
      list.appendChild(FF.el("div", { class: "row between g-3" }, [
        FF.el("span", { class: "row g-2" }, [
          FF.el("span", { class: "badge badge--outline", text: r.slots.indexOf("breakfast") !== -1 && i === 0 ? "Breakfast" : capitalize(m.slot) }),
          FF.el("span", { class: "small", text: r.name }),
        ]),
        FF.el("span", { class: "row g-2" }, [
          FF.el("span", { class: "tiny dim", text: t.kcal + " kcal" }),
          isEaten ? FF.el("span", { class: "badge badge--ok", html: FF.icon("check", { size: 11 }) }) : null,
        ]),
      ]));
    });
    card.appendChild(list);
    return card;
  }

  function macrosCard(totals, s) {
    var card = FF.el("div", { class: "card" });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Today's macros" })]));
    card.appendChild(FF.el("div", { class: "stack g-3" }, [
      FF.el("div", { html: FF.macroRow("Protein", "protein", totals.p, s.targets.protein, "g") }),
      FF.el("div", { html: FF.macroRow("Carbs", "carbs", totals.c, s.targets.carbs, "g") }),
      FF.el("div", { html: FF.macroRow("Fat", "fat", totals.f, s.targets.fat, "g") }),
    ]));
    return card;
  }

  function streakCard(s) {
    var card = FF.el("div", { class: "card" });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "This week" })]));
    var strip = FF.el("div", { class: "streak" });
    weekStreak(s).forEach(function (c) {
      strip.appendChild(FF.el("div", { class: "streak__cell", "data-done": c.done || "", "data-today": c.today ? "true" : "false", text: c.label }));
    });
    card.appendChild(strip);
    return card;
  }

  function emptyState(icon, title, text) {
    return FF.el("div", { class: "empty" }, [
      FF.el("div", { class: "empty__icon", html: FF.icon(icon, { size: 22 }) }),
      FF.el("div", { class: "empty__title", text: title }),
      FF.el("div", { class: "empty__text", text: text }),
    ]);
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function regeneratePlans() {
    FF.confirm({
      title: "Regenerate your plans?",
      message: "This replaces your current workout split and weekly meal plan with a freshly generated version, using the same answers from onboarding. Any Studio customisations will be lost.",
      confirmLabel: "Regenerate",
      onConfirm: function () {
        FF.store.update(function (s) {
          s.plan = FF.planner.generate(s);
          s.mealPlan = FF.mealplanner.generate(s);
        });
        FF.toast("Plans regenerated.", "ok");
        FF.app.render();
      },
    });
  }

  function openWeightModal() {
    var s = FF.store.get();
    var input = FF.el("input", { class: "input", type: "number", step: "0.1", placeholder: s.profile.units === "imperial" ? "lb" : "kg", autofocus: true });
    FF.modal({
      title: "Log today's weight",
      body: field("Weight", null, input),
      footer: [
        FF.el("button", { class: "btn", text: "Cancel", onClick: FF.closeModal }),
        FF.el("button", {
          class: "btn btn--primary", text: "Save",
          onClick: function () {
            var v = parseFloat(input.value);
            if (!v || v <= 0) { FF.toast("Enter a valid weight.", "warn"); return; }
            var kg = s.profile.units === "imperial" ? FF.calc.lbToKg(v) : v;
            FF.store.update(function (state) {
              var key = FF.calc.todayKey();
              state.logs.weight = state.logs.weight.filter(function (w) { return w.d !== key; });
              state.logs.weight.push({ d: key, kg: Math.round(kg * 10) / 10 });
              state.logs.weight.sort(function (a, b) { return a.d < b.d ? -1 : 1; });
              state.profile.weightKg = Math.round(kg * 10) / 10;
            });
            FF.closeModal();
            FF.toast("Weight logged.", "ok");
            FF.app.render();
          },
        }),
      ],
    });
  }

  function field(labelText, hintText, control) {
    var wrap = FF.el("div", { class: "field" }, [FF.el("label", { class: "field__label", text: labelText })]);
    wrap.appendChild(control);
    if (hintText) wrap.appendChild(FF.el("div", { class: "field__hint", text: hintText }));
    return wrap;
  }

  FF.screens = FF.screens || {};
  FF.screens.dashboard = { render: render, todayWorkoutDay: todayWorkoutDay };
})();
