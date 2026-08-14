/* ==========================================================================
   FitForge — Icon set
   Inline SVG paths, Lucide-style (1.75px stroke), no emoji anywhere in the UI.
   Usage: FF.icon('dumbbell', { size: 20, class: 'x' })
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  var PATHS = {
    dumbbell: '<path d="M6.5 6.5 17.5 17.5"/><path d="m21 21-1.9-1.9"/><path d="M3.9 3.9 5.8 5.8"/><path d="M2 2l4 4"/><path d="m18 18 4 4"/><path d="m10.5 6.5-4-4"/><path d="M13.5 17.5l4 4"/><rect x="14" y="3" width="4" height="7" rx="1" transform="rotate(45 16 6.5)"/><rect x="6" y="14" width="4" height="7" rx="1" transform="rotate(45 8 17.5)"/>',
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    utensils: '<path d="M7 2v9M4 2v5a3 3 0 0 0 6 0V2M7 11v11"/><path d="M17 2c-2 0-3.5 2-3.5 5s1.5 5 3.5 5V22"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-4"/>',
    sliders: '<path d="M4 21V14M4 10V3M12 21v-9M12 8V3M20 21v-6M20 11V3"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="9" r="2"/><circle cx="20" cy="14" r="2"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 17a2.5 2.5 0 0 0 2.5-2.5c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7.5 7.5 0 1 1-15 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "arrow-left": '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    "arrow-right": '<path d="M5 12h14M12 5l7 7-7 7"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/><path d="M10 11v6M14 11v6"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    droplet: '<path d="M12 2s6 7.2 6 11.5a6 6 0 0 1-12 0C6 9.2 12 2 12 2Z"/>',
    scale: '<path d="M12 3v18"/><path d="m5 7 3.5 8.5a3.5 3.5 0 0 1-7 0Z"/><path d="m19 7-3.5 8.5a3.5 3.5 0 0 0 7 0Z"/><path d="M7 3h10"/><path d="M12 8s-3-1.5-5-1"/><path d="M12 8s3-1.5 5-1"/>',
    trophy: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M17 5h3a2 2 0 0 1-2 4h-1M7 5H4a2 2 0 0 0 2 4h1"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    play: '<path d="m6 4 14 8-14 8V4Z"/>',
    pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
    skip: '<path d="M5 4v16l12-8Z"/><path d="M19 4v16"/>',
    grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54Z"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    upload: '<path d="M12 21V9"/><path d="m7 14 5-5 5 5"/><path d="M5 3h14"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 6H6"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    star: '<path d="m12 2 3.1 6.6 7.2.8-5.4 5 1.5 7.3-6.4-3.7-6.4 3.7 1.5-7.3-5.4-5 7.2-.8Z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    swap: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    heart: '<path d="M20.8 8.6c0-3-2.4-5.4-5.4-5.4-1.7 0-3.2.8-4.4 2.1C9.8 4 8.3 3.2 6.6 3.2 3.6 3.2 1.2 5.6 1.2 8.6c0 5.5 6.4 9.4 9.6 12.2 1.2-1 3-2.5 4.7-4.2h.1c3.2-2.9 5.2-5.5 5.2-8Z" transform="translate(1)"/>',
    egg: '<path d="M12 21c4.5 0 7-3.6 7-8 0-5-3.5-10-7-10S5 8 5 13c0 4.4 2.5 8 7 8Z"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 4 13c0-5 4-9 9-9 5 0 9 4 9 9a7 7 0 0 1-7 7"/><path d="M4 13c6 0 12-3 12-9"/>',
    apple: '<path d="M12 6a5 5 0 0 1 5 5c0 5-2.5 10-5 10s-5-5-5-10a5 5 0 0 1 5-5Z"/><path d="M12 6c0-2 1-4 3-4"/>',
    equipment: '<rect x="2" y="9" width="4" height="6" rx="1"/><rect x="18" y="9" width="4" height="6" rx="1"/><path d="M6 12h12"/>',
    location: '<path d="M12 22s7-6.3 7-12a7 7 0 0 0-14 0c0 5.7 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    layers: '<path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
  };

  FF.icon = function (name, opts) {
    opts = opts || {};
    var size = opts.size || 20;
    var body = PATHS[name] || PATHS.info;
    var cls = opts.class ? ' class="' + opts.class + '"' : "";
    return '<svg' + cls + ' width="' + size + '" height="' + size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (opts.strokeWidth || 1.75) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  };
})();
