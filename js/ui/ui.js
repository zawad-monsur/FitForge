/* ==========================================================================
   FitForge — Shared UI helpers: DOM builder, toasts, modals, confirm.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  /* ------------------------------------------------------------- el(tag, attrs, children) */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      else if (k === "text") node.textContent = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
      else if (v === true) node.setAttribute(k, "");
      else node.setAttribute(k, v);
    });
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }
  FF.el = el;

  function frag(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  FF.frag = frag;

  function fmtNum(n) { return Math.round(n).toLocaleString(); }
  FF.fmtNum = fmtNum;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  FF.esc = escapeHtml;

  /* -------------------------------------------------------------------- Toasts */
  var toastHost = null;
  function ensureToastHost() {
    if (!toastHost) {
      toastHost = el("div", { class: "toasts", role: "status", "aria-live": "polite" });
      document.body.appendChild(toastHost);
    }
    return toastHost;
  }

  var TOAST_ICON = { ok: "check-circle", warn: "alert", danger: "alert", info: "info" };

  FF.toast = function (message, kind, opts) {
    kind = kind || "info";
    opts = opts || {};
    var host = ensureToastHost();
    var node = el("div", { class: "toast toast--" + kind }, [
      el("span", { class: "toast__icon", html: FF.icon(TOAST_ICON[kind] || "info", { size: 18 }) }),
      el("span", { text: message }),
    ]);
    host.appendChild(node);
    var life = opts.duration || 3200;
    var timer = setTimeout(dismiss, life);

    function dismiss() {
      clearTimeout(timer);
      node.classList.add("is-out");
      var removed = false;
      function remove() { if (removed) return; removed = true; node.remove(); }
      /* Belt and suspenders: animationend should fire the removal, but
         near-zero-duration animations (prefers-reduced-motion collapses
         every animation to 0.01ms) can fail to fire it at all in some
         browsers, leaving the toast stuck forever. The fallback timer
         guarantees cleanup either way. */
      node.addEventListener("animationend", remove, { once: true });
      setTimeout(remove, 200);
    }
    node.addEventListener("click", dismiss);
    return dismiss;
  };

  /* -------------------------------------------------------------------- Modal */
  var openModal = null;

  FF.closeModal = function () {
    if (!openModal) return;
    var scrim = openModal;
    openModal = null;
    scrim.classList.add("is-closing");
    var focusReturn = scrim.__returnFocus;
    setTimeout(function () {
      scrim.remove();
      if (focusReturn && focusReturn.focus) focusReturn.focus();
    }, 150);
  };

  /* opts: { title, body(Node|string), footer(Node[]), wide, onClose } */
  FF.modal = function (opts) {
    if (openModal) FF.closeModal();
    var returnFocus = document.activeElement;

    var body = typeof opts.body === "string" ? frag('<div>' + opts.body + '</div>') : opts.body;

    var closeBtn = el("button", {
      class: "btn btn--ghost btn--icon has-tip", "data-tip": "Close", "aria-label": "Close dialog",
      html: FF.icon("x", { size: 18 }),
      onClick: function () { FF.closeModal(); if (opts.onClose) opts.onClose(); },
    });

    var head = el("div", { class: "modal__head" }, [
      el("h2", { class: "modal__title", text: opts.title || "" }),
      el("div", { class: "spacer" }),
      closeBtn,
    ]);

    var modalBody = el("div", { class: "modal__body" }, [body]);
    var children = [head, modalBody];
    if (opts.footer && opts.footer.length) {
      children.push(el("div", { class: "modal__foot" }, opts.footer));
    }

    var modalEl = el("div", {
      class: "modal" + (opts.wide ? " modal--wide" : ""),
      role: "dialog", "aria-modal": "true", "aria-label": opts.title || "Dialog",
    }, children);

    var scrim = el("div", { class: "scrim" }, [modalEl]);
    scrim.__returnFocus = returnFocus;
    scrim.addEventListener("mousedown", function (e) { if (e.target === scrim) { FF.closeModal(); if (opts.onClose) opts.onClose(); } });
    document.addEventListener("keydown", escHandler);

    function escHandler(e) {
      if (e.key === "Escape" && openModal === scrim) {
        FF.closeModal();
        if (opts.onClose) opts.onClose();
        document.removeEventListener("keydown", escHandler);
      }
    }

    document.body.appendChild(scrim);
    openModal = scrim;

    var firstFocusable = modalEl.querySelector("input,select,textarea,button,[tabindex]");
    if (firstFocusable) firstFocusable.focus();

    return { scrim: scrim, modal: modalEl, close: FF.closeModal };
  };

  /* Quick tour of the main screens — shown once automatically after
     onboarding finishes, and reachable anytime after via the "?" button in
     the topbar. Onboarding's own intro step explains the *setup* flow;
     this explains the *app* itself, which is a different kind of confusing
     ("what's the difference between the list in Studio and the list in
     Workout") that only comes up once you're actually using it. */
  FF.showGuide = function () {
    var items = [
      { icon: "home", title: "Dashboard", desc: "Your day at a glance — today's workout, today's meals, streak, quick actions." },
      { icon: "dumbbell", title: "Workout", desc: "Log today's actual session: check off sets, enter weight and reps, rest timer." },
      { icon: "utensils", title: "Nutrition", desc: "Your meal plan, recipes, grocery list, and a food log for anything off-plan." },
      { icon: "chart", title: "Progress", desc: "Bodyweight trend, weekly training volume, and personal records over time." },
      { icon: "message", title: "Coach", desc: "Ask questions about your plan — it can see your real goals, split, and meals." },
      { icon: "sliders", title: "Studio", desc: "Edit everything: swap exercises or meals, override targets, change how the app looks, back up your data." },
    ];
    var list = el("div", { class: "stack g-4" });
    items.forEach(function (item) {
      list.appendChild(el("div", { class: "row g-4", style: { alignItems: "flex-start" } }, [
        el("span", { class: "option__icon", html: FF.icon(item.icon, { size: 18 }) }),
        el("div", {}, [
          el("div", { class: "option__title", text: item.title }),
          el("div", { class: "option__desc", text: item.desc }),
        ]),
      ]));
    });
    list.appendChild(el("p", { class: "tiny dim", style: { marginTop: "4px" } },
      [el("strong", { text: "Studio vs. Workout/Nutrition: " }), el("span", { text: "Studio edits the plan itself — Workout and Nutrition log what you actually did against it." })]
    ));

    var gotItBtn = el("button", { class: "btn btn--primary", text: "Got it", onClick: function () { FF.closeModal(); } });
    FF.modal({ title: "Around the app", body: list, footer: [gotItBtn] });
  };

  FF.confirm = function (opts) {
    var body = el("p", { class: "muted", text: opts.message || "Are you sure?" });
    var cancelBtn = el("button", { class: "btn", text: opts.cancelLabel || "Cancel", onClick: function () { FF.closeModal(); } });
    var okBtn = el("button", {
      class: "btn " + (opts.danger ? "btn--danger" : "btn--primary"),
      text: opts.confirmLabel || "Confirm",
      onClick: function () { FF.closeModal(); if (opts.onConfirm) opts.onConfirm(); },
    });
    FF.modal({ title: opts.title || "Confirm", body: body, footer: [cancelBtn, okBtn] });
  };

  /* ------------------------------------------------------- Simple render-if-changed */
  FF.mount = function (root, html) {
    root.innerHTML = html;
  };
})();
