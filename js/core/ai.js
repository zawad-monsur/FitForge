/* ==========================================================================
   FitForge — AI Coach wiring
   --------------------------------------------------------------------------
   FitForge has no backend, so this calls Groq's OpenAI-compatible chat API
   directly from the browser using the user's own free API key (stored via
   FF.store.getApiKey/setApiKey — deliberately outside the exportable state,
   see store.js). There is nowhere to hide a key in a static, serverless app,
   so this is a bring-your-own-key design by necessity, not by default.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

  var MODELS = [
    { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B — fastest" },
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B — best quality" },
  ];

  function planBreakdown(plan) {
    if (!plan || !plan.days || !plan.days.length) return "No workout plan generated yet.";
    var lines = ["Current split: " + plan.name + (plan.note ? " (" + plan.note + ")" : "")];
    plan.days.forEach(function (day) {
      var exList = day.exercises.map(function (item) {
        var ex = FF.EX_BY_ID[item.exId];
        return ex ? (ex.name + " " + item.sets + "x" + item.reps) : null;
      }).filter(Boolean).join(", ");
      lines.push("- " + day.name + ": " + (exList || "no exercises set"));
    });
    return lines.join("\n");
  }

  function mealBreakdown(mealPlan) {
    if (!mealPlan || mealPlan.empty || !mealPlan.days || !mealPlan.days.length) return "No meal plan generated yet.";
    /* Today's day-of-week only, to keep the prompt short — the full week is
       the same rotation logic repeated, and burns tokens for little gain. */
    var todayIdx = FF.calc.weekIndex(new Date());
    var day = mealPlan.days[todayIdx] || mealPlan.days[0];
    var lines = ["Today's planned meals:"];
    day.meals.forEach(function (m) {
      var r = FF.RECIPE_BY_ID[m.recipeId];
      if (!r) return;
      var t = FF.mealplanner.mealTotals(m);
      lines.push("- " + capitalize(m.slot) + ": " + r.name + " (" + t.kcal + " kcal, " + t.p + "g protein)");
    });
    return lines.join("\n");
  }

  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function systemPrompt(state) {
    var p = state.profile, k = state.kitchen, t = state.targets;
    var equip = p.location === "gym" ? "full commercial gym"
      : p.location === "hybrid" ? "full gym plus home: " + (p.equipment.length ? p.equipment.join(", ") : "nothing extra")
      : p.equipment.length ? p.equipment.join(", ") : "bodyweight only";

    return [
      "You are the AI Coach inside FitForge, a personal gym and diet planner app.",
      "Be concise, practical, and warm — a few short paragraphs or a tight list, not an essay.",
      "Ground every answer in the user's real data below, including their actual workout split and today's meal plan. Never invent numbers or exercises/recipes you weren't given.",
      "If a question needs medical judgement (injury, pain, a health condition), say so plainly and suggest a doctor or physio rather than guessing.",
      "",
      "USER DATA",
      "Name: " + (p.name || "not given") + " · " + p.age + "yo " + p.sex + " · " + p.heightCm + "cm · " + p.weightKg + "kg",
      "Goal: " + p.goal + " at a " + p.pace + " pace · Experience: " + p.experience,
      "Schedule: " + p.daysPerWeek + "x/week, " + p.sessionMins + " min/session, trains " + p.trainingTime,
      "Equipment: " + equip,
      "Injuries / areas to avoid: " + (p.injuries.length ? p.injuries.join(", ") : "none reported"),
      "Daily targets: " + t.kcal + " kcal · " + t.protein + "g protein · " + t.carbs + "g carbs · " + t.fat + "g fat",
      "Diet: " + k.diet + " · Allergies: " + (k.allergies.length ? k.allergies.join(", ") : "none") + " · Cooking skill: " + k.skill + "/3",
      k.pantry && k.pantry.length ? "Has on hand right now: " + k.pantry.join(", ") : "",
      "",
      planBreakdown(state.plan),
      "",
      mealBreakdown(state.mealPlan),
    ].filter(Boolean).join("\n");
  }

  /* history: prior {role, content} messages (assistant errors excluded by
     the caller). onDone(replyText) / onError(Error). */
  function ask(state, userMessage, history, onDone, onError) {
    var key = FF.store.getApiKey();
    if (!key) {
      onError(new Error("No API key set yet — add a free Groq key in Studio → AI Coach."));
      return;
    }

    var messages = [{ role: "system", content: systemPrompt(state) }]
      .concat(history.map(function (m) { return { role: m.role, content: m.content }; }))
      .concat([{ role: "user", content: userMessage }]);

    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key,
      },
      body: JSON.stringify({
        model: FF.store.getAiModel(),
        messages: messages,
        temperature: 0.6,
        max_tokens: 700,
      }),
    })
      .then(function (res) {
        if (res.ok) return res.json();
        return res.json().catch(function () { return {}; }).then(function (body) {
          var msg = (body.error && body.error.message) || ("Request failed (HTTP " + res.status + ")");
          if (res.status === 401) msg = "That API key was rejected — check it in Studio → AI Coach.";
          throw new Error(msg);
        });
      })
      .then(function (data) {
        var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!reply) throw new Error("The model returned an empty response — try again.");
        onDone(reply.trim());
      })
      .catch(function (err) {
        onError(err instanceof Error ? err : new Error(String(err)));
      });
  }

  FF.ai = { ask: ask, MODELS: MODELS, DEFAULT_MODEL: MODELS[0].id };
})();
