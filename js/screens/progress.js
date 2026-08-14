/* ==========================================================================
   FitForge — Progress screen: weight trend, adherence, personal records.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  function render(root) {
    var s = FF.store.get();
    root.innerHTML = "";

    root.appendChild(FF.el("h1", { text: "Progress", class: "section" }));

    var grid = FF.el("div", { class: "grid grid--wide" });
    var left = FF.el("div", { class: "stack g-4" });
    left.appendChild(weightCard(s));
    left.appendChild(adherenceCard(s));
    grid.appendChild(left);

    var right = FF.el("div", { class: "stack g-4" });
    right.appendChild(statsCard(s));
    right.appendChild(volumeCard(s));
    right.appendChild(prCard(s));
    grid.appendChild(right);

    root.appendChild(grid);
  }

  function weightCard(s) {
    var card = FF.el("div", { class: "card" });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Bodyweight" })]));

    var log = s.logs.weight.slice(-30);
    if (log.length < 2) {
      card.appendChild(FF.el("div", { class: "empty" }, [
        FF.el("div", { class: "empty__icon", html: FF.icon("scale", { size: 20 }) }),
        FF.el("div", { class: "empty__title", text: "Not enough data yet" }),
        FF.el("div", { class: "empty__text", text: "Log your weight a few times from the dashboard to see a trend." }),
      ]));
      return card;
    }

    var points = log.map(function (e) {
      var v = s.profile.units === "imperial" ? FF.calc.kgToLb(e.kg) : e.kg;
      var d = FF.calc.parseKey(e.d);
      return { x: d.getDate() + " " + FF.calc.MON[d.getMonth()], y: Math.round(v * 10) / 10 };
    });
    card.appendChild(FF.el("div", { html: FF.lineChartSVG(points, { height: 200 }) }));

    var first = log[0].kg, last = log[log.length - 1].kg;
    var delta = last - first;
    var unit = s.profile.units === "imperial" ? "lb" : "kg";
    var deltaDisplay = s.profile.units === "imperial" ? FF.calc.kgToLb(delta) : delta;
    card.appendChild(FF.el("div", { class: "row g-5 wrap", style: { marginTop: "16px" } }, [
      stat("Current", FF.calc.fmtWeight(last, s.profile.units)),
      stat("Change", (deltaDisplay >= 0 ? "+" : "") + deltaDisplay.toFixed(1) + " " + unit),
      stat("Entries", log.length),
    ]));
    return card;
  }

  function adherenceCard(s) {
    var card = FF.el("div", { class: "card" });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Weekly adherence" })]));

    var weeks = [];
    for (var w = 7; w >= 0; w--) {
      var start = FF.calc.addDays(FF.calc.startOfWeek(new Date()), -w * 7);
      var count = 0;
      for (var i = 0; i < 7; i++) {
        var key = FF.calc.dateKey(FF.calc.addDays(start, i));
        if (s.logs.workouts[key] && s.logs.workouts[key].done) count++;
      }
      weeks.push({ x: "W" + (8 - w), y: count });
    }
    card.appendChild(FF.el("div", { html: FF.barChartSVG(weeks, { height: 180, max: Math.max(s.profile.daysPerWeek, Math.max.apply(null, weeks.map(function (b) { return b.y; }))) }) }));
    card.appendChild(FF.el("div", { class: "tiny dim", text: "Sessions completed per week, target " + s.profile.daysPerWeek + "/week.", style: { marginTop: "8px" } }));
    return card;
  }

  /* Weekly total volume (sets x reps x weight, completed sets only) over
     the last 8 weeks, plus a this-week breakdown by primary muscle group —
     the two numbers advanced lifters actually track for progressive
     overload, which nothing else in Progress showed before. */
  function volumeCard(s) {
    var card = FF.el("div", { class: "card" });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Weekly volume" })]));

    var weeks = [];
    var byMuscleThisWeek = {};

    for (var w = 7; w >= 0; w--) {
      var start = FF.calc.addDays(FF.calc.startOfWeek(new Date()), -w * 7);
      var total = 0;
      for (var i = 0; i < 7; i++) {
        var key = FF.calc.dateKey(FF.calc.addDays(start, i));
        var log = s.logs.workouts[key];
        if (!log) continue;
        Object.keys(log.sets || {}).forEach(function (exId) {
          var ex = FF.EX_BY_ID[exId];
          (log.sets[exId] || []).forEach(function (set) {
            var weight = parseFloat(set.w);
            if (!set.done || !weight) return;
            var vol = weight * (parseFloat(set.r) || 1);
            total += vol;
            if (w === 0 && ex) byMuscleThisWeek[ex.primary] = (byMuscleThisWeek[ex.primary] || 0) + vol;
          });
        });
      }
      weeks.push({ x: "W" + (8 - w), y: Math.round(total) });
    }

    if (weeks.every(function (b) { return b.y === 0; })) {
      card.appendChild(FF.el("div", { class: "empty" }, [
        FF.el("div", { class: "empty__icon", html: FF.icon("chart", { size: 20 }) }),
        FF.el("div", { class: "empty__title", text: "No volume logged yet" }),
        FF.el("div", { class: "empty__text", text: "Log weight and reps on your working sets to see volume trends here." }),
      ]));
      return card;
    }

    card.appendChild(FF.el("div", { html: FF.barChartSVG(weeks, { height: 180 }) }));
    card.appendChild(FF.el("div", { class: "tiny dim", text: "Sets × reps × weight, per week (kg).", style: { marginTop: "8px" } }));

    var muscleIds = Object.keys(byMuscleThisWeek).sort(function (a, b) { return byMuscleThisWeek[b] - byMuscleThisWeek[a]; }).slice(0, 6);
    if (muscleIds.length) {
      var maxMuscle = byMuscleThisWeek[muscleIds[0]];
      var breakdown = FF.el("div", { class: "stack g-3" });
      muscleIds.forEach(function (m) {
        var pct = maxMuscle > 0 ? (byMuscleThisWeek[m] / maxMuscle) : 0;
        breakdown.appendChild(FF.el("div", { class: "stack g-1" }, [
          FF.el("div", { class: "row between g-3" }, [
            FF.el("span", { class: "small", text: FF.MUSCLES[m] || m }),
            FF.el("span", { class: "tiny dim", text: FF.fmtNum(byMuscleThisWeek[m]) + " kg" }),
          ]),
          FF.el("div", { class: "bar bar--thin" }, [FF.el("div", { class: "bar__fill", style: { transform: "scaleX(" + pct + ")" } })]),
        ]));
      });
      card.appendChild(FF.el("div", { style: { marginTop: "16px" } }, [
        FF.el("div", { class: "small muted", text: "This week by muscle group", style: { marginBottom: "10px" } }),
        breakdown,
      ]));
    }

    return card;
  }

  function statsCard(s) {
    var totalSessions = Object.keys(s.logs.workouts).filter(function (k) { return s.logs.workouts[k].done; }).length;
    var totalDays = Object.keys(s.logs.workouts).length;
    var card = FF.el("div", { class: "card" }, [
      FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Lifetime stats" })]),
      FF.el("div", { class: "grid grid--2 g-4" }, [
        statBig("Sessions completed", totalSessions),
        statBig("Days trained", totalDays),
        statBig("Target intake", FF.fmtNum(s.targets.kcal) + " kcal"),
        statBig("Weekly trend", weeklyTrendLabel(s)),
      ]),
    ]);
    return card;
  }

  function weeklyTrendLabel(s) {
    var kg = FF.calc.weeklyDelta(s);
    var v = s.profile.units === "imperial" ? kg * 2.20462 : kg;
    var unit = s.profile.units === "imperial" ? "lb" : "kg";
    return (v > 0 ? "+" : "") + v.toFixed(2) + " " + unit + "/wk";
  }

  function statBig(label, value) {
    return FF.el("div", { class: "stat" }, [
      FF.el("div", { class: "stat__label", text: label }),
      FF.el("div", { class: "stat__value", text: value, style: { fontSize: "var(--t-xl)" } }),
    ]);
  }

  function prCard(s) {
    var best = {}; // exId -> { w, r, d }
    Object.keys(s.logs.workouts).forEach(function (dateKey) {
      var log = s.logs.workouts[dateKey];
      Object.keys(log.sets || {}).forEach(function (exId) {
        log.sets[exId].forEach(function (set) {
          var w = parseFloat(set.w);
          if (!set.done || !w) return;
          if (!best[exId] || w > best[exId].w) best[exId] = { w: w, r: set.r, d: dateKey };
        });
      });
    });

    var card = FF.el("div", { class: "card" });
    card.appendChild(FF.el("div", { class: "card__head" }, [FF.el("span", { class: "card__title", text: "Personal records" })]));

    var ids = Object.keys(best).sort(function (a, b) { return best[b].w - best[a].w; }).slice(0, 8);
    if (!ids.length) {
      card.appendChild(FF.el("div", { class: "empty" }, [
        FF.el("div", { class: "empty__icon", html: FF.icon("trophy", { size: 20 }) }),
        FF.el("div", { class: "empty__title", text: "No records yet" }),
        FF.el("div", { class: "empty__text", text: "Log weights on your working sets and your best lifts will show up here." }),
      ]));
      return card;
    }

    var list = FF.el("div", { class: "prlist" });
    ids.forEach(function (exId) {
      var ex = FF.EX_BY_ID[exId];
      if (!ex) return;
      var rec = best[exId];
      list.appendChild(FF.el("div", { class: "prlist__item" }, [
        FF.el("span", { class: "prlist__medal", html: FF.icon("trophy", { size: 16 }) }),
        FF.el("div", { class: "grow" }, [
          FF.el("div", { class: "list__title", text: ex.name }),
          FF.el("div", { class: "list__sub", text: FF.calc.relativeDay(rec.d) }),
        ]),
        FF.el("div", { class: "stat__value", text: rec.w + "kg", style: { fontSize: "var(--t-md)" } }),
      ]));
    });
    card.appendChild(list);
    return card;
  }

  function stat(label, value) {
    return FF.el("div", { class: "stat" }, [
      FF.el("div", { class: "stat__label", text: label }),
      FF.el("div", { class: "stat__value", text: value, style: { fontSize: "var(--t-lg)" } }),
    ]);
  }

  FF.screens = FF.screens || {};
  FF.screens.progress = { render: render };
})();
