/* =========================================================
 * 일본 연말연시 여행 — 홈(코스 후보) + 코스 상세 페이지
 * Vanilla JS. DOM은 한 번만 만들고, 언어 전환 시에는 바인딩된
 * 텍스트만 교체한다 → 스크롤·열린 갤러리·지도 상태 유지.
 * ========================================================= */
(function () {
  "use strict";

  var T = window.TRANSLATIONS;
  var COURSES = window.COURSES;
  var P = window.PLACES;
  var CREDITS = window.PHOTO_CREDITS || {};
  var STORAGE_KEY = "jwt-lang";
  var IMG = "assets/images/";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  var PAGE = document.body.getAttribute("data-page") || "home";
  var COURSE = COURSES.filter(function (c) { return c.id === PAGE && c.status === "ready"; })[0] || null;
  function pageUrl(c) { return c.id + ".html"; }

  /* ---------- 언어 ---------- */
  var lang = "ko";
  try {
    var saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ko" || saved === "ja") lang = saved;
  } catch (e) { /* 저장소 차단 시 기본 언어 */ }

  function t(key, vars) {
    var s = (T[lang] && T[lang][key]) || T.ko[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split("{" + k + "}").join(vars[k]); });
    return s;
  }
  function L(obj) { return obj ? (obj[lang] != null ? obj[lang] : obj.ko) : ""; }

  var binds = [];
  function bind(el, fn, mode) { binds.push({ el: el, fn: fn, mode: mode || "text" }); return el; }
  function runBinds() {
    binds.forEach(function (b) {
      var v = b.fn();
      if (b.mode === "text") b.el.textContent = v;
      else if (b.mode === "html") b.el.innerHTML = v;
      else b.el.setAttribute(b.mode, v);
    });
  }
  var langHooks = [];

  /* ---------- DOM ---------- */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }
  function ht(tag, attrs, fn, mode) { return bind(h(tag, attrs), fn, mode); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }
  function badge(kind) {
    var key = { fixed: "legendFixed", cand: "legendCandidate", check: "legendCheck" }[kind];
    return ht("span", { class: "badge badge--" + kind }, function () { return t(key); });
  }

  /* ---------- 날짜 (day 1 = 2026-12-28) ---------- */
  var start = window.TRIP.start;
  function dateOf(day) { return new Date(start[0], start[1], start[2] + day - 1); }
  var fmtCache = {};
  function weekday(day) {
    var loc = lang === "ja" ? "ja-JP" : "ko-KR";
    if (!(loc in fmtCache)) {
      try { fmtCache[loc] = new Intl.DateTimeFormat(loc, { weekday: "short" }); } catch (e) { fmtCache[loc] = null; }
    }
    return fmtCache[loc] ? fmtCache[loc].format(dateOf(day)) : "";
  }
  function md(day) { var d = dateOf(day); return (d.getMonth() + 1) + "/" + d.getDate(); }
  function mdw(day) { return md(day) + "(" + weekday(day) + ")"; }
  function iso(day) {
    var d = dateOf(day);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* ---------- 이미지 ---------- */
  function photoImg(key, opts) {
    opts = opts || {};
    var c = CREDITS[key] || { w: 1600, h: 1067 };
    var img = h("img", {
      src: IMG + key + (opts.small ? "-sm" : "") + ".webp",
      srcset: opts.small ? null : IMG + key + "-sm.webp 720w, " + IMG + key + ".webp 1600w",
      sizes: opts.sizes || null,
      width: c.w, height: c.h,
      loading: opts.eager ? "eager" : "lazy",
      decoding: "async",
      alt: "",
    });
    img.addEventListener("error", function () {
      var box = img.parentNode;
      if (box) box.classList.add("is-broken");
      img.setAttribute("aria-hidden", "true");
    });
    return img;
  }
  function brokenNote() { return ht("span", { class: "img-fallback", "aria-hidden": "true" }, function () { return t("imgError"); }); }
  function creditText(key) {
    var c = CREDITS[key];
    return c ? t("by") + ": " + c.artist + " · " + c.license + " · Wikimedia Commons" : "";
  }

  /* =========================================================
   * 홈: 코스 후보 카드
   * ========================================================= */
  function renderCandidates() {
    var list = document.getElementById("course-cards");
    if (!list) return;
    COURSES.forEach(function (c) {
      var ready = c.status === "ready";
      var li = h("li", { class: "card" + (ready ? "" : " card--planned"), style: "--c:" + c.color + ";--a:" + c.accent });
      var body = h("div", { class: "card__body" }, [
        h("p", { class: "card__top" }, [
          ht("span", { class: "card__num" }, function () { return t("courseLabel", { n: "0" + c.num }); }),
          ht("span", { class: "card__status" }, function () { return t(ready ? "statusReady" : "statusPlanned"); }),
        ]),
        ht("h3", { class: "card__title" }, function () { return L(c.name); }),
      ]);
      if (ready) {
        body.appendChild(ht("p", { class: "card__style" }, function () { return L(c.intro); }));
        body.appendChild(h("dl", { class: "card__facts" }, [
          ht("dt", null, function () { return t("cardStays"); }),
          ht("dd", null, function () { return L(c.staysShort); }),
          ht("dt", null, function () { return t("cardFlights"); }),
          ht("dd", null, function () { return L(c.flights); }),
        ]));
        body.appendChild(h("span", { class: "card__cta" }, [ht("span", null, function () { return t("cardCta"); }), h("span", { "aria-hidden": "true", text: " →" })]));
        var a = h("a", { class: "card__link", href: pageUrl(c) }, [
          h("div", { class: "card__media" }, [photoImg(c.hero, { small: true }), brokenNote()]),
          body,
        ]);
        li.appendChild(a);
      } else {
        body.appendChild(ht("p", { class: "card__style" }, function () { return t("plannedText"); }));
        li.appendChild(h("div", { class: "card__link card__link--static" }, [
          h("div", { class: "card__media card__media--empty", "aria-hidden": "true" }, [h("span", { text: "0" + c.num })]),
          body,
        ]));
      }
      list.appendChild(li);
    });
  }

  /* =========================================================
   * 코스 페이지
   * ========================================================= */
  function regionById(c, id) { return c.regions.filter(function (r) { return r.id === id; })[0]; }

  function renderHero(c) {
    bind(document.getElementById("hero-eyebrow"), function () { return t("courseLabel", { n: "0" + c.num }) + " · " + t("statusReady"); });
    bind(document.getElementById("hero-title"), function () { return L(c.title); });
    bind(document.getElementById("hero-sub"), function () { return L(c.name); });
    var tags = document.getElementById("hero-tags");
    c.tags.forEach(function (tg) { tags.appendChild(ht("li", { class: "tag tag--light" }, function () { return L(tg); })); });
    var heroPhotos = c.regions[0].photos;
    var cr = CREDITS[c.hero];
    bind(document.getElementById("hero-credit"), function () { return L(heroPhotos[0].place) + (cr ? " · " + cr.artist + ", " + cr.license : ""); });
    var btn = document.getElementById("hero-photo");
    btn.hidden = false;
    btn.addEventListener("click", function () { Lightbox.open(heroPhotos, 0, btn, c.regions[0].color); });
    document.body.style.setProperty("--c", c.color);
    document.body.style.setProperty("--a", c.accent);
  }

  /* ---------- 개요 ---------- */
  function renderOverview(c) {
    var root = document.getElementById("overview-body");
    root.appendChild(ht("p", { class: "lead" }, function () { return L(c.intro); }));

    var dl = h("dl", { class: "facts" });
    c.info.forEach(function (it) {
      dl.appendChild(h("div", { class: "facts__row" }, [
        ht("dt", null, function () { return L(it.k); }),
        h("dd", null, [ht("span", null, function () { return L(it.v); }), it.check ? badge("check") : null]),
      ]));
    });
    root.appendChild(dl);

    // 숙박표
    root.appendChild(h("h3", { class: "block-title" }, [ht("span", null, function () { return t("staysTitle"); })]));
    var table = h("table", { class: "stays" });
    var thead = h("thead", null, [h("tr", null, [
      ht("th", { scope: "col" }, function () { return t("staysCheckIn"); }),
      ht("th", { scope: "col" }, function () { return t("staysCheckOut"); }),
      ht("th", { scope: "col" }, function () { return t("staysCity"); }),
      ht("th", { scope: "col", class: "num" }, function () { return t("staysNights"); }),
      ht("th", { scope: "col" }, function () { return t("staysType"); }),
    ])]);
    table.appendChild(thead);
    var tb = h("tbody");
    var total = 0;
    c.stays.forEach(function (s) {
      total += s.nights;
      var r = regionById(c, s.region);
      tb.appendChild(h("tr", { style: "--rc:" + (r ? r.color : c.color) }, [
        h("td", { class: "stays__in" }, [h("time", { datetime: iso(s.in) }, [ht("span", null, function () { return mdw(s.in); })])]),
        h("td", { class: "stays__out" }, [h("span", { class: "stays__arrow", "aria-hidden": "true", text: "→ " }), h("time", { datetime: iso(s.out) }, [ht("span", null, function () { return mdw(s.out); })])]),
        h("th", { scope: "row", class: "stays__city" }, [ht("span", null, function () { return L(s.city); })]),
        h("td", { class: "num stays__n" }, [ht("span", null, function () { return t("nightsN", { n: s.nights }); })]),
        h("td", { class: "stays__type" }, [ht("span", { class: "stays__kind" + (s.book ? " is-book" : "") }, function () { return L(s.type); })]),
      ]));
    });
    table.appendChild(tb);
    table.appendChild(h("tfoot", null, [h("tr", null, [
      ht("th", { scope: "row", colspan: "3" }, function () { return t("staysTotal"); }),
      ht("td", { class: "num" }, function () { return t("nightsN", { n: total }); }),
      ht("td", null, function () { return L(c.staysFoot); }),
    ])]));
    root.appendChild(h("div", { class: "stays-wrap" }, [table]));

    // 표시 안내
    root.appendChild(h("div", { class: "legend-box" }, [
      ht("p", { class: "legend-box__title" }, function () { return t("legendTitle"); }),
      h("ul", null, ["fixed", "cand", "check"].map(function (k) {
        var desc = { fixed: "legendFixedDesc", cand: "legendCandidateDesc", check: "legendCheckDesc" }[k];
        return h("li", null, [badge(k), ht("span", null, function () { return t(desc); })]);
      })),
    ]));
  }

  /* ---------- 지도 공통 ---------- */
  function gmapsLink(p) {
    var a = h("a", { class: "pill-link", href: "https://www.google.com/maps/search/?api=1&query=" + p.lat + "%2C" + p.lng, target: "_blank", rel: "noopener" });
    bind(a, function () { return t("openGmaps"); });
    bind(a, function () { return t("openGmapsAria", { place: L(p.name) }); }, "aria-label");
    return a;
  }

  // 지도 틀(지도 + 상태 + 버튼)만 먼저 만들고, 실제 Leaflet은 화면 근처에 왔을 때 초기화
  function mapShell(nameFn) {
    var el = h("div", { class: "map", role: "region" });
    bind(el, function () { return t("mapAria", { name: nameFn() }); }, "aria-label");
    var status = h("p", { class: "map-status", role: "status", hidden: true });
    var frame = h("div", { class: "map-frame" }, [el, status]);
    var fitBtn = ht("button", { type: "button", class: "btn btn--ghost" }, function () { return t("mapFit"); });
    var lockBtn = h("button", { type: "button", class: "btn btn--ghost", "aria-pressed": "false" });
    var tools = h("div", { class: "map-tools" }, [fitBtn, lockBtn]);
    return { el: el, status: status, frame: frame, tools: tools, fitBtn: fitBtn, lockBtn: lockBtn };
  }

  function whenNear(el, fn) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(); }
    }, { rootMargin: "300px 0px" });
    io.observe(el);
  }

  function markerIcon(Lf, opts) {
    var cls = "mk mk--" + opts.kind + (opts.wide ? " mk--wide" : "");
    var size = opts.kind === "dot" ? [16, 16] : opts.wide ? [74, 30] : opts.kind === "airport" ? [26, 26] : [30, 30];
    return Lf.divIcon({
      className: cls,
      html: opts.html,
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1] / 2],
      popupAnchor: [0, -size[1] / 2],
    });
  }

  /**
   * cfg: { shell, color, markers: [{p, label, kind, wide, popup()}], lines: [{latlngs, color, weight, dash}], maxZoom }
   */
  function buildMap(cfg) {
    var s = cfg.shell;
    function showStatus(key) {
      s.status.hidden = false;
      bind(s.status, function () { return t(key); });
      s.status.textContent = t(key);
    }
    if (!window.L || !window.L.map) {
      s.el.classList.add("map--failed");
      showStatus("mapLoadError");
      s.fitBtn.hidden = true; s.lockBtn.hidden = true;
      return;
    }
    var Lf = window.L;
    var map = Lf.map(s.el, { scrollWheelZoom: false, dragging: !isTouch, tap: false, zoomSnap: 0.25 });
    var tileErrors = 0;
    Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).on("tileerror", function () {
      tileErrors++;
      if (tileErrors >= 4 && s.status.hidden) showStatus("mapTileError");
    }).addTo(map);

    var b = Lf.latLngBounds(cfg.markers.map(function (m) { return [m.p.lat, m.p.lng]; }));
    function fit() { map.fitBounds(b, { padding: [30, 30], maxZoom: cfg.maxZoom || 15, animate: false }); }
    fit();

    (cfg.lines || []).forEach(function (ln) {
      Lf.polyline(ln.latlngs, { color: ln.color, weight: ln.weight || 3, opacity: 0.9, dashArray: ln.dash || null, lineCap: "round", lineJoin: "round" }).addTo(map);
    });

    cfg.markers.forEach(function (m) {
      var mk = Lf.marker([m.p.lat, m.p.lng], {
        icon: markerIcon(Lf, { kind: m.kind, wide: m.wide, html: m.html() }),
        keyboard: true, riseOnHover: true, zIndexOffset: { dot: -200, airport: -100, stay: 200, transfer: 150 }[m.kind] || 0,
      }).addTo(map);
      mk.bindPopup(m.popup(), { maxWidth: 250, autoPanPadding: [20, 20] });
      function a11y() {
        var e = mk.getElement();
        if (e) { var lbl = (m.label ? m.label + ". " : "") + L(m.p.name); e.setAttribute("title", lbl); e.setAttribute("aria-label", lbl); }
      }
      a11y();
      langHooks.push(function () {
        if (m.wide) mk.setIcon(markerIcon(Lf, { kind: m.kind, wide: m.wide, html: m.html() }));
        mk.setPopupContent(m.popup());
        a11y();
      });
    });

    s.fitBtn.addEventListener("click", function () { map.closePopup(); fit(); });

    var unlocked = false;
    function setLock(on) {
      unlocked = on;
      if (on) { map.dragging.enable(); map.scrollWheelZoom.enable(); }
      else { if (isTouch) map.dragging.disable(); map.scrollWheelZoom.disable(); }
      s.lockBtn.setAttribute("aria-pressed", on ? "true" : "false");
      s.el.classList.toggle("map--active", on);
      s.lockBtn.textContent = on ? t("mapLock") : t("mapUnlock");
    }
    bind(s.lockBtn, function () { return unlocked ? t("mapLock") : t("mapUnlock"); });
    s.lockBtn.addEventListener("click", function () { setLock(!unlocked); });
    setLock(false);
    if (isTouch) {
      var hint = ht("p", { class: "map-hint" }, function () { return t("mapHintTouch"); });
      hint.textContent = t("mapHintTouch");
      s.tools.appendChild(hint);
    }

    var touched = false;
    s.el.addEventListener("pointerdown", function () { touched = true; });
    s.el.addEventListener("keydown", function () { touched = true; });
    if ("ResizeObserver" in window) new ResizeObserver(function () {
      map.invalidateSize();
      if (!touched) fit();
    }).observe(s.el);
  }

  function popupHtml(title, lines) {
    return '<div class="pop" lang="' + lang + '"><strong class="pop__name">' + esc(title) + "</strong>" +
      lines.filter(Boolean).map(function (l, i) { return '<span class="' + (i === 0 ? "pop__meta" : "pop__desc") + '">' + esc(l) + "</span>"; }).join("") +
      "</div>";
  }
  function dayList(days) {
    // 연속 구간 묶기: [1,2,3,4] → 12/28(월)–12/31(목)
    var groups = [], g = [days[0]];
    for (var i = 1; i < days.length; i++) { if (days[i] === days[i - 1] + 1) g.push(days[i]); else { groups.push(g); g = [days[i]]; } }
    groups.push(g);
    return groups.map(function (gr) { return gr.length === 1 ? mdw(gr[0]) : mdw(gr[0]) + "–" + mdw(gr[gr.length - 1]); }).join(", ");
  }

  /* ---------- 광역 지도 ---------- */
  function renderWideMap(c) {
    var root = document.getElementById("map-body");
    var w = c.wide;
    var shell = mapShell(function () { return t("mapTitle"); });
    root.appendChild(shell.frame);
    root.appendChild(shell.tools);

    // 범례
    var usedModes = ["shinkansen", "marine", "local", "bus"];
    root.appendChild(h("div", { class: "map-legend" }, [
      h("div", { class: "map-legend__group" }, [
        ht("p", { class: "map-legend__title" }, function () { return t("legendModes"); }),
        h("ul", null, usedModes.map(function (k) {
          var m = c.modes[k];
          return h("li", null, [
            h("span", { class: "line-swatch" + (m.dash ? " line-swatch--dash" : ""), style: "--lc:" + m.color + (m.dash === "2 7" ? ";--dot:1" : ""), "aria-hidden": "true" }),
            ht("span", null, function () { return k === "bus" ? L(c.modes.bus.label) + " · " + L(c.modes.airport.label) : L(m.label); }),
          ]);
        })),
      ]),
      h("div", { class: "map-legend__group" }, [
        ht("p", { class: "map-legend__title" }, function () { return t("legendMarkers"); }),
        h("ul", null, [
          h("li", null, [h("span", { class: "mk-swatch mk-swatch--stay", "aria-hidden": "true" }), ht("span", null, function () { return t("mkStay"); })]),
          h("li", null, [h("span", { class: "mk-swatch mk-swatch--transfer", "aria-hidden": "true" }), ht("span", null, function () { return t("mkTransfer"); })]),
          h("li", null, [h("span", { class: "mk-swatch mk-swatch--airport", "aria-hidden": "true" }), ht("span", null, function () { return t("mkAirport"); })]),
          h("li", null, [h("span", { class: "mk-swatch mk-swatch--dot", "aria-hidden": "true" }), ht("span", null, function () { return t("mkSpot"); })]),
        ]),
      ]),
    ]));
    root.appendChild(ht("p", { class: "map-note" }, function () { return t("mapNote"); }));

    // 이동 순서 (텍스트, 지도 실패 시에도 사용 가능)
    root.appendChild(h("h3", { class: "block-title" }, [ht("span", null, function () { return t("routeListTitle"); })]));
    var ol = h("ol", { class: "route" });
    w.routeList.forEach(function (it, i) {
      var p = P[it.p];
      var mode = c.modes[it.mode];
      ol.appendChild(h("li", { class: "route__item" + (it.transfer ? " route__item--transfer" : ""), style: "--lc:" + mode.color }, [
        h("span", { class: "route__n", "aria-hidden": "true", text: String(i + 1) }),
        h("div", { class: "route__txt" }, [
          h("strong", { class: "route__name" }, [
            ht("span", null, function () { return L(p.name); }),
            it.transfer ? ht("span", { class: "tag-transfer" }, function () { return t("transferTag"); }) : null,
          ]),
          ht("span", { class: "route__meta" }, function () { return mdw(it.day) + " · " + L(mode.label) + " · " + L(it.text); }),
        ]),
        gmapsLink(p),
      ]));
    });
    root.appendChild(ol);

    // 지도 데이터
    var numberedBy = {};
    w.numbered.forEach(function (n) { numberedBy[n.p] = n; });
    var markers = w.points.map(function (id) {
      var p = P[id];
      var n = numberedBy[id];
      if (n) {
        var kind = p.kind === "airport" ? "airport" : p.kind === "transfer" ? "transfer" : "stay";
        return {
          p: p, label: n.n, kind: kind, wide: kind === "transfer",
          html: function () { return kind === "transfer" ? "<span>" + n.n + " · " + esc(t("transferTag")) + "</span>" : "<span>" + n.n + "</span>"; },
          popup: function () { return popupHtml(n.n + ". " + L(p.name), [dayList(n.days), L(n.note)]); },
        };
      }
      return {
        p: p, kind: "dot",
        html: function () { return "<span></span>"; },
        popup: function () { return popupHtml(L(p.name), [t("mkSpot")]); },
      };
    });
    var lines = w.segments.map(function (sg) {
      var m = c.modes[sg.mode];
      var pts = [[P[sg.from].lat, P[sg.from].lng]].concat(sg.via || []).concat([[P[sg.to].lat, P[sg.to].lng]]);
      return { latlngs: pts, color: m.color, weight: m.weight, dash: m.dash };
    });
    whenNear(shell.el, function () { buildMap({ shell: shell, markers: markers, lines: lines, maxZoom: 9 }); });
  }

  /* ---------- 날짜별 일정 ---------- */
  function renderDays(c) {
    var root = document.getElementById("days-body");
    var ol = h("ol", { class: "days" });
    c.days.forEach(function (d, i) {
      var day = i + 1;
      var r = regionById(c, d.region);
      var typeKey = { move: "typeMove", sight: "typeSight", rest: "typeRest" };
      var items = h("ul", { class: "day__items" });
      d.items.forEach(function (it) {
        var li = h("li", { class: it.train ? "has-train" : null }, [ht("span", null, function () { return L(it.t); })]);
        if (it.cand) li.appendChild(badge("cand"));
        if (it.check) li.appendChild(badge("check"));
        if (it.train) li.appendChild(h("a", { class: "train-ref", href: "#train-" + it.train, text: it.train.charAt(0) + "-" + it.train.charAt(1) }));
        items.appendChild(li);
      });
      ol.appendChild(h("li", { class: "day" + (d.stay ? "" : " day--last"), id: "day-" + day, style: "--rc:" + r.color }, [
        h("div", { class: "day__head" }, [
          h("div", { class: "day__date" }, [
            ht("span", { class: "day__n" }, function () { return t("dayN", { n: day }); }),
            h("time", { datetime: iso(day), class: "day__md" }, [
              h("span", { class: "day__mmdd", text: md(day) }),
              ht("span", { class: "day__wd" }, function () { return weekday(day); }),
            ]),
          ]),
          h("div", { class: "day__titles" }, [
            ht("p", { class: "day__place" }, function () { return L(d.place); }),
            h("ul", { class: "day__types" }, d.types.map(function (tp) {
              return ht("li", { class: "type type--" + tp }, function () { return t(typeKey[tp]); });
            })),
          ]),
        ]),
        items,
        h("p", { class: "day__stay" }, [
          ht("span", { class: "day__stay-k" }, function () { return d.stay ? t("stayLabel") : t("noStay"); }),
          d.stay ? ht("span", { class: "day__stay-v" }, function () { return L(d.stay); }) : null,
        ]),
      ]));
    });
    root.appendChild(ol);
  }

  /* ---------- 기차 ---------- */
  function renderTrains(c) {
    var root = document.getElementById("trains-body");
    var tr = c.trains;
    root.appendChild(h("div", { class: "nopass" }, [
      h("span", { class: "nopass__icon", "aria-hidden": "true", text: "!" }),
      h("div", null, [
        ht("strong", { class: "nopass__title" }, function () { return t("noPass"); }),
        ht("p", null, function () { return t("noPassDesc"); }),
      ]),
    ]));

    var ol = h("ol", { class: "segs" });
    tr.main.forEach(function (sg) {
      var rows = [["segLine", sg.line], ["segBooking", sg.booking], ["segSeat", sg.seat], ["segTime", sg.time, true], ["segTip", sg.tip]];
      ol.appendChild(h("li", { class: "seg seg--" + (/A2|B1/.test(sg.id) ? "marine" : "shinkansen"), id: "train-" + sg.id }, [
        h("div", { class: "seg__head" }, [
          h("span", { class: "seg__id", text: sg.id.charAt(0) + "-" + sg.id.charAt(1) }),
          h("time", { class: "seg__date", datetime: iso(sg.day) }, [ht("span", null, function () { return mdw(sg.day); })]),
        ]),
        h("p", { class: "seg__route" }, [
          h("span", { class: "seg__stn" }, [ht("strong", null, function () { return L(sg.from); }), h("small", { text: sg.fromEn })]),
          h("span", { class: "seg__arrow", "aria-hidden": "true", text: "→" }),
          h("span", { class: "seg__stn" }, [ht("strong", null, function () { return L(sg.to); }), h("small", { text: sg.toEn })]),
        ]),
        h("dl", { class: "seg__dl" }, rows.map(function (rw) {
          return h("div", null, [
            ht("dt", null, function () { return t(rw[0]); }),
            h("dd", null, [ht("span", null, function () { return L(rw[1]); }), rw[2] ? badge("check") : null]),
          ]);
        })),
      ]));
    });
    root.appendChild(ol);

    root.appendChild(h("h3", { class: "block-title" }, [ht("span", null, function () { return t("otherTrainsTitle"); })]));
    root.appendChild(h("ul", { class: "other-trains" }, tr.other.map(function (o) {
      return h("li", null, [
        h("time", { datetime: iso(o.day), class: "other-trains__d" }, [ht("span", null, function () { return mdw(o.day); })]),
        h("span", null, [ht("span", null, function () { return L(o.text); }), o.check ? badge("check") : null]),
      ]);
    })));

    root.appendChild(h("h3", { class: "block-title" }, [ht("span", null, function () { return t("ticketNotesTitle"); })]));
    root.appendChild(h("ul", { class: "dot-list" }, tr.notes.map(function (n) { return ht("li", null, function () { return L(n); }); })));

    root.appendChild(h("h3", { class: "block-title" }, [ht("span", null, function () { return t("officialLinks"); })]));
    root.appendChild(h("ul", { class: "refs" }, tr.links.map(function (l) {
      return h("li", null, [ht("a", { href: l.url, target: "_blank", rel: "noopener" }, function () { return L(l.label) + " ↗"; })]);
    })));
  }

  /* ---------- 여행지 ---------- */
  function regionDates(r) {
    if (r.dayTrip) return mdw(r.dates.from) + " · " + t("dayTrip");
    if (r.nightsText) return L(r.nightsText);
    return mdw(r.dates.from) + "–" + mdw(r.dates.to) + " · " + t("nightsN", { n: r.nights });
  }

  function renderRegions(c) {
    var root = document.getElementById("places-body");
    // 지역 바로가기
    root.appendChild(h("ul", { class: "region-chips" }, c.regions.map(function (r) {
      return h("li", null, [h("a", { href: "#place-" + r.id, style: "--rc:" + r.color }, [
        h("span", { class: "region-chips__n", text: String(r.num) }),
        ht("span", null, function () { return L(r.name); }),
      ])]);
    })));

    c.regions.forEach(function (r) {
      var art = h("article", { class: "region", id: "place-" + r.id, style: "--rc:" + r.color, "aria-labelledby": "place-" + r.id + "-t" });
      art.appendChild(h("header", { class: "region__head" }, [
        h("span", { class: "region__num", "aria-hidden": "true", text: "0" + r.num }),
        h("div", null, [
          ht("h3", { class: "region__name", id: "place-" + r.id + "-t" }, function () { return L(r.name); }),
          ht("p", { class: "region__dates" }, function () { return regionDates(r); }),
        ]),
      ]));

      // 대표 사진
      var lead = r.photos[0];
      var leadBtn = h("button", { type: "button", class: "lead-photo__btn" }, [photoImg(lead.key, { sizes: "(min-width: 1080px) 1040px, 100vw" }), brokenNote()]);
      bind(leadBtn, function () { return t("photoOf", { place: L(lead.place) }); }, "aria-label");
      leadBtn.addEventListener("click", function () { Lightbox.open(r.photos, 0, leadBtn, r.color); });
      art.appendChild(h("figure", { class: "lead-photo" }, [
        leadBtn,
        h("figcaption", { class: "lead-photo__cap" }, [
          ht("strong", null, function () { return L(lead.place); }),
          ht("span", null, function () { return " — " + L(lead.caption); }),
        ]),
      ]));

      // 갤러리 (접힘)
      var rest = r.photos.slice(1);
      var det = h("details", { class: "gallery" });
      var sum = h("span", { class: "gallery__label" });
      function sumText() { return (det.open ? t("galleryLess") : t("galleryMore")) + " (" + rest.length + ")"; }
      bind(sum, sumText);
      det.appendChild(h("summary", { class: "gallery__summary" }, [sum, h("span", { class: "gallery__chev", "aria-hidden": "true" })]));
      det.addEventListener("toggle", function () { sum.textContent = sumText(); });
      var grid = h("ul", { class: "gallery__grid" });
      rest.forEach(function (p, i) {
        var btn = h("button", { type: "button", class: "thumb__btn" }, [photoImg(p.key, { small: true }), brokenNote()]);
        bind(btn, function () { return t("photoOf", { place: L(p.place) }); }, "aria-label");
        btn.addEventListener("click", function () { Lightbox.open(r.photos, i + 1, btn, r.color); });
        grid.appendChild(h("li", { class: "thumb" }, [h("figure", null, [
          btn,
          h("figcaption", { class: "thumb__cap" }, [
            ht("strong", null, function () { return L(p.place); }),
            ht("span", null, function () { return L(p.caption); }),
          ]),
        ])]));
      });
      det.appendChild(grid);
      det.appendChild(ht("p", { class: "gallery__note" }, function () { return t("gallerySeason"); }));
      art.appendChild(det);

      // 콘셉트 + 후보
      var info = h("div", { class: "region__info" }, [
        h("p", { class: "region__concept" }, [
          ht("span", { class: "region__k" }, function () { return t("conceptLabel"); }),
          ht("span", null, function () { return L(r.concept); }),
        ]),
        h("div", { class: "region__spots" }, [
          h("p", { class: "region__k" }, [ht("span", null, function () { return t("spotsLabel"); }), badge("cand")]),
          h("ul", null, r.spots.map(function (s) {
            return h("li", null, [ht("strong", null, function () { return L(s.name); }), ht("span", null, function () { return L(s.text); })]);
          })),
        ]),
        h("p", { class: "region__caution" }, [
          ht("span", { class: "region__k" }, function () { return t("cautionLabel"); }),
          ht("span", null, function () { return L(r.caution); }),
        ]),
      ]);
      art.appendChild(info);

      // 세부 지도
      var mapBox = h("div", { class: "region__map" });
      mapBox.appendChild(h("h4", { class: "region__maptitle" }, [ht("span", null, function () { return t("regionMap"); })]));
      var shell = mapShell(function () { return L(r.name); });
      mapBox.appendChild(shell.frame);
      mapBox.appendChild(shell.tools);
      var legend = h("ol", { class: "map-points" });
      r.map.forEach(function (id, i) {
        var p = P[id];
        legend.appendChild(h("li", null, [
          h("span", { class: "map-points__n mk-k--" + p.kind, "aria-hidden": "true", text: String(i + 1) }),
          ht("span", { class: "map-points__name" }, function () { return L(p.name); }),
          gmapsLink(p),
        ]));
      });
      mapBox.appendChild(legend);
      art.appendChild(mapBox);
      root.appendChild(art);

      var markers = r.map.map(function (id, i) {
        var p = P[id];
        var kind = p.kind === "airport" ? "airport" : p.kind === "spot" ? "spot" : "stay";
        return {
          p: p, label: String(i + 1), kind: kind,
          html: function () { return "<span>" + (i + 1) + "</span>"; },
          popup: function () { return popupHtml((i + 1) + ". " + L(p.name), [p.en]); },
        };
      });
      shell.el.style.setProperty("--mk", r.color);
      whenNear(shell.el, function () { buildMap({ shell: shell, markers: markers, maxZoom: 15 }); });
    });
  }

  /* ---------- 주의사항 ---------- */
  function renderNotices(c) {
    var ol = document.getElementById("notice-list");
    c.notices.forEach(function (n) {
      ol.appendChild(h("li", { class: "notice__item" }, [
        h("strong", { class: "notice__title" }, [ht("span", null, function () { return L(n.title); }), n.check ? badge("check") : null]),
        ht("p", null, function () { return L(n.body); }),
      ]));
    });
  }

  /* ---------- 출처 ---------- */
  function renderCredits() {
    var ol = document.getElementById("credits-list");
    if (!ol) return;
    var photos = [];
    if (COURSE) COURSE.regions.forEach(function (r) { photos = photos.concat(r.photos); });
    else {
      var heroKey = document.body.getAttribute("data-hero");
      COURSES.forEach(function (c) {
        if (c.status !== "ready") return;
        c.regions.forEach(function (r) { r.photos.forEach(function (p) { if (p.key === c.hero || p.key === heroKey) photos.push(p); }); });
      });
    }
    var seen = {};
    photos.forEach(function (p) {
      var cr = CREDITS[p.key];
      if (!cr || seen[p.key]) return;
      seen[p.key] = true;
      ol.appendChild(h("li", null, [
        ht("strong", null, function () { return L(p.place); }),
        h("span", { text: " — " + cr.artist + ", " }),
        cr.licenseUrl ? h("a", { href: cr.licenseUrl, target: "_blank", rel: "noopener", text: cr.license }) : h("span", { text: cr.license }),
        h("span", { text: " · " }),
        ht("a", { href: cr.page, target: "_blank", rel: "noopener" }, function () { return t("viewSource") + " (Wikimedia Commons)"; }),
      ]));
    });
  }

  /* ---------- data-i18n ---------- */
  function bindStatic() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      bind(el, function () { return t(k); });
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var k = el.getAttribute("data-i18n-html");
      bind(el, function () { return t(k); }, "html");
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var p = pair.split(":");
        bind(el, function () { return t(p[1]); }, p[0]);
      });
    });
  }

  /* =========================================================
   * 라이트박스
   * ========================================================= */
  var Lightbox = (function () {
    var root = document.getElementById("lightbox");
    var img = document.getElementById("lb-img");
    var err = document.getElementById("lb-error");
    var title = document.getElementById("lb-title");
    var desc = document.getElementById("lb-desc");
    var credit = document.getElementById("lb-credit");
    var count = document.getElementById("lb-count");
    var prevBtn = document.getElementById("lb-prev");
    var nextBtn = document.getElementById("lb-next");
    var closeBtn = root.querySelector(".lightbox__btn--close");
    var photos = null, idx = 0, opener = null, scrollY = 0;

    function show() {
      var p = photos[idx];
      err.hidden = true;
      img.hidden = false;
      img.src = IMG + p.key + ".webp";
      img.alt = L(p.place) + " — " + L(p.caption);
      title.textContent = L(p.place);
      desc.textContent = L(p.caption);
      credit.textContent = creditText(p.key);
      count.textContent = t("lbCount", { i: idx + 1, n: photos.length });
      var single = photos.length < 2;
      prevBtn.hidden = single; nextBtn.hidden = single;
      if (!single) (new Image()).src = IMG + photos[(idx + 1) % photos.length].key + ".webp";
    }
    img.addEventListener("error", function () {
      if (!photos) return;
      img.hidden = true;
      err.hidden = false;
      err.textContent = t("imgError");
    });
    function go(d) { idx = (idx + d + photos.length) % photos.length; show(); }
    function open(list, i, from, color) {
      photos = list; idx = i; opener = from || document.activeElement;
      scrollY = window.scrollY;
      document.documentElement.classList.add("is-locked");
      root.hidden = false;
      root.style.setProperty("--c", color || "#25313A");
      show();
      requestAnimationFrame(function () { root.classList.add("is-open"); closeBtn.focus(); });
    }
    function close() {
      if (root.hidden) return;
      root.classList.remove("is-open");
      root.hidden = true;
      document.documentElement.classList.remove("is-locked");
      window.scrollTo(0, scrollY);
      photos = null;
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
    root.addEventListener("click", function (e) { if (e.target.closest("[data-lb-close]")) close(); });
    prevBtn.addEventListener("click", function () { go(-1); });
    nextBtn.addEventListener("click", function () { go(1); });
    document.addEventListener("keydown", function (e) {
      if (root.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowLeft" && photos.length > 1) { e.preventDefault(); go(-1); }
      else if (e.key === "ArrowRight" && photos.length > 1) { e.preventDefault(); go(1); }
      else if (e.key === "Tab") {
        var f = [closeBtn, prevBtn, nextBtn].filter(function (b) { return !b.hidden; });
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    var sx = null, sy = null;
    root.addEventListener("touchstart", function (e) { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (photos && photos.length > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) close();
      sx = sy = null;
    });
    return { open: open, refresh: function () { if (photos) show(); } };
  })();

  /* =========================================================
   * 언어 전환 (스크롤 위치 유지)
   * ========================================================= */
  function findAnchor() {
    var y = Math.min(window.innerHeight * 0.3, 200);
    var el = document.elementFromPoint(window.innerWidth / 2, y);
    while (el && el !== document.body && el.getBoundingClientRect().height > window.innerHeight) el = el.firstElementChild;
    return el && el !== document.body ? { el: el, top: el.getBoundingClientRect().top } : null;
  }
  function setLang(next, opts) {
    if (next !== "ko" && next !== "ja") return;
    var anchor = opts && opts.keepScroll ? findAnchor() : null;
    lang = next;
    document.documentElement.lang = next;
    document.title = COURSE ? L(COURSE.short) + " · " + t("siteName") : t("metaTitle");
    document.querySelectorAll(".lang-switch__btn").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === next ? "true" : "false");
    });
    runBinds();
    langHooks.forEach(function (fn) { fn(); });
    Lightbox.refresh();
    if (anchor && anchor.el.isConnected) {
      var delta = anchor.el.getBoundingClientRect().top - anchor.top;
      if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "instant" });
    }
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* 무시 */ }
  }

  /* =========================================================
   * 내비게이션
   * ========================================================= */
  function initNav() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      var target = id && document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      if (history.replaceState) history.replaceState(null, "", "#" + id);
      var heading = target.matches("h2, h3") ? target : target.querySelector("h2, h3");
      if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
    });

    var links = Array.prototype.slice.call(document.querySelectorAll(".jump-nav a"));
    function mark(key) {
      links.forEach(function (a) {
        var on = a.getAttribute("data-nav") === key;
        a.classList.toggle("is-current", on);
        if (on) a.setAttribute("aria-current", key === "home" ? "page" : "location"); else a.removeAttribute("aria-current");
      });
    }
    if (!COURSE) { mark("home"); return; }
    var sections = links.map(function (a) { return a.getAttribute("data-nav"); })
      .filter(function (k) { return k !== "home"; })
      .map(function (k) { return document.getElementById(k); })
      .filter(Boolean);
    function update() {
      var cur = null, line = window.innerHeight * 0.35;
      sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) cur = s.id; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = sections[sections.length - 1].id;
      mark(cur);
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("load", update);
    update();
  }

  /* =========================================================
   * 시작
   * ========================================================= */
  bindStatic();
  if (COURSE) {
    renderHero(COURSE);
    renderOverview(COURSE);
    renderWideMap(COURSE);
    renderDays(COURSE);
    renderTrains(COURSE);
    renderRegions(COURSE);
    renderNotices(COURSE);
  } else {
    renderCandidates();
  }
  renderCredits();
  initNav();

  document.querySelectorAll(".lang-switch__btn").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang"), { keepScroll: true }); });
  });
  setLang(lang);

  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) requestAnimationFrame(function () { target.scrollIntoView(); });
  }
})();
