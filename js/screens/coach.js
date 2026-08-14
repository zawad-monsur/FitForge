/* ==========================================================================
   FitForge — AI Coach chat screen
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var loading = false;

  var SUGGESTIONS = [
    "What should I eat today to hit my targets?",
    "Explain today's workout to me",
    "I'm sore — should I still train today?",
    "How can I eat more protein without cooking more?",
  ];

  function render(root) {
    var s = FF.store.get();
    root.innerHTML = "";

    if (!FF.store.getApiKey()) {
      root.appendChild(FF.el("div", { class: "empty" }, [
        FF.el("div", { class: "empty__icon", html: FF.icon("message", { size: 22 }) }),
        FF.el("div", { class: "empty__title", text: "Add a free API key to start chatting" }),
        FF.el("div", { class: "empty__text", text: "FitForge has no server, so this runs directly from your browser using your own free Groq key. Nothing passes through us — there's nothing to pass through." }),
        FF.el("button", {
          class: "btn btn--primary", style: { marginTop: "8px" }, text: "Set up in Studio",
          onClick: function () { FF.screens.studio.openTab("coach"); FF.app.navigate("studio"); },
        }),
      ]));
      return;
    }

    var head = FF.el("div", { class: "row between g-3 section" }, [
      FF.el("p", { class: "small muted", text: "Answers use your real profile, targets and plan — not generic advice." }),
      s.coach.messages.length ? FF.el("button", {
        class: "btn btn--ghost btn--sm", type: "button", text: "Clear conversation",
        onClick: function () { FF.store.update(function (state) { state.coach.messages = []; }); FF.app.render(); },
      }) : null,
    ]);
    root.appendChild(head);

    var list = FF.el("div", { class: "chat__list", id: "chat-list" });
    if (!s.coach.messages.length) {
      list.appendChild(FF.el("div", { class: "empty" }, [
        FF.el("div", { class: "empty__icon", html: FF.icon("sparkle", { size: 20 }) }),
        FF.el("div", { class: "empty__title", text: "Ask me anything about your plan" }),
        FF.el("div", { class: "empty__text", text: "I can see your goals, targets, equipment and current split." }),
      ]));
      var sugg = FF.el("div", { class: "chat__suggestions" });
      SUGGESTIONS.forEach(function (q) {
        sugg.appendChild(FF.el("button", { class: "chip chip--sm", type: "button", text: q, onClick: function () { send(q); } }));
      });
      list.appendChild(sugg);
    } else {
      s.coach.messages.forEach(function (m) { list.appendChild(bubble(m)); });
    }

    var textarea = FF.el("textarea", { class: "input", placeholder: "Ask about your training or nutrition…", rows: 1 });
    var sendBtn = FF.el("button", { class: "btn btn--primary btn--icon", type: "button", "aria-label": "Send", html: FF.icon("arrow-right", { size: 16 }) });

    function submit() {
      var text = textarea.value.trim();
      if (!text || loading) return;
      textarea.value = "";
      send(text);
    }
    sendBtn.addEventListener("click", submit);
    textarea.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
    });
    if (loading) { textarea.disabled = true; sendBtn.setAttribute("aria-disabled", "true"); }

    var form = FF.el("div", { class: "chat__form" }, [textarea, sendBtn]);
    root.appendChild(FF.el("div", { class: "chat" }, [list, form]));

    scrollToBottom(list);
    if (loading) setTypingIndicator(true);
  }

  function bubble(m) {
    return FF.el("div", { class: "chat__msg chat__msg--" + m.role + (m.error ? " chat__msg--error" : ""), text: m.content });
  }

  function scrollToBottom(list) { list.scrollTop = list.scrollHeight; }

  function send(text) {
    FF.store.update(function (state) {
      state.coach.messages.push({ role: "user", content: text, ts: Date.now() });
      if (state.coach.messages.length > 40) state.coach.messages = state.coach.messages.slice(-40);
    });
    loading = true;
    FF.app.render();

    var history = FF.store.get().coach.messages.slice(0, -1).filter(function (m) { return !m.error; });

    FF.ai.ask(FF.store.get(), text, history, function (reply) {
      loading = false;
      FF.store.update(function (state) { state.coach.messages.push({ role: "assistant", content: reply, ts: Date.now() }); });
      FF.app.render();
    }, function (err) {
      loading = false;
      FF.store.update(function (state) { state.coach.messages.push({ role: "assistant", content: err.message, ts: Date.now(), error: true }); });
      FF.app.render();
    });
  }

  function setTypingIndicator(on) {
    var list = document.getElementById("chat-list");
    if (!list) return;
    var existing = document.getElementById("chat-typing");
    if (on && !existing) {
      list.appendChild(FF.el("div", { class: "chat__typing", id: "chat-typing" }, [
        FF.el("span", { class: "chat__dot" }), FF.el("span", { class: "chat__dot" }), FF.el("span", { class: "chat__dot" }),
      ]));
      scrollToBottom(list);
    } else if (!on && existing) {
      existing.remove();
    }
  }

  FF.screens = FF.screens || {};
  FF.screens.coach = { render: render };
})();
