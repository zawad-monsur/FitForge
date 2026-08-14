/* ==========================================================================
   FitForge — Service worker: offline app-shell caching.
   Network-first: while online, every request always goes to the network so
   the app never runs stale code just because a cache entry exists — only
   falls back to the cached copy when the network fetch actually fails
   (genuinely offline). Bump CACHE below whenever precached files change, so
   old entries get swept in activate(). The AI Coach's calls to Groq are
   POST requests to a different origin and are explicitly never intercepted,
   so they always hit the network live regardless.
   Only takes effect over http(s); browsers refuse to register a service
   worker at all under file://, which is fine — the app still works there,
   it just won't be installable/offline-cached from a plain double-clicked
   index.html.
   ========================================================================== */

var CACHE = "fitforge-shell-v2";

var PRECACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/tokens.css",
  "./css/base.css",
  "./css/components.css",
  "./css/screens.css",
  "./js/data/exercises.js",
  "./js/data/recipes.js",
  "./js/core/store.js",
  "./js/core/calc.js",
  "./js/core/planner.js",
  "./js/core/mealplanner.js",
  "./js/core/ai.js",
  "./js/ui/icons.js",
  "./js/ui/ui.js",
  "./js/ui/charts.js",
  "./js/screens/onboarding.js",
  "./js/screens/dashboard.js",
  "./js/screens/workout.js",
  "./js/screens/nutrition.js",
  "./js/screens/progress.js",
  "./js/screens/coach.js",
  "./js/screens/studio.js",
  "./js/app.js",
  "./icons/icon.svg",
  "./icons/icon-maskable.svg",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return; // never touch POST — the AI Coach's Groq calls must always be live
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch cross-origin — fonts, Groq API

  event.respondWith(
    fetch(req)
      .then(function (res) {
        if (res.ok) caches.open(CACHE).then(function (cache) { cache.put(req, res.clone()); });
        return res;
      })
      .catch(function () {
        return caches.match(req).then(function (cached) { return cached || caches.match("./index.html"); });
      })
  );
});
