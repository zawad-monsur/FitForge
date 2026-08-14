/* ==========================================================================
   FitForge — Meal plan generator
   --------------------------------------------------------------------------
   Pure functions: (state) -> mealPlan. Filters FF.RECIPES down to what the
   user can actually make (diet, allergies, skill, time, kitchen gear,
   budget, dislikes, cuisine), fills each day's slots, then scales servings
   so each day lands close to the calorie/protein target.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var MEAT_FLAGS = ["poultry", "beef", "pork", "fish", "shellfish"];

  /* Eating pattern and religious dietary law are independent axes — an
     omnivore or a pescatarian might still need halal or kosher food, so
     these two exclude-lists are combined (union), not chosen between. */
  var DIET_EXCLUDES = {
    omnivore: [],
    vegetarian: ["poultry", "beef", "pork", "fish", "shellfish"],
    vegan: ["poultry", "beef", "pork", "fish", "shellfish", "dairy", "egg"],
    pescatarian: ["poultry", "beef", "pork"],
    keto: [],
  };

  var RELIGIOUS_EXCLUDES = {
    none: [],
    halal: ["pork"],
    /* Kosher law also forbids mixing meat and dairy in the same dish, but
       that's a per-recipe combination rule rather than a single ingredient
       flag — out of scope for tag-based filtering, so this covers only the
       two categories that are forbidden outright. */
    kosher: ["pork", "shellfish"],
  };

  var SKILL_CAP = { 0: 0, 1: 1, 2: 2, 3: 3 };

  /* ------------------------------------------------------------ Filtering */

  function isKeto(r) {
    var carbKcal = r.c * 4;
    return r.tags.indexOf("low_carb") !== -1 || carbKcal / r.kcal <= 0.22;
  }

  function eligibleRecipes(kitchen) {
    var exclude = (DIET_EXCLUDES[kitchen.diet] || []).concat(RELIGIOUS_EXCLUDES[kitchen.religious] || []);
    var allergies = kitchen.allergies || [];
    var dislikes = kitchen.dislikes || [];
    var equip = kitchen.equip || [];

    return FF.RECIPES.filter(function (r) {
      if (dislikes.indexOf(r.id) !== -1) return false;
      if (r.contains.some(function (c) { return exclude.indexOf(c) !== -1; })) return false;
      if (r.contains.some(function (c) { return allergies.indexOf(c) !== -1; })) return false;
      if (r.skill > SKILL_CAP[kitchen.skill]) return false;
      if (r.mins > kitchen.cookMins + 5) return false; // small grace window
      if (!r.equip.every(function (e) { return equip.indexOf(e) !== -1; })) return false;
      if (kitchen.diet === "keto" && !isKeto(r)) return false;
      return true;
    });
  }

  /* --------------------------------------------------------------- Pantry */

  /* How many of a recipe's ingredients match something the user says they
     currently have. Loose substring match in both directions — "chicken"
     in the pantry should match a "Chicken breast" ingredient line, and
     "chicken breast" in the pantry should match an ingredient just called
     "chicken". Not exact, but the recipe set is small enough that a soft
     signal beats a hard filter (which would break generation entirely for
     anyone with a sparse pantry). */
  function pantryMatchCount(r, pantry) {
    if (!pantry || !pantry.length) return 0;
    var norm = pantry.map(function (p) { return p.toLowerCase().trim(); }).filter(Boolean);
    if (!norm.length) return 0;
    var count = 0;
    r.ing.forEach(function (row) {
      var name = row[0].toLowerCase();
      if (norm.some(function (p) { return name.indexOf(p) !== -1 || p.indexOf(name) !== -1; })) count++;
    });
    return count;
  }

  /* ------------------------------------------------------------- Scoring */

  function scoreRecipe(r, slot, kitchen, usedRecently) {
    var score = 0;
    if (usedRecently.has(r.id)) score -= 50;
    if (r.slots.indexOf(slot) !== -1) score += 8;
    if (kitchen.cuisines && kitchen.cuisines.length && kitchen.cuisines.indexOf(r.cuisine) !== -1) score += 4;
    score += pantryMatchCount(r, kitchen.pantry) * 1.5;
    if (r.cost <= kitchen.budget) score += 2;
    else score -= (r.cost - kitchen.budget) * 3;
    if (r.mins <= kitchen.cookMins * 0.6) score += 1; // reward quick meals a little
    score += Math.random() * 2.5;
    return score;
  }

  function pickForSlot(pool, slot, kitchen, usedRecently) {
    var candidates = pool.filter(function (r) { return r.slots.indexOf(slot) !== -1; });
    if (!candidates.length) candidates = pool.slice(); // fall back to anything eligible
    if (!candidates.length) return null;
    candidates.sort(function (a, b) { return scoreRecipe(b, slot, kitchen, usedRecently) - scoreRecipe(a, slot, kitchen, usedRecently); });
    return candidates[0];
  }

  /* ------------------------------------------------------------- Scaling */

  /* ------------------------------------------------------------- Assembly */

  var SLOT_ORDER = ["breakfast", "lunch", "dinner", "snack"];

  /* mealsPerDay (2-5) is "how many square meals" — the first 3 map to
     breakfast/lunch/dinner, and the 4th/5th become extra snack-tagged
     slots (there's no dedicated "meal 4/5" recipe tag, and snack recipes
     are the right size/effort for an additional meal). kitchen.snacks is a
     SEPARATE, independent count of snacks on top of that. */
  function slotsForDay(kitchen) {
    var mpd = FF.calc.clamp(kitchen.mealsPerDay || 3, 1, 5);
    var slots = ["breakfast", "lunch", "dinner"].slice(0, Math.min(mpd, 3));
    for (var i = 3; i < mpd; i++) slots.push("snack");
    for (var j = 0; j < (kitchen.snacks || 0); j++) slots.push("snack");
    return slots;
  }

  function generate(state) {
    var kitchen = state.kitchen;
    var targets = state.targets;
    var pool = eligibleRecipes(kitchen);

    if (!pool.length) {
      return { empty: true, days: [], note: "No recipes match your current diet, allergy and equipment settings — loosen one in the Studio to generate a plan." };
    }

    var recent = []; // rolling window of recipe ids used, most recent last
    var days = [];

    for (var d = 0; d < 7; d++) {
      var slots = slotsForDay(kitchen);
      var usedToday = new Set();
      var usedRecently = new Set(recent.slice(-18));

      var picks = slots.map(function (slot) {
        var candidates = pool.filter(function (r) { return !usedToday.has(r.id); });
        var r = pickForSlot(candidates.length ? candidates : pool, slot, kitchen, usedRecently);
        if (r) usedToday.add(r.id);
        return { slot: slot, recipe: r };
      });

      picks = picks.filter(function (p) { return p.recipe; });

      /* Split the day's calorie/protein target across meals: dinner and
         lunch get a slightly bigger share than breakfast/snacks. */
      var shareMap = { breakfast: 0.9, lunch: 1.15, dinner: 1.2, snack: 0.6 };
      var totalShare = picks.reduce(function (s, p) { return s + (shareMap[p.slot] || 1); }, 0);

      var scaled = picks.map(function (p) {
        var share = (shareMap[p.slot] || 1) / totalShare;
        var mealTargetKcal = targets.kcal * share;
        var mealTargetProtein = targets.protein * share;
        var kcalFactor = mealTargetKcal / p.recipe.kcal;
        var proteinFactor = p.recipe.p > 0 ? mealTargetProtein / p.recipe.p : kcalFactor;
        var factor = FF.calc.clamp(kcalFactor * 0.7 + proteinFactor * 0.3, 0.5, 2.2);
        var servings = Math.round(factor * 4) / 4;
        return { slot: p.slot, recipeId: p.recipe.id, servings: servings };
      });

      scaled.forEach(function (p) { recent.push(p.recipeId); });

      days.push({ day: d, meals: sortMeals(scaled) });
    }

    return { empty: false, days: days, generatedAt: new Date().toISOString() };
  }

  function sortMeals(meals) {
    return meals.slice().sort(function (a, b) { return SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot); });
  }

  /* Totals for one meal entry, scaled by servings. */
  function mealTotals(meal) {
    var r = FF.RECIPE_BY_ID[meal.recipeId];
    if (!r) return { kcal: 0, p: 0, c: 0, f: 0 };
    return {
      kcal: Math.round(r.kcal * meal.servings),
      p: Math.round(r.p * meal.servings),
      c: Math.round(r.c * meal.servings),
      f: Math.round(r.f * meal.servings),
    };
  }

  function dayTotals(day) {
    return day.meals.reduce(function (acc, m) {
      var t = mealTotals(m);
      acc.kcal += t.kcal; acc.p += t.p; acc.c += t.c; acc.f += t.f;
      return acc;
    }, { kcal: 0, p: 0, c: 0, f: 0 });
  }

  /* Swap one meal for another recipe fitting the same slot + constraints. */
  function alternatives(meal, kitchen) {
    var pool = eligibleRecipes(kitchen).filter(function (r) {
      return r.slots.indexOf(meal.slot) !== -1 && r.id !== meal.recipeId;
    });
    return pool.sort(function (a, b) { return scoreRecipe(b, meal.slot, kitchen, new Set()) - scoreRecipe(a, meal.slot, kitchen, new Set()); });
  }

  /* ---------------------------------------------------------- Groceries */

  function groceryList(mealPlan, extra) {
    var byName = {};

    mealPlan.days.forEach(function (day) {
      day.meals.forEach(function (m) {
        var r = FF.RECIPE_BY_ID[m.recipeId];
        if (!r) return;
        r.ing.forEach(function (row) {
          var name = row[0], qty = row[1], unit = row[2], aisle = row[3];
          var key = name + "|" + unit;
          if (!byName[key]) byName[key] = { name: name, unit: unit, aisle: aisle, qty: 0 };
          byName[key].qty += qty * m.servings;
        });
      });
    });

    var byAisle = {};
    Object.keys(byName).forEach(function (key) {
      var item = byName[key];
      item.qty = Math.round(item.qty * 10) / 10;
      var aisle = item.aisle || "other";
      (byAisle[aisle] = byAisle[aisle] || []).push(item);
    });

    (extra || []).forEach(function (name) {
      var aisle = "other";
      (byAisle[aisle] = byAisle[aisle] || []).push({ name: name, unit: "", qty: null, aisle: aisle, custom: true });
    });

    var aisleOrder = ["produce", "protein", "dairy", "grains", "frozen", "pantry", "spices", "other"];
    return Object.keys(byAisle)
      .sort(function (a, b) { return aisleOrder.indexOf(a) - aisleOrder.indexOf(b); })
      .map(function (aisle) {
        return { aisle: aisle, items: byAisle[aisle].sort(function (a, b) { return a.name.localeCompare(b.name); }) };
      });
  }

  FF.mealplanner = {
    eligibleRecipes: eligibleRecipes,
    generate: generate,
    mealTotals: mealTotals,
    dayTotals: dayTotals,
    alternatives: alternatives,
    groceryList: groceryList,
    isKeto: isKeto,
    pantryMatchCount: pantryMatchCount,
  };
})();
