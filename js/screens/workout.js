/* ==========================================================================
   FitForge — Workout screen: day picker, set logging, rest timer, swap.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var activeDayId = null;
  var restTimer = { handle: null, remaining: 0, total: 0, node: null };

  /* The day-picker's small top label used to show d.focus[0] — the first
     muscle in the day's focus list — which for e.g. a "Push" day (focus:
     chest, delts, triceps) just showed "chest", implying it was chest-only
     when the session actually trains three muscle groups. Deriving both
     labels from the same source (the day's own name) instead of two
     different sources means they can never disagree with each other. */
  function dayTypeLabel(name) {
    return name.split(" ")[0].toUpperCase();
  }

  function ensureTodayLog(s, dayId) {
    var key = FF.calc.todayKey();
    if (!s.logs.workouts[key] || s.logs.workouts[key].dayId !== dayId) {
      s.logs.workouts[key] = { dayId: dayId, sets: {}, done: false, mins: 0 };
    }
    return s.logs.workouts[key];
  }

  /* True if a log has anything actually worth not losing — a completed
     session, or any set with a checked-off rep/weight entered. */
  function logHasProgress(log) {
    if (!log) return false;
    if (log.done) return true;
    return Object.keys(log.sets || {}).some(function (exId) {
      return log.sets[exId].some(function (set) { return set.done || set.w || set.r; });
    });
  }

  /* Switching which day you're VIEWING used to silently overwrite today's
     entire logged session the moment the viewed day didn't match — since
     there's only one workout log slot per calendar date. Clicking through
     the picker just to glance at another day's exercises could wipe out
     real progress with zero warning. Now: switching is still instant and
     frictionless when there's nothing to lose, but requires an explicit
     confirmation the moment it would actually destroy logged sets. */
  function switchActiveDay(targetDay, s, root) {
    var key = FF.calc.todayKey();
    var existing = s.logs.workouts[key];

    if (existing && existing.dayId !== targetDay.id && logHasProgress(existing)) {
      var existingDay = s.plan.days.filter(function (d) { return d.id === existing.dayId; })[0];
      FF.confirm({
        title: "Switch to " + targetDay.name + "?",
        message: "You've already logged progress on " + (existingDay ? existingDay.name : "today's session") + " today. Switching will replace it with a fresh log for " + targetDay.name + " — this can't be undone.",
        confirmLabel: "Switch anyway",
        danger: true,
        onConfirm: function () { activeDayId = targetDay.id; render(root); },
      });
      return;
    }

    activeDayId = targetDay.id;
    render(root);
  }

  function ensureExerciseSets(log, item) {
    if (!log.sets[item.exId] || log.sets[item.exId].length !== item.sets) {
      var existing = log.sets[item.exId] || [];
      var rows = [];
      for (var i = 0; i < item.sets; i++) rows.push(existing[i] || { w: "", r: "", done: false });
      log.sets[item.exId] = rows;
    }
    return log.sets[item.exId];
  }

  function render(root) {
    var s = FF.store.get();

    root.innerHTML = "";

    if (!s.plan || !s.plan.days.length) {
      root.appendChild(FF.el("div", { class: "empty" }, [
        FF.el("div", { class: "empty__icon", html: FF.icon("dumbbell", { size: 22 }) }),
        FF.el("div", { class: "empty__title", text: "No plan yet" }),
        FF.el("div", { class: "empty__text", text: "Finish onboarding, or generate a plan from the Studio, to see your training split here." }),
      ]));
      return;
    }

    if (!activeDayId || !s.plan.days.some(function (d) { return d.id === activeDayId; })) {
      var suggested = FF.screens.dashboard.todayWorkoutDay(s);
      activeDayId = suggested ? suggested.id : s.plan.days[0].id;
    }

    var day = s.plan.days.filter(function (d) { return d.id === activeDayId; })[0];
    var log = ensureTodayLog(s, day.id);

    var head = FF.el("div", { class: "wo-head" }, [
      FF.el("div", {}, [
        FF.el("h1", { text: day.name }),
        FF.el("div", { class: "muted small", text: s.plan.name + (log.done ? " · Completed today" : "") }),
      ]),
      FF.el("button", { class: "btn btn--soft btn--sm", type: "button", html: FF.icon("refresh", { size: 15 }) + "<span>Regenerate day</span>", onClick: function () { regenerateDay(day); } }),
    ]);
    root.appendChild(head);

    var picker = FF.el("div", { class: "daypicker section" });
    s.plan.days.forEach(function (d) {
      var dLog = null;
      var key = FF.calc.todayKey();
      picker.appendChild(FF.el("button", {
        class: "daypicker__item", type: "button", "aria-pressed": d.id === activeDayId ? "true" : "false",
        onClick: function () { switchActiveDay(d, s, root); },
      }, [
        FF.el("div", { class: "daypicker__dow", text: dayTypeLabel(d.name) }),
        FF.el("div", { class: "daypicker__label", text: d.name.replace(/ [AB]$/, "") }),
      ]));
    });
    root.appendChild(picker);

    var list = FF.el("div", { class: "section" });
    day.exercises.forEach(function (item, idx) {
      list.appendChild(exerciseCard(item, idx, day, log));
    });
    root.appendChild(list);

    var finishBtn = FF.el("button", {
      class: "btn btn--primary btn--lg btn--block", type: "button",
      text: log.done ? "Session complete — log again" : "Finish session",
      onClick: function () { finishSession(day, log, root); },
    });
    root.appendChild(finishBtn);
  }

  function exerciseCard(item, idx, day, log) {
    var ex = FF.EX_BY_ID[item.exId];
    if (!ex) return FF.el("div", {});
    var sets = ensureExerciseSets(log, item);
    var allDone = sets.every(function (r) { return r.done; });

    var card = FF.el("div", { class: "ex-card" + (allDone ? " is-done" : "") });

    var head = FF.el("div", { class: "ex-card__head" }, [
      FF.el("span", { class: "ex-card__num", text: idx + 1 }),
      FF.el("div", { class: "grow" }, [
        FF.el("div", { class: "ex-card__name", text: ex.name }),
        FF.el("div", { class: "ex-card__meta" }, [
          FF.el("span", { class: "badge", text: item.sets + " × " + item.reps }),
          FF.el("span", { class: "badge badge--outline", text: FF.MUSCLES[ex.primary] }),
          item.restSec ? FF.el("span", { class: "badge badge--outline", html: FF.icon("clock", { size: 11 }) + " " + item.restSec + "s" }) : null,
        ]),
        FF.el("div", { class: "tiny dim", text: ex.cue, style: { marginTop: "6px" } }),
      ]),
      FF.el("button", { class: "btn btn--ghost btn--icon btn--sm has-tip", "data-tip": "Swap exercise", "aria-label": "Swap exercise", html: FF.icon("swap", { size: 15 }), onClick: function () { openSwapModal(item, idx, day); } }),
    ]);
    card.appendChild(head);

    var body = FF.el("div", { class: "ex-card__body" });
    if (ex.kind !== "cardio") {
      body.appendChild(FF.el("div", { class: "set-head" }, [
        FF.el("span", { text: "Set" }), FF.el("span", { text: "kg" }), FF.el("span", { text: "reps" }), FF.el("span", {}),
      ]));
      var setsWrap = FF.el("div", { class: "sets" });
      sets.forEach(function (set, i) {
        setsWrap.appendChild(setRow(set, i, ex, item, log, card));
      });
      body.appendChild(setsWrap);
      body.appendChild(howToPanel(ex));
    } else {
      body.appendChild(FF.el("div", { class: "row g-3" }, [
        FF.el("button", {
          class: "btn btn--soft", type: "button", text: sets[0].done ? "Marked complete" : "Mark complete",
          onClick: function () {
            sets[0].done = !sets[0].done;
            FF.store.save();
            card.classList.toggle("is-done", sets[0].done);
          },
        }),
      ]));
      body.appendChild(howToPanel(ex));
    }
    card.appendChild(body);
    return card;
  }

  /* Expandable equipment-usage tips (per FF.EQUIPMENT_TIPS) plus a link to a
     YouTube search for the exercise's form — not embedded video (no hosting
     or licensing for 135 exercises), but a one-click way to actually see it
     demonstrated. */
  function howToPanel(ex) {
    var hasTips = ex.equip.length > 0;
    var chev = FF.el("span", { class: "acc__chev", html: FF.icon("chevron-right", { size: 14 }) });
    var acc = FF.el("div", { class: "acc", "data-open": "false", style: { marginTop: "12px" } });
    var headBtn = FF.el("button", { class: "acc__head", type: "button", "aria-expanded": "false" }, [
      FF.el("span", { class: "dim", html: FF.icon("info", { size: 15 }) }),
      FF.el("span", { class: "grow small", text: hasTips ? "Equipment tips & form video" : "Watch form video" }),
      chev,
    ]);

    var bodyEl = FF.el("div", { class: "acc__body" });
    if (hasTips) {
      var tipsList = FF.el("div", { class: "stack g-2", style: { marginBottom: "12px" } });
      ex.equip.forEach(function (e) {
        var tip = FF.EQUIPMENT_TIPS[e];
        if (!tip) return;
        tipsList.appendChild(FF.el("div", { class: "small" }, [
          FF.el("strong", { text: FF.EQUIPMENT[e] + ": " }),
          FF.el("span", { class: "muted", text: tip }),
        ]));
      });
      bodyEl.appendChild(tipsList);
    }

    var videoUrl = "https://www.youtube.com/results?search_query=" + encodeURIComponent(ex.name + " proper form");
    bodyEl.appendChild(FF.el("a", { class: "btn btn--soft btn--sm", href: videoUrl, target: "_blank", rel: "noopener noreferrer" }, [
      FF.el("span", { html: FF.icon("play", { size: 13 }) }),
      FF.el("span", { text: "Watch form videos on YouTube" }),
    ]));

    acc.appendChild(headBtn);
    acc.appendChild(bodyEl);

    headBtn.addEventListener("click", function () {
      var open = acc.getAttribute("data-open") === "true";
      acc.setAttribute("data-open", open ? "false" : "true");
      headBtn.setAttribute("aria-expanded", open ? "false" : "true");
    });

    return acc;
  }

  function setRow(set, i, ex, item, log, card) {
    var wInput = FF.el("input", { class: "input", type: "number", inputmode: "decimal", placeholder: "—", value: set.w });
    var rInput = FF.el("input", { class: "input", type: "number", inputmode: "numeric", placeholder: item.reps, value: set.r });
    wInput.addEventListener("input", function () { set.w = wInput.value; FF.store.save(); });
    rInput.addEventListener("input", function () { set.r = rInput.value; FF.store.save(); });

    var doneBtn = FF.el("button", {
      class: "set-row__done", type: "button", "aria-pressed": set.done ? "true" : "false", "aria-label": "Mark set " + (i + 1) + " done",
      html: FF.icon("check", { size: 16 }),
      onClick: function () {
        set.done = !set.done;
        doneBtn.setAttribute("aria-pressed", set.done ? "true" : "false");
        FF.store.save();
        var allDone = log.sets[item.exId].every(function (r) { return r.done; });
        card.classList.toggle("is-done", allDone);
        if (set.done) {
          /* Draw-on checkmark, triggered only by the click itself (not by
             CSS reacting to aria-pressed) — so it never replays for sets
             that were already done when the screen was rendered/re-opened,
             only for the one just checked off. */
          var checkPath = doneBtn.querySelector("svg path");
          if (checkPath) {
            checkPath.classList.remove("check-draw");
            void checkPath.getBoundingClientRect(); // force reflow so a fast re-click restarts cleanly
            checkPath.classList.add("check-draw");
          }
          var s = FF.store.get();
          if (s.prefs.restTimer && item.restSec) startRestTimer(item.restSec);
        }
      },
    });

    return FF.el("div", { class: "set-row" }, [
      FF.el("span", { class: "set-row__idx", text: i + 1 }),
      wInput, rInput, doneBtn,
    ]);
  }

  /* ------------------------------------------------------------- Rest timer */

  function startRestTimer(seconds) {
    stopRestTimer();
    var s = FF.store.get();
    restTimer.remaining = s.prefs.defaultRest ? Math.max(seconds, 0) : seconds;
    restTimer.total = restTimer.remaining;

    var timeEl = FF.el("span", { class: "rest-bar__time mono", text: fmtTime(restTimer.remaining) });
    var addBtn = FF.el("button", { type: "button", class: "rest-bar__add", "aria-label": "Add 30 seconds", text: "+30s" });
    var pauseBtn = FF.el("button", { type: "button", "aria-label": "Pause", html: FF.icon("pause", { size: 16 }) });
    var skipBtn = FF.el("button", { type: "button", "aria-label": "Skip rest", html: FF.icon("skip", { size: 16 }) });

    var bar = FF.el("div", { class: "rest-bar" }, [
      FF.el("div", {}, [
        FF.el("div", { class: "rest-bar__label", text: "Rest" }),
        timeEl,
      ]),
      addBtn, pauseBtn, skipBtn,
    ]);
    document.body.appendChild(bar);
    restTimer.node = bar;

    var paused = false;
    addBtn.addEventListener("click", function () {
      /* Heavy sets sometimes need more than the prescribed rest — bump the
         clock without having to dive into Settings mid-set. */
      restTimer.remaining += 30;
      restTimer.total += 30;
      timeEl.textContent = fmtTime(restTimer.remaining);
    });
    pauseBtn.addEventListener("click", function () {
      paused = !paused;
      pauseBtn.innerHTML = FF.icon(paused ? "play" : "pause", { size: 16 });
    });
    skipBtn.addEventListener("click", stopRestTimer);

    restTimer.handle = setInterval(function () {
      if (paused) return;
      restTimer.remaining--;
      if (restTimer.remaining <= 0) {
        stopRestTimer();
        FF.toast("Rest complete — next set.", "ok", { duration: 2200 });
        if (navigator.vibrate) navigator.vibrate(120);
        return;
      }
      timeEl.textContent = fmtTime(restTimer.remaining);
    }, 1000);
  }

  function stopRestTimer() {
    if (restTimer.handle) clearInterval(restTimer.handle);
    if (restTimer.node) restTimer.node.remove();
    restTimer.handle = null; restTimer.node = null;
  }

  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  /* ------------------------------------------------------------------ Swap */

  function openSwapModal(item, idx, day) {
    var s = FF.store.get();
    var alts = FF.planner.alternatives(item.exId, s.profile);
    var body;
    if (!alts.length) {
      body = FF.el("div", { class: "empty" }, [
        FF.el("div", { class: "empty__icon", html: FF.icon("swap", { size: 20 }) }),
        FF.el("div", { class: "empty__title", text: "No alternatives available" }),
        FF.el("div", { class: "empty__text", text: "Add more equipment in the Studio to unlock swaps for this exercise." }),
      ]);
    } else {
      body = FF.el("div", {});
      alts.slice(0, 8).forEach(function (ex) {
        body.appendChild(FF.el("button", {
          class: "lib-item", type: "button",
          onClick: function () {
            FF.store.update(function (state) {
              var planDay = state.plan.days.filter(function (d) { return d.id === day.id; })[0];
              var rx = FF.planner.prescribe(ex, state.profile.goal);
              planDay.exercises[idx] = { exId: ex.id, sets: rx.sets, reps: rx.reps, restSec: rx.restSec };
              var key = FF.calc.todayKey();
              if (state.logs.workouts[key]) delete state.logs.workouts[key].sets[item.exId];
            });
            FF.closeModal();
            FF.toast("Swapped to " + ex.name + ".", "ok");
            FF.app.render();
          },
        }, [
          FF.el("div", { class: "grow" }, [
            FF.el("div", { class: "lib-item__name", text: ex.name }),
            FF.el("div", { class: "lib-item__meta", text: FF.MUSCLES[ex.primary] + " · " + (ex.equip.length ? ex.equip.map(function (e) { return FF.EQUIPMENT[e]; }).join(", ") : "Bodyweight") }),
          ]),
          FF.el("span", { html: FF.icon("chevron-right", { size: 16 }) }),
        ]));
      });
    }
    FF.modal({ title: "Swap " + (FF.EX_BY_ID[item.exId] || {}).name, body: body });
  }

  function regenerateDay(day) {
    FF.confirm({
      title: "Regenerate this day?",
      message: "Replaces every exercise in \"" + day.name + "\" with a fresh selection. Today's logged sets for this day will be cleared.",
      confirmLabel: "Regenerate",
      onConfirm: function () {
        FF.store.update(function (state) {
          var full = FF.planner.generate(state);
          var replacement = full.days.filter(function (d) { return d.name === day.name; })[0] || full.days[0];
          var planDay = state.plan.days.filter(function (d) { return d.id === day.id; })[0];
          planDay.exercises = replacement.exercises;
          var key = FF.calc.todayKey();
          if (state.logs.workouts[key] && state.logs.workouts[key].dayId === day.id) {
            state.logs.workouts[key].sets = {};
          }
        });
        FF.toast("Day regenerated.", "ok");
        FF.app.render();
      },
    });
  }

  function finishSession(day, log, root) {
    stopRestTimer();
    FF.store.update(function (state) {
      var key = FF.calc.todayKey();
      var l = state.logs.workouts[key];
      if (l) { l.done = true; }
    });
    FF.toast("Nice work — session logged.", "ok");
    render(root);
  }

  FF.screens = FF.screens || {};
  FF.screens.workout = { render: render };
})();
