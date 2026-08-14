/* ==========================================================================
   FitForge — App shell: boot, routing, theme application.
   Builds the rail nav, topbar and mobile tab bar programmatically so the
   desktop and mobile nav lists can't drift out of sync with each other.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var SCREENS = [
    { id: "dashboard", label: "Dashboard", icon: "home", sub: "Your day at a glance" },
    { id: "workout", label: "Workout", icon: "dumbbell", sub: "Log today's session" },
    { id: "nutrition", label: "Nutrition", icon: "utensils", sub: "Meals, recipes & groceries" },
    { id: "progress", label: "Progress", icon: "chart", sub: "Trends and records" },
    { id: "coach", label: "Coach", icon: "message", sub: "Ask about your plan" },
    { id: "studio", label: "Studio", icon: "sliders", sub: "Customise everything" },
  ];

  var active = "dashboard";
  var railNavHost, tabbarNavHost, topbarTitle, topbarSub, screenHosts = {};
  var splashPlayed = false;

  /* Fades the entrance splash out once, on the very first boot() of this
     page load — never again on later re-boots (after onboarding finishes,
     a backup import, or a reset), since those aren't "entering the app". */
  function dismissSplash() {
    if (splashPlayed) return;
    splashPlayed = true;
    var splash = document.getElementById("boot-splash");
    if (!splash) return;
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { splash.remove(); return; }
    setTimeout(function () {
      splash.classList.add("is-out");
      var removed = false;
      function remove() { if (removed) return; removed = true; if (splash.parentNode) splash.remove(); }
      splash.addEventListener("transitionend", remove, { once: true });
      setTimeout(remove, 500); // fallback, same pattern as the toast fix — never trust an animation event alone
    }, 650);
  }

  function buildShell() {
    var app = document.getElementById("app");
    app.innerHTML = "";

    /* ---------------------------------------------------------------- Rail */
    railNavHost = FF.el("nav", { class: "nav", "aria-label": "Main navigation" });
    var rail = FF.el("aside", { class: "rail" }, [
      FF.el("div", { class: "brand" }, [
        FF.el("span", { class: "brand__mark", html: FF.icon("dumbbell", { size: 20 }) }),
        FF.el("div", {}, [
          FF.el("div", { class: "brand__name", text: "FitForge" }),
          FF.el("div", { class: "brand__sub", text: "Train · Eat · Track" }),
        ]),
      ]),
      railNavHost,
    ]);

    /* --------------------------------------------------------------- Main */
    topbarTitle = FF.el("h1", { text: "" });
    topbarSub = FF.el("span", { class: "topbar__sub" });
    var helpBtn = FF.el("button", {
      class: "btn btn--ghost btn--icon has-tip", "data-tip": "Around the app", "aria-label": "Show app guide",
      html: FF.icon("info", { size: 18 }), onClick: function () { FF.showGuide(); },
    });
    var topbar = FF.el("header", { class: "topbar" }, [
      FF.el("div", { class: "grow" }, [topbarTitle, FF.el("div", {}, [topbarSub])]),
      helpBtn,
    ]);

    var screenWrap = FF.el("div", {});
    SCREENS.forEach(function (screen) {
      var host = FF.el("div", { class: "screen", id: "screen-" + screen.id, hidden: screen.id !== active });
      screenHosts[screen.id] = host;
      screenWrap.appendChild(host);
    });

    var main = FF.el("main", { class: "main" }, [topbar, screenWrap]);

    /* ------------------------------------------------------------- Tabbar */
    tabbarNavHost = FF.el("div", { class: "tabbar__inner" });
    var tabbar = FF.el("nav", { class: "tabbar", "aria-label": "Main navigation" }, [tabbarNavHost]);

    app.appendChild(rail);
    app.appendChild(main);
    app.appendChild(tabbar);
    document.body.appendChild(tabbar); // fixed position, keep it outside the grid flow

    buildNav();
  }

  function buildNav() {
    railNavHost.innerHTML = "";
    tabbarNavHost.innerHTML = "";
    SCREENS.forEach(function (screen) {
      railNavHost.appendChild(FF.el("button", {
        class: "nav__item", type: "button", "data-screen": screen.id, "aria-current": screen.id === active ? "page" : "false",
        html: FF.icon(screen.icon, { size: 18 }) + "<span>" + screen.label + "</span>",
        onClick: function () { navigate(screen.id); },
      }));
      tabbarNavHost.appendChild(FF.el("button", {
        class: "tabbar__item", type: "button", "data-screen": screen.id, "aria-current": screen.id === active ? "page" : "false",
        html: FF.icon(screen.icon, { size: 20 }) + "<span>" + screen.label + "</span>",
        onClick: function () { navigate(screen.id); },
      }));
    });
  }

  function navigate(id) {
    if (active === id) { render(); return; }
    active = id;
    Object.keys(screenHosts).forEach(function (k) { screenHosts[k].hidden = k !== id; });
    document.querySelectorAll(".nav__item[data-screen], .tabbar__item[data-screen]").forEach(function (n) {
      n.setAttribute("aria-current", n.getAttribute("data-screen") === id ? "page" : "false");
    });
    var meta = SCREENS.filter(function (s) { return s.id === id; })[0];
    topbarTitle.textContent = meta.label;
    topbarSub.textContent = meta.sub;
    window.scrollTo(0, 0);
    render();
  }

  function render() {
    var meta = SCREENS.filter(function (s) { return s.id === active; })[0];
    topbarTitle.textContent = meta.label;
    topbarSub.textContent = meta.sub;
    var host = screenHosts[active];
    if (FF.screens[active]) FF.screens[active].render(host);
  }

  /* --------------------------------------------------------------- Prefs */

  function applyPrefs() {
    var s = FF.store.get();
    var root = document.documentElement;
    root.setAttribute("data-theme", s.prefs.theme || "auto");
    root.setAttribute("data-accent", s.prefs.accent || "terracotta");
    root.setAttribute("data-density", s.prefs.density || "cozy");
  }

  /* ----------------------------------------------------------------- Boot */

  function boot() {
    FF.store.load();
    applyPrefs();

    var s = FF.store.get();
    var app = document.getElementById("app");
    var overlay = document.getElementById("ob-overlay");

    if (!s.onboarded) {
      app.hidden = true;
      FF.onboarding.start();
      dismissSplash();
      return;
    }

    overlay.hidden = true;
    app.hidden = false;
    buildShell();
    navigate(active);
    dismissSplash();

    FF.store.on(function () { /* screens call FF.app.render() explicitly after mutations that need a redraw */ });
  }

  /* Only registers over http(s) — browsers refuse service workers under
     file://, so this silently no-ops there rather than erroring; the app
     works either way, it just isn't offline-cached from a plain
     double-clicked index.html. */
  function registerServiceWorker() {
    if ("serviceWorker" in navigator && (location.protocol === "http:" || location.protocol === "https:")) {
      navigator.serviceWorker.register("sw.js").catch(function (err) {
        console.warn("FitForge: service worker registration failed —", err);
      });
    }
  }

  FF.app = { boot: boot, navigate: navigate, render: render, applyPrefs: applyPrefs, SCREENS: SCREENS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  registerServiceWorker();
})();
