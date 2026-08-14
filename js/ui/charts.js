/* ==========================================================================
   FitForge — SVG chart renderers
   No chart library — small inline SVG builders that lean on the .chart*
   and .ring* classes from components.css so they inherit theme colors.
   ========================================================================== */

window.FF = window.FF || {};

(function () {
  "use strict";

  /* ---------------------------------------------------------- Calorie ring */
  /* value/max in [0, ∞); renders an arc that can overflow past 100% in warn color. */
  FF.ringSVG = function (value, max, opts) {
    opts = opts || {};
    var size = opts.size || 168;
    var stroke = opts.stroke || 14;
    var r = (size - stroke) / 2;
    var c = 2 * Math.PI * r;
    var pct = max > 0 ? FF.calc.clamp(value / max, 0, 1) : 0;
    var over = max > 0 && value > max;
    var offset = c * (1 - pct);
    var cx = size / 2, cy = size / 2;

    return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<circle class="ring__track" cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke-width="' + stroke + '"/>' +
      '<circle class="ring__value" cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke-width="' + stroke + '" ' +
      'style="stroke-dasharray:' + c + ';stroke-dashoffset:' + offset + (over ? ';stroke:var(--warn)' : "") + '"/>' +
      '</svg>' +
      '<div class="ring__center">' +
      '<div class="ring__num">' + FF.fmtNum(value) + '</div>' +
      '<div class="ring__cap">' + (opts.cap || "of " + FF.fmtNum(max)) + '</div>' +
      '</div></div>';
  };

  /* ---------------------------------------------------------------- Line chart */
  /* points: [{x: label, y: number}]. Renders a smooth-ish line + filled area. */
  FF.lineChartSVG = function (points, opts) {
    opts = opts || {};
    var w = opts.width || 560, h = opts.height || 180;
    var padL = 8, padR = 8, padT = 14, padB = 22;
    var innerW = w - padL - padR, innerH = h - padT - padB;

    if (!points.length) {
      return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '"></svg>';
    }

    var ys = points.map(function (p) { return p.y; });
    var min = opts.min !== undefined ? opts.min : Math.min.apply(null, ys);
    var max = opts.max !== undefined ? opts.max : Math.max.apply(null, ys);
    if (min === max) { min -= 1; max += 1; }
    var pad = (max - min) * 0.12;
    min -= pad; max += pad;

    function X(i) { return padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW); }
    function Y(v) { return padT + innerH - ((v - min) / (max - min)) * innerH; }

    var linePts = points.map(function (p, i) { return X(i) + "," + Y(p.y); }).join(" L ");
    var areaPts = "M " + X(0) + "," + Y(points[0].y) + " L " + linePts + " L " + X(points.length - 1) + "," + (padT + innerH) + " L " + X(0) + "," + (padT + innerH) + " Z";

    var gridLines = "";
    for (var g = 0; g <= 2; g++) {
      var gy = padT + (innerH / 2) * g;
      gridLines += '<line class="chart__grid" x1="' + padL + '" x2="' + (w - padR) + '" y1="' + gy + '" y2="' + gy + '"/>';
    }

    var dots = points.map(function (p, i) {
      return '<circle class="chart__dot" cx="' + X(i) + '" cy="' + Y(p.y) + '" r="3.5"><title>' + FF.esc(p.x) + ": " + FF.esc(p.y) + '</title></circle>';
    }).join("");

    var labels = "";
    var labelEvery = Math.max(1, Math.ceil(points.length / 6));
    points.forEach(function (p, i) {
      if (i % labelEvery !== 0 && i !== points.length - 1) return;
      labels += '<text class="chart__label" x="' + X(i) + '" y="' + (h - 4) + '" text-anchor="middle">' + FF.esc(p.x) + '</text>';
    });

    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="xMidYMid meet">' +
      '<defs><linearGradient id="ffAreaGrad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.22"/>' +
      '<stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>' +
      gridLines +
      '<path class="chart__area" d="' + areaPts + '"/>' +
      '<path class="chart__line" d="M ' + linePts + '"/>' +
      dots + labels +
      '</svg>';
  };

  /* ----------------------------------------------------------------- Bar chart */
  /* bars: [{x: label, y: number, muted?: bool}] */
  FF.barChartSVG = function (bars, opts) {
    opts = opts || {};
    var w = opts.width || 560, h = opts.height || 180;
    var padL = 8, padR = 8, padT = 14, padB = 22;
    var innerW = w - padL - padR, innerH = h - padT - padB;

    if (!bars.length) return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '"></svg>';

    var max = opts.max !== undefined ? opts.max : Math.max.apply(null, bars.map(function (b) { return b.y; })) || 1;
    var gap = 8;
    var bw = (innerW - gap * (bars.length - 1)) / bars.length;

    var rects = bars.map(function (b, i) {
      var bh = max > 0 ? (b.y / max) * innerH : 0;
      var x = padL + i * (bw + gap);
      var y = padT + innerH - bh;
      return '<rect class="chart__bar' + (b.muted ? " chart__bar--muted" : "") + '" x="' + x + '" y="' + y + '" width="' + bw + '" height="' + Math.max(bh, 2) + '" rx="3"><title>' + FF.esc(b.x) + ": " + FF.esc(b.y) + '</title></rect>' +
        '<text class="chart__label" x="' + (x + bw / 2) + '" y="' + (h - 4) + '" text-anchor="middle">' + FF.esc(b.x) + '</text>';
    }).join("");

    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '">' + rects + '</svg>';
  };

  /* --------------------------------------------------------- Macro bar rows */
  FF.macroRow = function (label, macro, value, target, unit) {
    var pct = target > 0 ? FF.calc.clamp((value / target) * 100, 0, 999) : 0;
    var over = value > target;
    return '<div class="macro-row" data-macro="' + macro + '">' +
      '<div class="macro-row__top"><span class="macro-row__name">' + label + '</span>' +
      '<span class="macro-row__val">' + FF.fmtNum(value) + ' / ' + FF.fmtNum(target) + unit + '</span></div>' +
      '<div class="bar' + (over ? " bar--over" : "") + '"><div class="bar__fill" style="transform:scaleX(' + Math.min(pct, 100) / 100 + ')"></div></div>' +
      '</div>';
  };
})();
