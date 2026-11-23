/* =========================================================
 * 일본 연말연시 8박 9일 — 코스 비교 사이트
 * Vanilla JS. 구조: DOM은 한 번만 만들고, 언어 전환 시에는
 * 바인딩된 텍스트만 교체한다 → 스크롤·열린 갤러리·지도 상태 유지.
 * ========================================================= */
(function () {
  "use strict";

  var T = window.TRANSLATIONS;
  var COURSES = window.COURSES;
  var CREDITS = window.PHOTO_CREDITS || {};
  var STORAGE_KEY = "jwt-lang";
  var IMG = "assets/images/";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  var PAGE = document.body.getAttribute("data-page") || "home";
  var COURSE = COURSES.filter(function (c) { return c.id === PAGE; })[0] || null;
  function pageUrl(c) { return c.id + ".html"; }

  /* ---------- 언어 상태 ---------- */
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

  /* ---------- 바인딩: 언어 전환 시 다시 계산할 텍스트 ---------- */
  var binds = [];
  function bind(el, fn, mode) {
    binds.push({ el: el, fn: fn, mode: mode || "text" });
    return el;
  }
  function runBinds() {
    binds.forEach(function (b) {
      var v = b.fn();
      if (b.mode === "text") b.el.textContent = v;
      else if (b.mode === "html") b.el.innerHTML = v;
      else b.el.setAttribute(b.mode, v);
    });
  }
  var langHooks = []; // 지도 팝업 등 별도 갱신 함수

  /* ---------- DOM 헬퍼 ---------- */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "style") el.setAttribute("style", v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return el;
  }
  // 언어 바인딩된 요소 생성
  function ht(tag, attrs, fn, mode) { return bind(h(tag, attrs), fn, mode); }

  /* ---------- 날짜 ---------- */
  var start = window.TRIP.start;
  function dateOf(day) { return new Date(start[0], start[1], start[2] + day - 1); }
  var fmtCache = {};
  function fmt(day, opts) {
    var loc = lang === "ja" ? "ja-JP" : "ko-KR";
    var key = loc + JSON.stringify(opts);
    if (!fmtCache[key]) {
      try { fmtCache[key] = new Intl.DateTimeFormat(loc, opts); } catch (e) { fmtCache[key] = null; }
    }
    var d = dateOf(day);
    return fmtCache[key] ? fmtCache[key].format(d) : (d.getMonth() + 1) + "/" + d.getDate();
  }
  function md(day) { var d = dateOf(day); return (d.getMonth() + 1) + "/" + d.getDate(); }
  function weekday(day) { return fmt(day, { weekday: "short" }); }
  function isoDate(day) {
    var d = dateOf(day);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function dayLabel(days) {
    if (!days || !days.length) return "";
    // 연속 구간으로 묶기: [1,2,8] → 1–2 / 8
    var groups = [], g = [days[0]];
    for (var i = 1; i < days.length; i++) {
      if (days[i] === days[i - 1] + 1) g.push(days[i]); else { groups.push(g); g = [days[i]]; }
    }
    groups.push(g);
    return groups.map(function (gr) {
      return gr.length === 1 ? t("dayN", { n: gr[0] }) : t("dayRange", { a: gr[0], b: gr[gr.length - 1] });
    }).join(t("daysJoin"));
  }
  function dateRangeLabel(days) {
    if (!days || !days.length) return "";
    var a = days[0], b = days[days.length - 1];
    var contiguous = b - a === days.length - 1;
    if (!contiguous) return days.map(function (d) { return md(d) + "(" + weekday(d) + ")"; }).join(t("daysJoin"));
    return a === b ? md(a) + "(" + weekday(a) + ")" : md(a) + "(" + weekday(a) + ")–" + md(b) + "(" + weekday(b) + ")";
  }

  /* ---------- 이미지 ---------- */
  function photoImg(key, opts) {
    var c = CREDITS[key] || { w: 1600, h: 1067 };
    var img = h("img", {
      src: IMG + key + (opts.small ? "-sm" : "") + ".webp",
      srcset: opts.small ? null : IMG + key + "-sm.webp 720w, " + IMG + key + ".webp 1600w",
      sizes: opts.sizes || null,
      width: c.w, height: c.h,
      loading: opts.eager ? "eager" : "lazy",
      decoding: "async",
      fetchpriority: opts.eager ? "high" : null,
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
    if (!c) return "";
    return t("by") + ": " + c.artist + " · " + c.license + " · Wikimedia Commons";
  }

  /* =========================================================
   * 렌더링
   * ========================================================= */
  function renderCards() {
    var list = document.getElementById("course-cards");
    if (!list) return;
    COURSES.forEach(function (c) {
      var lead = c.photos[0];
      var a = h("a", { class: "card__link", href: pageUrl(c) });
      var nightsLine = h("p", { class: "card__nights" });
      bind(nightsLine, function () {
        return c.stops.filter(function (s) { return s.nights; })
          .map(function (s) { return L(s.name) + " " + s.nights; }).join(" · ");
      });
      a.appendChild(h("div", { class: "card__media" }, [photoImg(lead.key, { small: true }), brokenNote()]));
      a.appendChild(h("div", { class: "card__body" }, [
        h("p", { class: "card__num", "aria-hidden": "true" }, ["0" + c.num]),
        ht("h3", { class: "card__title" }, function () { return L(c.name); }),
        ht("p", { class: "card__style" }, function () { return L(c.style); }),
        h("ul", { class: "tags" }, c.tags.map(function (tg) { return ht("li", { class: "tag" }, function () { return L(tg); }); })),
        nightsLine,
        h("span", { class: "card__cta" }, [ht("span", null, function () { return t("cardCta"); }), h("span", { "aria-hidden": "true", text: " →" })]),
      ]));
      list.appendChild(h("li", { class: "card", style: "--c:" + c.color + ";--a:" + c.accent }, [a]));
    });
  }

  var onCoursePage = !!COURSE;
  function renderCourse(c) {
    var sec = h("section", { class: "course", id: c.id, "aria-labelledby": c.id + "-title", style: "--c:" + c.color + ";--a:" + c.accent });
    var wrap = h("div", { class: "wrap" });
    sec.appendChild(wrap);

    /* 1. 헤더 (코스 페이지에서는 히어로가 대신함) */
    if (!onCoursePage) wrap.appendChild(h("header", { class: "course__head" }, [
      h("p", { class: "course__num" }, [
        h("span", { "aria-hidden": "true", text: "0" + c.num }),
        ht("span", { class: "course__balance" }, function () { return L(c.balance); }),
      ]),
      ht("h2", { class: "course__title", id: c.id + "-title" }, function () { return L(c.title); }),
      ht("p", { class: "course__intro" }, function () { return L(c.intro); }),
      h("ul", { class: "tags tags--course" }, c.tags.map(function (tg) { return ht("li", { class: "tag" }, function () { return L(tg); }); })),
    ]));

    /* 2. 대표 사진 (항상 보임, 클릭 시 라이트박스) */
    var lead = c.photos[0];
    if (!onCoursePage) {
    var leadBtn = h("button", { type: "button", class: "lead-photo__btn" }, [photoImg(lead.key, { sizes: "(min-width: 1100px) 1040px, 100vw" }), brokenNote()]);
    bind(leadBtn, function () { return t("photoOf", { place: L(lead.place) }); }, "aria-label");
    leadBtn.addEventListener("click", function () { Lightbox.open(c, 0, leadBtn); });
    wrap.appendChild(h("figure", { class: "lead-photo" }, [
      leadBtn,
      h("figcaption", { class: "lead-photo__cap" }, [
        ht("strong", null, function () { return L(lead.place); }),
        ht("span", null, function () { return " — " + L(lead.caption); }),
      ]),
    ]));
    }

    /* 3. 지도 */
    var mapBlock = h("div", { class: "map-block" });
    mapBlock.appendChild(ht("h3", { class: "block-title" }, function () { return t("route"); }));
    var mapEl = h("div", { class: "map", id: "map-" + c.id, role: "region" });
    bind(mapEl, function () { return t("mapAria", { course: L(c.name) }); }, "aria-label");
    var mapFrame = h("div", { class: "map-frame" }, [mapEl]);
    var mapStatus = h("p", { class: "map-status", role: "status", hidden: true });
    mapFrame.appendChild(mapStatus);
    mapBlock.appendChild(mapFrame);

    var tools = h("div", { class: "map-tools" });
    var fitBtn = ht("button", { type: "button", class: "btn btn--ghost" }, function () { return t("mapFit"); });
    var lockBtn = h("button", { type: "button", class: "btn btn--ghost", "aria-pressed": "false" });
    tools.appendChild(fitBtn);
    tools.appendChild(lockBtn);
    mapBlock.appendChild(tools);
    mapBlock.appendChild(ht("p", { class: "map-note" }, function () { return t("mapDisclaimer"); }));
    wrap.appendChild(mapBlock);

    /* 4. 이동 순서 (지도 실패 시에도 항상 읽을 수 있는 텍스트 경로) */
    var routeBlock = h("div", { class: "route-block" });
    routeBlock.appendChild(ht("h3", { class: "block-title" }, function () { return t("routeOrder"); }));
    var ol = h("ol", { class: "route" });
    var labels = c.routeLabels || c.route.map(function (si, i) { return { stop: si, n: i + 1 }; });
    labels.forEach(function (lb) {
      var s = c.stops[lb.stop];
      var days = lb.days || s.days;
      var nights = lb.nights != null ? lb.nights : s.nights;
      var gm = h("a", {
        class: "route__ext",
        href: "https://www.google.com/maps/search/?api=1&query=" + s.lat + "%2C" + s.lng,
        target: "_blank", rel: "noopener",
      });
      bind(gm, function () { return t("openGmaps"); });
      bind(gm, function () { return t("openGmapsAria", { place: L(lb.name || s.name) }); }, "aria-label");
      ol.appendChild(h("li", { class: "route__item" }, [
        h("span", { class: "route__n", "aria-hidden": "true", text: String(lb.n) }),
        h("div", { class: "route__txt" }, [
          ht("strong", { class: "route__name" }, function () { return L(lb.name || s.name); }),
          ht("span", { class: "route__meta" }, function () {
            var parts = [dayLabel(days), dateRangeLabel(days)];
            if (nights) parts.push(t("nightsUnit", { n: nights }));
            else if (s.stopover) parts.push(t("stopover"));
            else if (s.departure) parts.push(t("departure"));
            return parts.join(" · ");
          }),
        ]),
        gm,
      ]));
    });
    routeBlock.appendChild(ol);
    var b = bounds(c);
    var osm = h("a", {
      class: "text-link",
      href: "https://www.openstreetmap.org/?minlat=" + b[0][0] + "&minlon=" + b[0][1] + "&maxlat=" + b[1][0] + "&maxlon=" + b[1][1],
      target: "_blank", rel: "noopener",
    });
    bind(osm, function () { return t("openOsm") + " ↗"; });
    routeBlock.appendChild(osm);
    wrap.appendChild(routeBlock);

    /* 5. 날짜별 일정 */
    var itBlock = h("div", { class: "itinerary-block" });
    var total = c.stops.reduce(function (sum, s) { return sum + (s.nights || 0); }, 0);
    itBlock.appendChild(h("div", { class: "block-head" }, [
      ht("h3", { class: "block-title" }, function () { return t("itinerary"); }),
      ht("span", { class: "pill" }, function () { return t("nightsTotal", { n: total }); }),
    ]));
    var days = h("ol", { class: "days" });
    c.itinerary.forEach(function (it, i) {
      var day = i + 1;
      var region = it.region || (it.stop != null ? c.stops[it.stop].name : null);
      days.appendChild(h("li", { class: "day" + (it.depart ? " day--depart" : "") }, [
        h("div", { class: "day__date" }, [
          ht("span", { class: "day__n" }, function () { return t("dayN", { n: day }); }),
          h("time", { datetime: isoDate(day), class: "day__md" }, [
            h("span", { class: "day__mmdd", text: md(day) }),
            ht("span", { class: "day__wd" }, function () { return weekday(day); }),
          ]),
        ]),
        h("div", { class: "day__body" }, [
          ht("p", { class: "day__region" }, function () { return L(region); }),
          ht("p", { class: "day__text" }, function () { return L(it); }),
        ]),
      ]));
    });
    itBlock.appendChild(days);
    wrap.appendChild(itBlock);

    /* 6. 사진 갤러리 (기본 접힘) */
    var rest = c.photos.slice(1);
    var det = h("details", { class: "gallery", id: c.id + "-gallery" });
    var sumLabel = h("span", { class: "gallery__label" });
    bind(sumLabel, function () { return (det.open ? t("galleryLess") : t("galleryMore")) + " (" + rest.length + ")"; });
    det.appendChild(h("summary", { class: "gallery__summary" }, [sumLabel, h("span", { class: "gallery__chev", "aria-hidden": "true" })]));
    det.addEventListener("toggle", function () { sumLabel.textContent = (det.open ? t("galleryLess") : t("galleryMore")) + " (" + rest.length + ")"; });
    var grid = h("ul", { class: "gallery__grid" });
    rest.forEach(function (p, i) {
      var btn = h("button", { type: "button", class: "thumb__btn" }, [photoImg(p.key, { small: true }), brokenNote()]);
      bind(btn, function () { return t("photoOf", { place: L(p.place) }); }, "aria-label");
      btn.addEventListener("click", function () { Lightbox.open(c, i + 1, btn); });
      grid.appendChild(h("li", { class: "thumb" }, [
        h("figure", null, [
          btn,
          h("figcaption", { class: "thumb__cap" }, [
            ht("strong", null, function () { return L(p.place); }),
            ht("span", null, function () { return L(p.caption); }),
          ]),
        ]),
      ]));
    });
    det.appendChild(grid);
    det.appendChild(ht("p", { class: "gallery__note" }, function () { return t("gallerySeason"); }));
    wrap.appendChild(det);

    /* 7. 장점·주의 */
    wrap.appendChild(h("div", { class: "proscons" }, [
      h("div", { class: "proscons__box proscons__box--pro" }, [
        ht("h3", { class: "proscons__title" }, function () { return t("pros"); }),
        h("ul", null, c.pros.map(function (p) { return ht("li", null, function () { return L(p); }); })),
      ]),
      h("div", { class: "proscons__box proscons__box--con" }, [
        ht("h3", { class: "proscons__title" }, function () { return t("cautions"); }),
        h("ul", null, c.cautions.map(function (p) { return ht("li", null, function () { return L(p); }); })),
      ]),
    ]));

    document.getElementById("course-sections").appendChild(sec);
    initMap(c, mapEl, mapStatus, fitBtn, lockBtn);
  }

  function bounds(c) {
    var lats = c.stops.map(function (s) { return s.lat; }), lngs = c.stops.map(function (s) { return s.lng; });
    return [[Math.min.apply(null, lats), Math.min.apply(null, lngs)], [Math.max.apply(null, lats), Math.max.apply(null, lngs)]];
  }

  /* ---------- 지도 ---------- */
  function initMap(c, el, status, fitBtn, lockBtn) {
    function showStatus(key) {
      status.hidden = false;
      bind(status, function () { return t(key); });
      status.textContent = t(key);
    }
    if (!window.L || !window.L.map) {
      el.classList.add("map--failed");
      showStatus("mapLoadError");
      fitBtn.hidden = true; lockBtn.hidden = true;
      return;
    }
    var Lf = window.L;
    var map = Lf.map(el, {
      scrollWheelZoom: false,
      dragging: !isTouch,
      tap: false,
      zoomSnap: 0.25,
      attributionControl: true,
    });
    Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).on("tileerror", function () {
      tileErrors++;
      if (tileErrors >= 4 && status.hidden) showStatus("mapTileError");
    }).addTo(map);
    var tileErrors = 0;

    var b = Lf.latLngBounds(c.stops.map(function (s) { return [s.lat, s.lng]; }));
    function fit() { map.fitBounds(b, { padding: [28, 28], maxZoom: 9, animate: false }); }
    fit();

    // 개략 동선: 점선 폴리라인 (실제 경로로 오인하지 않도록)
    Lf.polyline(c.route.map(function (i) { return [c.stops[i].lat, c.stops[i].lng]; }), {
      color: c.color, weight: 3, opacity: 0.85, dashArray: "6 8", lineCap: "round",
    }).addTo(map);

    // 마커 (재방문 지점은 하나로 합침)
    var labelsByStop = {};
    (c.routeLabels || c.route.map(function (si, i) { return { stop: si, n: i + 1 }; })).forEach(function (lb) {
      (labelsByStop[lb.stop] = labelsByStop[lb.stop] || []).push(lb);
    });
    c.stops.forEach(function (s, idx) {
      var lbls = labelsByStop[idx] || [{ n: idx + 1 }];
      var text = (c.markerLabels && c.markerLabels[idx]) || String(lbls[0].n);
      var wide = text.length > 2;
      var icon = Lf.divIcon({
        className: "num-marker" + (wide ? " num-marker--wide" : "") + (s.departure ? " num-marker--end" : ""),
        html: "<span>" + text + "</span>",
        iconSize: wide ? [46, 30] : [30, 30],
        iconAnchor: wide ? [23, 15] : [15, 15],
        popupAnchor: [0, -14],
      });
      var m = Lf.marker([s.lat, s.lng], { icon: icon, keyboard: true, riseOnHover: true }).addTo(map);
      function popupHtml() {
        var meta = lbls.map(function (lb) {
          var d = lb.days || s.days;
          return dayLabel(d) + " · " + dateRangeLabel(d);
        }).join("<br>");
        return '<div class="pop" lang="' + lang + '"><strong class="pop__name">' + text + ". " + esc(L(s.name)) + "</strong>" +
          '<span class="pop__meta">' + esc(meta).replace(/&lt;br&gt;/g, "<br>") + "</span>" +
          '<span class="pop__desc">' + esc(L(s.desc)) + "</span></div>";
      }
      m.bindPopup(popupHtml(), { maxWidth: 240, autoPanPadding: [20, 20] });
      function updateA11y() {
        var elx = m.getElement();
        if (elx) { elx.setAttribute("title", text + ". " + L(s.name)); elx.setAttribute("aria-label", text + ". " + L(s.name)); }
      }
      updateA11y();
      langHooks.push(function () { m.setPopupContent(popupHtml()); updateA11y(); });
    });

    fitBtn.addEventListener("click", function () { map.closePopup(); fit(); });

    // 터치 기기: 기본은 페이지 스크롤 우선(한 손가락 드래그 OFF), 버튼으로 조작 모드 전환
    var unlocked = false;
    function setLock(on) {
      unlocked = on;
      if (on) { map.dragging.enable(); map.scrollWheelZoom.enable(); }
      else { if (isTouch) map.dragging.disable(); map.scrollWheelZoom.disable(); }
      lockBtn.setAttribute("aria-pressed", on ? "true" : "false");
      el.classList.toggle("map--active", on);
      lockBtn.textContent = on ? t("mapLock") : t("mapUnlock");
    }
    bind(lockBtn, function () { return unlocked ? t("mapLock") : t("mapUnlock"); });
    lockBtn.addEventListener("click", function () { setLock(!unlocked); });
    setLock(false);

    if (isTouch) {
      var hint = h("p", { class: "map-hint" });
      bind(hint, function () { return t("mapHintTouch"); });
      hint.textContent = t("mapHintTouch");
      lockBtn.parentNode.appendChild(hint);
    }

    // 레이아웃 변화(폰트 로딩, 회전 등) 시 크기 재계산
    // 사용자가 지도를 만지기 전이라면 전체 경로가 보이도록 다시 맞춘다
    var touched = false;
    el.addEventListener("pointerdown", function () { touched = true; });
    el.addEventListener("keydown", function () { touched = true; });
    if ("ResizeObserver" in window) new ResizeObserver(function () {
      map.invalidateSize();
      if (!touched) fit();
    }).observe(el);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  /* ---------- 비교표·추천·주의사항·출처 ---------- */
  function renderCompare() {
    var table = document.getElementById("compare-table");
    if (!table) return;
    var thead = h("thead"), tr = h("tr");
    tr.appendChild(ht("th", { scope: "col" }, function () { return t("compareItem"); }));
    COURSES.forEach(function (c) {
      tr.appendChild(h("th", { scope: "col", style: "--c:" + c.color }, [
        h("a", { href: pageUrl(c), class: "compare__course" }, [ht("span", null, function () { return L(c.name); })]),
      ]));
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    var tbody = h("tbody");
    window.COMPARE.rows.forEach(function (row) {
      var r = h("tr");
      r.appendChild(ht("th", { scope: "row" }, function () { return L(row.label); }));
      row.values.forEach(function (v, i) {
        var c = COURSES[i];
        var td = h("td", { style: "--c:" + c.color, class: v.warn ? "is-warn" : null });
        td.appendChild(ht("span", { class: "compare__label", "aria-hidden": "true" }, function () { return L(c.name); }));
        var val = h("span", { class: "compare__val" });
        if (v.lv) {
          val.appendChild(h("span", { class: "meter meter--" + v.lv, "aria-hidden": "true" }, [h("i"), h("i"), h("i")]));
        }
        val.appendChild(ht("span", null, function () { return L(v); }));
        td.appendChild(val);
        r.appendChild(td);
      });
      tbody.appendChild(r);
    });
    table.appendChild(tbody);

    var rec = document.getElementById("recommend");
    window.RECOMMEND.forEach(function (r) {
      var c = COURSES.filter(function (x) { return x.id === r.course; })[0];
      rec.appendChild(h("li", { class: "recommend__item", style: "--c:" + c.color + ";--a:" + c.accent }, [
        h("a", { href: pageUrl(c), class: "recommend__link" }, [
          ht("span", { class: "recommend__when" }, function () { return L(r); }),
          h("span", { class: "recommend__course" }, [ht("span", null, function () { return L(c.name); }), h("span", { "aria-hidden": "true", text: " →" })]),
        ]),
      ]));
    });
  }

  function renderNotices() {
    var ol = document.getElementById("notice-list");
    if (!ol) return;
    window.NOTICES.forEach(function (n) {
      ol.appendChild(h("li", { class: "notice__item" }, [
        ht("strong", { class: "notice__title" }, function () { return L(n.title); }),
        ht("p", null, function () { return L(n.body); }),
      ]));
    });
    var refs = document.getElementById("refs");
    window.REFERENCES.forEach(function (r) {
      refs.appendChild(h("li", null, [ht("a", { href: r.url, target: "_blank", rel: "noopener" }, function () { return L(r) + " ↗"; })]));
    });
  }

  function renderCredits() {
    var ol = document.getElementById("credits-list");
    (COURSE ? [COURSE] : COURSES).forEach(function (c) {
      c.photos.forEach(function (p) {
        var cr = CREDITS[p.key];
        if (!cr) return;
        ol.appendChild(h("li", null, [
          ht("strong", null, function () { return L(p.place); }),
          h("span", { text: " — " + cr.artist + ", " }),
          cr.licenseUrl ? h("a", { href: cr.licenseUrl, target: "_blank", rel: "noopener", text: cr.license }) : h("span", { text: cr.license }),
          h("span", { text: " · " }),
          ht("a", { href: cr.page, target: "_blank", rel: "noopener" }, function () { return t("viewSource") + " (Wikimedia Commons)"; }),
        ]));
      });
    });
  }

  /* ---------- 코스 페이지: 히어로·이전/다음 코스 ---------- */
  function renderCourseHero(c) {
    var lead = c.photos[0];
    bind(document.getElementById("hero-eyebrow"), function () { return t("courseLabel", { n: "0" + c.num }) + " · " + L(c.balance); });
    bind(document.getElementById("hero-title"), function () { return L(c.title); });
    bind(document.getElementById("hero-sub"), function () { return L(c.intro); });
    var tags = document.getElementById("hero-tags");
    c.tags.forEach(function (tg) { tags.appendChild(ht("li", { class: "tag tag--light" }, function () { return L(tg); })); });
    var cr = CREDITS[lead.key];
    bind(document.getElementById("hero-credit"), function () { return L(lead.place) + (cr ? " · " + cr.artist + ", " + cr.license : ""); });
    var btn = document.getElementById("hero-photo");
    btn.hidden = false;
    btn.addEventListener("click", function () { Lightbox.open(c, 0, btn); });
    document.body.style.setProperty("--c", c.color);
    document.body.style.setProperty("--a", c.accent);
  }

  function renderPager(c) {
    var nav = document.getElementById("pager");
    if (!nav) return;
    var i = COURSES.indexOf(c);
    var prev = COURSES[(i - 1 + COURSES.length) % COURSES.length];
    var next = COURSES[(i + 1) % COURSES.length];
    function link(target, dirKey, cls) {
      return h("a", { class: "pager__link " + cls, href: pageUrl(target), style: "--c:" + target.color }, [
        ht("span", { class: "pager__dir" }, function () { return t(dirKey); }),
        ht("strong", { class: "pager__name" }, function () { return L(target.name); }),
      ]);
    }
    nav.appendChild(link(prev, "prevCourse", "pager__link--prev"));
    nav.appendChild(link(next, "nextCourse", "pager__link--next"));
    nav.appendChild(h("a", { class: "pager__compare", href: "index.html#compare" }, [ht("span", null, function () { return t("compareAll") + " →"; })]));
  }

  /* ---------- 정적 HTML의 data-i18n ---------- */
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
    var course = null, idx = 0, opener = null, scrollY = 0;

    function show() {
      var p = course.photos[idx];
      err.hidden = true;
      img.hidden = false;
      img.src = IMG + p.key + ".webp";
      img.alt = L(p.place) + " — " + L(p.caption);
      title.textContent = L(p.place);
      desc.textContent = L(p.caption);
      credit.textContent = creditText(p.key);
      count.textContent = t("lbCount", { i: idx + 1, n: course.photos.length });
      // 다음 사진 미리 불러오기
      var nx = course.photos[(idx + 1) % course.photos.length];
      (new Image()).src = IMG + nx.key + ".webp";
    }
    img.addEventListener("error", function () {
      if (!course) return;
      img.hidden = true;
      err.hidden = false;
      err.textContent = t("imgError");
    });
    function go(d) { idx = (idx + d + course.photos.length) % course.photos.length; show(); }
    function open(c, i, from) {
      course = c; idx = i; opener = from || document.activeElement;
      scrollY = window.scrollY;
      document.documentElement.classList.add("is-locked");
      root.hidden = false;
      root.style.setProperty("--c", c.color);
      show();
      requestAnimationFrame(function () { root.classList.add("is-open"); closeBtn.focus(); });
    }
    function close() {
      if (root.hidden) return;
      root.classList.remove("is-open");
      root.hidden = true;
      document.documentElement.classList.remove("is-locked");
      window.scrollTo(0, scrollY);
      course = null;
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    }
    root.addEventListener("click", function (e) { if (e.target.closest("[data-lb-close]")) close(); });
    prevBtn.addEventListener("click", function () { go(-1); });
    nextBtn.addEventListener("click", function () { go(1); });
    document.addEventListener("keydown", function (e) {
      if (root.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "Tab") {
        // 포커스 트랩
        var f = [closeBtn, prevBtn, nextBtn];
        var i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    // 터치 스와이프
    var sx = null, sy = null;
    root.addEventListener("touchstart", function (e) { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
    root.addEventListener("touchend", function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) close();
      sx = sy = null;
    });
    return { open: open, close: close, refresh: function () { if (course) show(); } };
  })();

  /* =========================================================
   * 언어 전환 (스크롤 위치 유지)
   * ========================================================= */
  function findAnchor() {
    // 화면 상단 근처에 있는 요소를 기준점으로 삼아 전환 후 같은 위치로 복원
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
    document.title = COURSE ? L(COURSE.title) + " · " + t("siteName") : t("metaTitle");
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
   * 내비게이션: 부드러운 이동 + 현재 섹션 표시
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
      // 포커스를 섹션 제목으로 옮겨 키보드·스크린리더 사용자도 이동을 인지
      var heading = target.querySelector("h2");
      if (heading) { heading.setAttribute("tabindex", "-1"); heading.focus({ preventScroll: true }); }
    });

    var links = Array.prototype.slice.call(document.querySelectorAll(".jump-nav a"));
    function mark(key) {
      links.forEach(function (a) {
        var on = a.getAttribute("data-nav") === key;
        a.classList.toggle("is-current", on);
        if (on) a.setAttribute("aria-current", COURSE || key === "home" ? "page" : "location"); else a.removeAttribute("aria-current");
      });
    }
    if (COURSE) { mark(COURSE.id); return; }
    mark("home");
    var cmp = document.getElementById("compare");
    if (!cmp) return;
    function update() { mark(cmp.getBoundingClientRect().top < window.innerHeight * 0.5 ? "compare" : "home"); }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("load", update);
    update();
  }

  /* =========================================================
   * 시작
   * ========================================================= */
  bindStatic();
  renderCards();
  if (COURSE) { renderCourseHero(COURSE); renderCourse(COURSE); renderPager(COURSE); }
  renderCompare();
  renderNotices();
  renderCredits();
  initNav();

  document.querySelectorAll(".lang-switch__btn").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-lang"), { keepScroll: true }); });
  });
  setLang(lang);

  // 해시로 진입한 경우 렌더링 후 정확한 위치로 이동
  if (location.hash) {
    var target = document.getElementById(location.hash.slice(1));
    if (target) requestAnimationFrame(function () { target.scrollIntoView(); });
  }
})();
