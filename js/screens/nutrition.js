/* ==========================================================================
   FitForge — Nutrition screen: meal plan, recipes, food log, groceries.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var activeDay = FF.calc.weekIndex(new Date());
  var activeView = "meals"; // meals | groceries

  function render(root) {
    var s = FF.store.get();
    root.innerHTML = "";

    if (!s.mealPlan || s.mealPlan.empty) {
      /* mealPlan.empty specifically means "zero recipes matched your diet/
         allergy/equipment settings" (see mealplanner.js) — re-generating
         won't help without changing one of those, so point straight at
         where to loosen them instead of just offering to retry the same
         failing generation. */
      var zeroMatches = s.mealPlan && s.mealPlan.empty;
      root.appendChild(FF.el("div", { class: "empty" }, [
        FF.el("div", { class: "empty__icon", html: FF.icon("utensils", { size: 22 }) }),
        FF.el("div", { class: "empty__title", text: zeroMatches ? "No recipes match your current settings" : "No meal plan yet" }),
        FF.el("div", { class: "empty__text", text: (s.mealPlan && s.mealPlan.note) || "Finish onboarding, or generate a plan from the Studio." }),
        FF.el("div", { class: "row g-2", style: { marginTop: "8px" } }, [
          zeroMatches ? FF.el("button", {
            class: "btn btn--primary", text: "Adjust kitchen settings",
            onClick: function () { FF.screens.studio.openTab("nutrition"); FF.app.navigate("studio"); },
          }) : FF.el("button", { class: "btn btn--primary", text: "Generate meal plan", onClick: function () { regenerate(); } }),
        ]),
      ]));
      return;
    }

    var head = FF.el("div", { class: "row between wrap g-3 section" }, [
      FF.el("h1", { text: "Nutrition" }),
      FF.el("div", { class: "segmented" }, [
        segBtn("meals", "Meals"), segBtn("groceries", "Groceries"),
      ]),
    ]);
    root.appendChild(head);

    if (activeView === "meals") renderMeals(root, s);
    else renderGroceries(root, s);
  }

  function segBtn(view, label) {
    return FF.el("button", {
      class: "segmented__item", type: "button", "aria-pressed": activeView === view ? "true" : "false", text: label,
      onClick: function () { activeView = view; render(document.getElementById("screen-nutrition")); },
    });
  }

  function renderMeals(root, s) {
    var picker = FF.el("div", { class: "daypicker section" });
    FF.calc.DOW.forEach(function (dow, i) {
      picker.appendChild(FF.el("button", {
        class: "daypicker__item", type: "button", "aria-pressed": i === activeDay ? "true" : "false",
        onClick: function () { activeDay = i; render(root.parentElement || root); render(root); },
      }, [
        FF.el("div", { class: "daypicker__dow", text: dow }),
        FF.el("div", { class: "daypicker__label", text: i === FF.calc.weekIndex(new Date()) ? "Today" : "" }),
      ]));
    });
    root.appendChild(picker);

    var day = s.mealPlan.days[activeDay];
    var totals = FF.mealplanner.dayTotals(day);
    var isToday = activeDay === FF.calc.weekIndex(new Date());
    var eatenMap = isToday ? (s.logs.meals[FF.calc.todayKey()] || {}) : {};

    var grid = FF.el("div", { class: "grid grid--wide" });
    var left = FF.el("div", { class: "stack g-3" });
    day.meals.forEach(function (m, i) {
      left.appendChild(mealCard(m, i, day, s, isToday, eatenMap));
    });
    grid.appendChild(left);

    var right = FF.el("div", { class: "stack g-4" });
    var macroCard = FF.el("div", { class: "card" }, [
      FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: isToday ? "Today's totals" : "Planned totals" })]),
      FF.el("div", { class: "row center g-4" }, [
        FF.el("div", { html: FF.ringSVG(totals.kcal, s.targets.kcal, { size: 128, stroke: 11, cap: "kcal" }) }),
        FF.el("div", { class: "stack g-3 grow" }, [
          FF.el("div", { html: FF.macroRow("Protein", "protein", totals.p, s.targets.protein, "g") }),
          FF.el("div", { html: FF.macroRow("Carbs", "carbs", totals.c, s.targets.carbs, "g") }),
          FF.el("div", { html: FF.macroRow("Fat", "fat", totals.f, s.targets.fat, "g") }),
        ]),
      ]),
    ]);
    right.appendChild(macroCard);

    if (isToday) {
      right.appendChild(foodLogCard(s));
    }

    grid.appendChild(right);
    root.appendChild(grid);
  }

  function mealCard(m, i, day, s, isToday, eatenMap) {
    var r = FF.RECIPE_BY_ID[m.recipeId];
    if (!r) return FF.el("div", {});
    var t = FF.mealplanner.mealTotals(m);
    var eaten = !!eatenMap[i];
    var pantryHits = FF.mealplanner.pantryMatchCount(r, FF.store.get().kitchen.pantry);

    var card = FF.el("div", { class: "meal-card" + (eaten ? " is-eaten" : "") });
    card.appendChild(FF.el("div", { class: "meal-card__head" }, [
      FF.el("span", { class: "meal-card__slot", text: m.slot }),
      FF.el("span", { class: "spacer" }),
      pantryHits > 0 ? FF.el("span", { class: "badge badge--ok has-tip", "data-tip": "Uses items from your fridge", html: FF.icon("check", { size: 11 }) + " Uses " + pantryHits + " from your fridge" }) : null,
      m.servings !== 1 ? FF.el("span", { class: "badge badge--outline", text: m.servings + "× serving" }) : null,
    ]));

    var body = FF.el("div", { class: "meal-card__body" }, [
      FF.el("div", { class: "meal-card__thumb", text: r.name.charAt(0) }),
      FF.el("div", { class: "grow" }, [
        FF.el("div", { class: "meal-card__name", text: r.name }),
        FF.el("div", { class: "meal-card__facts" }, [
          FF.el("span", { text: t.kcal + " kcal" }),
          FF.el("span", { class: "macro-chip", "data-m": "p", text: t.p + "g" }),
          FF.el("span", { class: "macro-chip", "data-m": "c", text: t.c + "g" }),
          FF.el("span", { class: "macro-chip", "data-m": "f", text: t.f + "g" }),
          FF.el("span", { class: "dim", text: r.mins + " min" }),
        ]),
        FF.el("div", { class: "meal-card__actions" }, [
          isToday ? FF.el("button", {
            class: "btn btn--sm " + (eaten ? "btn--soft" : "btn"), type: "button",
            html: FF.icon(eaten ? "check-circle" : "check", { size: 14 }) + "<span>" + (eaten ? "Eaten" : "Mark eaten") + "</span>",
            onClick: function () { toggleEaten(i, t); },
          }) : null,
          FF.el("button", { class: "btn btn--sm", type: "button", text: "Recipe", onClick: function () { openRecipeModal(r, m); } }),
          FF.el("button", { class: "btn btn--sm btn--ghost", type: "button", text: "Swap", onClick: function () { openSwapMealModal(m, i, day); } }),
          FF.el("button", { class: "btn btn--sm btn--ghost", type: "button", html: FF.icon("x", { size: 13 }) + "<span>Don't suggest again</span>", onClick: function () { dontSuggestAgain(r, m, i); } }),
        ]),
      ]),
    ]);
    card.appendChild(body);
    return card;
  }

  function toggleEaten(i, totals) {
    var key = FF.calc.todayKey();
    FF.store.update(function (s) {
      s.logs.meals[key] = s.logs.meals[key] || {};
      var now = !!s.logs.meals[key][i];
      if (now) {
        delete s.logs.meals[key][i];
        s.logs.food[key] = (s.logs.food[key] || []).filter(function (e) { return e.mealIndex !== i; });
      } else {
        s.logs.meals[key][i] = true;
        s.logs.food[key] = s.logs.food[key] || [];
        s.logs.food[key].push({ name: "Planned meal", kcal: totals.kcal, p: totals.p, c: totals.c, f: totals.f, mealIndex: i });
      }
    });
    FF.app.render();
  }

  /* Permanently rules a recipe out (kitchen.dislikes) — future plan
     generations will never pick it again — and immediately replaces this
     slot with the next-best alternative so the current week's plan doesn't
     keep showing something the user just rejected. */
  function dontSuggestAgain(r, m, i) {
    FF.confirm({
      title: "Don't suggest this again?",
      message: "\"" + r.name + "\" will never appear in a generated meal plan again. You can allow it again later from Studio → Nutrition.",
      confirmLabel: "Don't suggest again",
      onConfirm: function () {
        FF.store.update(function (state) {
          if (state.kitchen.dislikes.indexOf(m.recipeId) === -1) state.kitchen.dislikes.push(m.recipeId);
          var alts = FF.mealplanner.alternatives(m, state.kitchen);
          var mp = state.mealPlan.days[activeDay];
          if (alts.length) mp.meals[i] = { slot: m.slot, recipeId: alts[0].id, servings: m.servings };
          else mp.meals.splice(i, 1);
        });
        FF.toast("Won't suggest \"" + r.name + "\" again.", "ok");
        FF.app.render();
      },
    });
  }

  function openRecipeModal(r, m) {
    var t = FF.mealplanner.mealTotals(m);
    var body = FF.el("div", { class: "stack g-5" }, [
      FF.el("div", { class: "row g-3 wrap" }, [
        FF.el("span", { class: "badge badge--accent", text: t.kcal + " kcal" }),
        FF.el("span", { class: "macro-chip", "data-m": "p", text: t.p + "g protein" }),
        FF.el("span", { class: "macro-chip", "data-m": "c", text: t.c + "g carbs" }),
        FF.el("span", { class: "macro-chip", "data-m": "f", text: t.f + "g fat" }),
        FF.el("span", { class: "badge badge--outline", html: FF.icon("clock", { size: 11 }) + " " + r.mins + " min" }),
      ]),
      section("Ingredients (× " + m.servings + ")", ingredientsList(r, m.servings)),
      section("Method", stepsList(r.steps)),
    ]);
    FF.modal({ title: r.name, body: body, wide: true });
  }

  function section(title, node) {
    return FF.el("div", {}, [FF.el("h3", { text: title, style: { marginBottom: "12px" } }), node]);
  }

  function ingredientsList(r, servings) {
    var wrap = FF.el("div", { class: "recipe__ings" });
    r.ing.forEach(function (row) {
      var qty = Math.round(row[1] * servings * 10) / 10;
      var sub = FF.findSubstitute(row[0]);
      wrap.appendChild(FF.el("div", { class: "recipe__ing" }, [
        FF.el("span", {}, [
          FF.el("span", { text: row[0] }),
          sub ? FF.el("div", { class: "tiny dim", text: "↔ " + sub }) : null,
        ]),
        FF.el("span", { text: qty + " " + row[2] }),
      ]));
    });
    return wrap;
  }

  function stepsList(steps) {
    var wrap = FF.el("div", { class: "recipe__steps" });
    steps.forEach(function (step) { wrap.appendChild(FF.el("div", { class: "recipe__step", text: step })); });
    return wrap;
  }

  function openSwapMealModal(m, i, day) {
    var s = FF.store.get();
    var alts = FF.mealplanner.alternatives(m, s.kitchen);
    var body;
    if (!alts.length) {
      body = FF.el("div", { class: "empty" }, [
        FF.el("div", { class: "empty__icon", html: FF.icon("swap", { size: 20 }) }),
        FF.el("div", { class: "empty__title", text: "No alternatives available" }),
        FF.el("div", { class: "empty__text", text: "Loosen a diet, allergy or time constraint in the Studio to unlock more recipes." }),
      ]);
    } else {
      body = FF.el("div", {});
      alts.slice(0, 8).forEach(function (r) {
        body.appendChild(FF.el("button", {
          class: "lib-item", type: "button",
          onClick: function () {
            FF.store.update(function (state) {
              var mp = state.mealPlan.days[activeDay];
              mp.meals[i] = { slot: m.slot, recipeId: r.id, servings: 1 };
            });
            FF.closeModal();
            FF.toast("Swapped to " + r.name + ".", "ok");
            FF.app.render();
          },
        }, [
          FF.el("div", { class: "grow" }, [
            FF.el("div", { class: "lib-item__name", text: r.name }),
            FF.el("div", { class: "lib-item__meta", text: r.kcal + " kcal · " + r.mins + " min" }),
          ]),
          FF.el("span", { html: FF.icon("chevron-right", { size: 16 }) }),
        ]));
      });
    }
    FF.modal({ title: "Swap " + m.slot, body: body });
  }

  /* ------------------------------------------------------------- Food log */

  function foodLogCard(s) {
    var key = FF.calc.todayKey();
    var entries = s.logs.food[key] || [];
    var card = FF.el("div", { class: "card" });
    card.appendChild(FF.el("div", { class: "card__head" }, [
      FF.el("span", { class: "card__title", text: "Food log" }),
      FF.el("button", { class: "btn btn--soft btn--sm", type: "button", html: FF.icon("plus", { size: 14 }) + "<span>Add</span>", onClick: openQuickAdd }),
    ]));
    if (!entries.length) {
      card.appendChild(FF.el("div", { class: "empty" }, [
        FF.el("div", { class: "empty__icon", html: FF.icon("apple", { size: 20 }) }),
        FF.el("div", { class: "empty__title", text: "Nothing logged yet" }),
        FF.el("div", { class: "empty__text", text: "Mark a planned meal eaten, or add something off-plan." }),
      ]));
      return card;
    }
    var list = FF.el("div", { class: "list" });
    entries.forEach(function (e, i) {
      list.appendChild(FF.el("div", { class: "list__item" }, [
        FF.el("div", { class: "grow" }, [
          FF.el("div", { class: "list__title", text: e.name }),
          FF.el("div", { class: "list__sub", text: e.kcal + " kcal · P" + e.p + " C" + e.c + " F" + e.f }),
        ]),
        FF.el("button", { class: "btn btn--ghost btn--icon btn--sm", "aria-label": "Remove", html: FF.icon("x", { size: 14 }), onClick: function () { removeFoodEntry(i); } }),
      ]));
    });
    card.appendChild(list);
    return card;
  }

  function removeFoodEntry(i) {
    FF.store.update(function (s) {
      var key = FF.calc.todayKey();
      var entry = s.logs.food[key][i];
      s.logs.food[key].splice(i, 1);
      if (entry && entry.mealIndex !== undefined && s.logs.meals[key]) delete s.logs.meals[key][entry.mealIndex];
    });
    FF.app.render();
  }

  function openQuickAdd() {
    var searchInput = FF.el("input", { class: "input", type: "text", placeholder: "Search foods…", autofocus: true });
    var results = FF.el("div", { class: "stack g-2", style: { maxHeight: "220px", overflowY: "auto", marginTop: "12px" } });
    var qtyWrap = FF.el("div", { style: { display: "none" } });

    var selected = null;
    var qtyInput = FF.el("input", { class: "input", type: "number", value: 1, min: 0.25, step: 0.25 });

    function renderResults(q) {
      results.innerHTML = "";
      var matches = FF.FOODS.filter(function (f) { return f.name.toLowerCase().indexOf(q.toLowerCase()) !== -1; }).slice(0, 20);
      matches.forEach(function (f) {
        results.appendChild(FF.el("button", {
          class: "lib-item", type: "button",
          onClick: function () { selectFood(f); },
        }, [
          FF.el("div", { class: "grow" }, [
            FF.el("div", { class: "lib-item__name", text: f.name }),
            FF.el("div", { class: "lib-item__meta", text: f.kcal + " kcal per " + f.per + " " + f.unit }),
          ]),
        ]));
      });
    }

    function selectFood(f) {
      selected = f;
      qtyWrap.style.display = "";
      qtyWrap.innerHTML = "";
      qtyWrap.appendChild(FF.el("div", { class: "card card--flat card--pad-sm" }, [
        FF.el("div", { class: "row between g-3" }, [
          FF.el("strong", { text: f.name }),
          FF.el("button", { class: "btn btn--ghost btn--icon btn--sm", html: FF.icon("x", { size: 14 }), onClick: function () { selected = null; qtyWrap.style.display = "none"; } }),
        ]),
        FF.el("div", { class: "row g-3", style: { marginTop: "10px" } }, [
          FF.el("span", { class: "small muted", text: "Quantity (× " + f.per + f.unit + ")" }),
          qtyInput,
        ]),
      ]));
    }

    searchInput.addEventListener("input", function () { renderResults(searchInput.value); });
    renderResults("");

    var addBtn = FF.el("button", {
      class: "btn btn--primary", text: "Add to log",
      onClick: function () {
        if (!selected) { FF.toast("Pick a food first.", "warn"); return; }
        var mult = parseFloat(qtyInput.value) || 1;
        var entry = {
          name: selected.name, kcal: Math.round(selected.kcal * mult), p: Math.round(selected.p * mult),
          c: Math.round(selected.c * mult), f: Math.round(selected.f * mult),
        };
        FF.store.update(function (s) {
          var key = FF.calc.todayKey();
          s.logs.food[key] = s.logs.food[key] || [];
          s.logs.food[key].push(entry);
        });
        FF.closeModal();
        FF.toast("Added to today's log.", "ok");
        FF.app.render();
      },
    });

    FF.modal({
      title: "Add food",
      body: FF.el("div", {}, [searchInput, results, qtyWrap]),
      footer: [FF.el("button", { class: "btn", text: "Cancel", onClick: FF.closeModal }), addBtn],
    });
  }

  /* -------------------------------------------------------------- Groceries */

  function renderGroceries(root, s) {
    var list = FF.mealplanner.groceryList(s.mealPlan, s.grocery.extra);
    var card = FF.el("div", { class: "card" });
    card.appendChild(FF.el("div", { class: "card__head" }, [
      FF.el("span", { class: "card__title", text: "This week's groceries" }),
      FF.el("button", { class: "btn btn--ghost btn--sm", text: "Clear checked", onClick: clearChecked }),
    ]));

    var addRow = FF.el("div", { class: "row g-2", style: { marginBottom: "16px" } });
    var addInput = FF.el("input", { class: "input", type: "text", placeholder: "Add anything else — toothpaste, foil, …" });
    function addCustomItem() {
      var v = addInput.value.trim();
      if (!v) return;
      FF.store.update(function (state) {
        state.grocery.extra = state.grocery.extra || [];
        if (state.grocery.extra.indexOf(v) === -1) state.grocery.extra.push(v);
      });
      addInput.value = "";
      FF.app.render();
    }
    addInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); addCustomItem(); } });
    addRow.appendChild(addInput);
    addRow.appendChild(FF.el("button", { class: "btn btn--soft btn--sm", type: "button", text: "Add", onClick: addCustomItem }));
    card.appendChild(addRow);

    if (!list.length) {
      card.appendChild(FF.el("div", { class: "empty tiny", style: { padding: "24px" } }, [
        FF.el("span", { class: "dim", text: "Nothing here yet — generate a meal plan, or add an item above." }),
      ]));
    }

    list.forEach(function (group) {
      var cat = FF.el("div", { class: "grocery__cat" }, [
        FF.el("h4", { text: aisleLabel(group.aisle), style: { marginBottom: "8px", color: "var(--text-2)" } }),
      ]);
      group.items.forEach(function (item) {
        var key = item.name + "|" + item.unit;
        var checked = !!s.grocery.checked[key];
        cat.appendChild(FF.el("div", { class: "grocery__item", role: "checkbox", "aria-checked": checked ? "true" : "false", tabindex: "0", onClick: function () { toggleGrocery(key); } }, [
          FF.el("span", { class: "grocery__box", html: checked ? FF.icon("check", { size: 13 }) : "" }),
          FF.el("span", { class: "grocery__name", text: item.name }),
          item.qty !== null ? FF.el("span", { class: "grocery__qty", text: roundQty(item.qty, item.unit) + (item.unit ? " " + item.unit : "") }) : null,
          item.custom ? FF.el("button", {
            class: "btn btn--ghost btn--icon btn--sm", type: "button", "aria-label": "Remove " + item.name,
            html: FF.icon("x", { size: 12 }),
            onClick: function (e) { e.stopPropagation(); removeCustomItem(item.name); },
          }) : null,
        ]));
      });
      card.appendChild(cat);
    });

    root.appendChild(card);
  }

  function removeCustomItem(name) {
    FF.store.update(function (s) {
      s.grocery.extra = (s.grocery.extra || []).filter(function (n) { return n !== name; });
    });
    FF.app.render();
  }

  /* Weight/volume units (g, ml) round to one decimal — fine, since bulk
     items are naturally divisible. Piece-counted units ("pc") round UP to
     a whole number instead: the raw total across a week's recipes might
     sum to "3.3 pc" of avocado, which is correct arithmetic but not a real
     shopping quantity — nobody can buy 0.3 of an avocado, so round up to
     what you'd actually need to buy. */
  function roundQty(q, unit) {
    if (unit === "pc") return Math.ceil(q);
    return Math.round(q * 10) / 10;
  }

  function aisleLabel(a) {
    return { produce: "Produce", protein: "Protein", dairy: "Dairy", grains: "Grains & bread", frozen: "Frozen", pantry: "Pantry", spices: "Spices", other: "Other" }[a] || "Other";
  }

  function toggleGrocery(key) {
    FF.store.update(function (s) {
      if (s.grocery.checked[key]) delete s.grocery.checked[key];
      else s.grocery.checked[key] = true;
    });
    FF.app.render();
  }

  function clearChecked() {
    FF.store.update(function (s) { s.grocery.checked = {}; });
    FF.toast("Checklist cleared.", "ok");
    FF.app.render();
  }

  function regenerate() {
    FF.store.update(function (s) { s.mealPlan = FF.mealplanner.generate(s); });
    FF.app.render();
  }

  FF.screens = FF.screens || {};
  FF.screens.nutrition = { render: render, openQuickAdd: openQuickAdd };
})();
