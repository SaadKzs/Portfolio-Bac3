/*
  Saad Zebiri, portfolio : l'île
  1. Rendu du contenu depuis data.js
  2. Défilement fluide, ancres, navigation, points de progression
  3. Apparitions, étude de cas animée
  4. Interactions : boutons aimantés, carte de certification, filtres, visionneuse, copie
  Le monde 3D lui-même est dans island.js.
*/
(function () {
  "use strict";

  var D = window.PORTFOLIO || {};
  var root = document.documentElement;
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var HEX = "0123456789ABCDEF";

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function isExternal(href) { return /^https?:\/\//i.test(href || ""); }
  function list(arr) { return Array.isArray(arr) ? arr : []; }
  function world(method, arg) { if (window.SZWorld && window.SZWorld[method]) window.SZWorld[method](arg); }

  var ICON = {
    ext: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
    play: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
    doc: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6"/></svg>',
    image: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/></svg>',
    arrow: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>',
    shield: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    cloud: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.3 9.6 4.2 4.2 0 0 0 7 18z"/></svg>',
    network: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="5" rx="1.5"/><rect x="3" y="16" width="6" height="5" rx="1.5"/><rect x="15" y="16" width="6" height="5" rx="1.5"/><path d="M12 8v4M6 16v-2h12v2"/></svg>',
    code: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/></svg>'
  };
  var GROUP_STYLE = [
    { icon: ICON.shield, color: "var(--cyan)" },
    { icon: ICON.cloud, color: "#8fb2ff" },
    { icon: ICON.network, color: "var(--violet)" },
    { icon: ICON.code, color: "var(--coral)" }
  ];
  var SRC_LABEL = { stage: "Stage", cours: "Cours EPHEC", projets: "Projets", formation: "Formation" };
  var SRC_COLOR = { stage: "var(--coral)", cours: "#8fb2ff", projets: "var(--violet)", formation: "var(--cyan)" };
  var SEAL = '<svg class="seal" viewBox="0 0 96 110" aria-hidden="true"><path class="seal__shape" d="M48 4 92 29v52L48 106 4 81V29Z"/><path class="seal__check" d="M30 56l12 12 24-26"/></svg>';

  /* ================================================================
     1. Rendu
  ================================================================ */
  function target(name) { return $('[data-render="' + name + '"]'); }

  function linkHtml(l) {
    var ext = isExternal(l.href);
    return '<a class="btn btn--ghost btn--small" href="' + esc(l.href) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" +
      esc(l.label) + (ext ? ICON.ext + '<span class="visually-hidden"> (nouvel onglet)</span>' : "") + "</a>";
  }

  function renderAll() {
    var el;

    if ((el = target("experience"))) {
      el.innerHTML = list(D.experience).map(function (x) {
        return '<li class="tl-item">' +
          '<p class="tl-period">' + esc(x.period) + "</p>" +
          '<h3 class="tl-title">' + esc(x.title) + "</h3>" +
          '<p class="tl-org">' + esc(x.org) + "</p>" +
          (x.text ? '<p class="tl-text">' + esc(x.text) + "</p>" : "") +
          (list(x.points).length ? '<ul class="tl-points">' + x.points.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") + "</ul>" : "") +
          (x.link ? '<a class="tl-link" href="' + esc(x.link.href) + '">' + esc(x.link.label) + ICON.arrow + "</a>" : "") +
          "</li>";
      }).join("");
    }

    if ((el = target("projects"))) {
      el.innerHTML = list(D.projects).map(function (p) {
        var actions = list(p.links).map(linkHtml).join("");
        if (p.video && p.video.src) {
          actions += '<button class="btn btn--ghost btn--small" type="button" data-view="video" data-src="' + esc(p.video.src) + '" data-caption="' + esc(p.title) + '">' + ICON.play + esc(p.video.label || "Voir la vidéo") + "</button>";
        }
        return '<article class="project" data-accent="' + esc(p.accent || "aqua") + '">' +
          '<div class="project__meta"><span>' + esc(p.year) + "</span>" + (p.status ? "<span>" + esc(p.status) + "</span>" : "") + "</div>" +
          '<h3 class="project__title">' + esc(p.title) + "</h3>" +
          '<p class="project__summary">' + esc(p.summary) + "</p>" +
          (p.details ? '<p class="project__details">' + esc(p.details) + "</p>" : "") +
          (list(p.stack).length ? '<ul class="project__stack" aria-label="Technologies">' + p.stack.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>" : "") +
          (actions ? '<div class="project__links">' + actions + "</div>" : "") +
          "</article>";
      }).join("");
    }

    if ((el = target("experiments"))) {
      var items = list(D.experiments);
      el.innerHTML = items.length ? '<span class="experiments__label">À côté</span><ul>' + items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : "";
    }

    renderSkills();

    var c = D.certifications || {};
    if ((el = target("certs-earned"))) {
      el.innerHTML = list(c.earned).map(function (x) {
        return '<article class="cert" data-holo>' + SEAL + "<div>" +
          '<p class="cert__status">Obtenue' + (x.year ? " en " + esc(x.year) : "") + "</p>" +
          '<h3 class="cert__title">' + esc(x.title) + "</h3>" +
          '<p class="cert__issuer">' + esc(x.issuer) + "</p>" +
          (x.text ? '<p class="cert__text">' + esc(x.text) + "</p>" : "") +
          (x.proof && x.proof.src ? '<button class="btn btn--ghost btn--small" type="button" data-view="image" data-src="' + esc(x.proof.src) + '" data-caption="' + esc(x.title + ", " + x.issuer) + '">' + ICON.doc + esc(x.proof.label || "Voir le certificat") + "</button>" : "") +
          "</div></article>";
      }).join("");
    }
    if ((el = target("certs-next"))) {
      el.innerHTML = list(c.next).map(function (x) {
        return '<li class="next"><p class="next__title">' + esc(x.title) + "</p>" +
          (x.name ? '<p class="next__name">' + esc(x.name) + "</p>" : "") +
          (x.text ? '<p class="next__text">' + esc(x.text) + "</p>" : "") + "</li>";
      }).join("");
    }

    if ((el = target("events"))) {
      el.innerHTML = list(D.events).map(function (ev) {
        return '<li class="event">' +
          (ev.year ? '<span class="event__year">' + esc(ev.year) + "</span>" : "") +
          '<span class="event__title">' + esc(ev.title) + "</span>" +
          (ev.place ? '<span class="event__place">' + esc(ev.place) + "</span>" : "") +
          (ev.photo ? '<button class="event__photo" type="button" data-view="image" data-src="' + esc(ev.photo) + '" data-caption="' + esc(ev.title) + '">' + ICON.image + "Photo</button>" : "") +
          "</li>";
      }).join("");
    }

    var notes = list(D.notes);
    if (notes.length && (el = target("notes"))) {
      $("#notes").hidden = false;
      el.innerHTML = notes.map(function (n) {
        var title = n.href ? '<a href="' + esc(n.href) + '"' + (isExternal(n.href) ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + esc(n.title) + "</a>" : esc(n.title);
        return '<li class="note"><span class="note__date">' + esc(n.date) + (n.tag ? ", " + esc(n.tag) : "") + '</span><p class="note__title">' + title + "</p>" +
          (n.summary ? '<p class="note__summary">' + esc(n.summary) + "</p>" : "") + "</li>";
      }).join("");
    }
  }

  function renderSkills() {
    var el = target("skills"), fl = target("skill-filters"), groups = list(D.skills);
    if (!el) return;
    el.innerHTML = groups.map(function (g, gi) {
      var st = GROUP_STYLE[gi % GROUP_STYLE.length];
      return '<div class="skill-group"><h3><span class="skill-group__icon" style="--c:' + st.color + '">' + st.icon + "</span>" + esc(g.group) + "</h3><ul>" +
        list(g.items).map(function (it) {
          return '<li class="skill" data-src="' + esc(it.src) + '"><span class="skill__src" data-src="' + esc(it.src) + '" aria-hidden="true"></span>' +
            esc(it.name) + '<span class="visually-hidden"> (' + esc(SRC_LABEL[it.src] || it.src) + ")</span></li>";
        }).join("") + "</ul></div>";
    }).join("");
    if (!fl) return;
    var counts = { all: 0 };
    groups.forEach(function (g) { list(g.items).forEach(function (it) { counts.all++; counts[it.src] = (counts[it.src] || 0) + 1; }); });
    fl.innerHTML = ["all", "stage", "cours", "projets", "formation"].filter(function (k) { return counts[k]; }).map(function (k) {
      return '<button class="filter" type="button" data-filter="' + k + '" aria-pressed="' + (k === "all") + '">' +
        (k === "all" ? "" : '<span class="filter__dot" style="background:' + SRC_COLOR[k] + '"></span>') +
        (k === "all" ? "Tout" : esc(SRC_LABEL[k])) + '<span class="filter__count">' + counts[k] + "</span></button>";
    }).join("");
    fl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn) return;
      var f = btn.getAttribute("data-filter");
      $$(".filter", fl).forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      $$(".skill", el).forEach(function (s) {
        var match = f === "all" || s.getAttribute("data-src") === f;
        s.classList.toggle("is-dim", !match);
        s.classList.toggle("is-hit", match && f !== "all");
      });
    });
  }

  /* ================================================================
     2. Défilement, ancres, navigation
  ================================================================ */
  var lenis = null;
  var tickers = [];
  (function frame(t) { for (var i = 0; i < tickers.length; i++) tickers[i](t); requestAnimationFrame(frame); })(performance.now());

  function initLenis() {
    if (REDUCED || typeof window.Lenis !== "function") return;
    try {
      lenis = new window.Lenis({ lerp: 0.08, smoothWheel: true });
      tickers.push(function (t) { lenis.raf(t); });
    } catch (e) { lenis = null; }
  }
  function scrollToEl(el) {
    var top = el === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY;
    if (lenis) lenis.scrollTo(top, { duration: 2.0 });
    else window.scrollTo({ top: top, behavior: REDUCED ? "auto" : "smooth" });
  }
  window.SZScrollTo = scrollToEl;

  function pause(v) {
    if (lenis) { v ? lenis.stop() : lenis.start(); }
    world("setPaused", v);
  }

  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      var t = id === "#top" ? 0 : (id.length > 1 ? document.getElementById(id.slice(1)) : null);
      if (t === null) return;
      e.preventDefault();
      closeMenu();
      scrollToEl(t);
      if (history.replaceState) history.replaceState(null, "", id);
    });
  }

  function initNav() {
    var nav = $("[data-nav]");
    var links = $$(".nav__links a");
    var dotsEl = $("[data-dots]");
    var stops = $$("[data-stop]").filter(function (s) { return !s.hidden; });

    if (dotsEl) {
      dotsEl.innerHTML = stops.map(function (s, i) {
        return '<button class="dot" type="button" data-i="' + i + '" aria-label="' + esc(s.getAttribute("data-label")) + '"><span class="dot__label">' + esc(s.getAttribute("data-label")) + "</span></button>";
      }).join("");
      dotsEl.addEventListener("click", function (e) {
        var b = e.target.closest(".dot");
        if (b) scrollToEl(stops[+b.getAttribute("data-i")]);
      });
    }
    var dots = $$(".dot", dotsEl || document);

    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var i = stops.indexOf(e.target);
          dots.forEach(function (d, k) { d.setAttribute("aria-current", String(k === i)); });
          var id = e.target.id === "etude-de-cas" ? "parcours" : e.target.id;
          links.forEach(function (a) { a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + id)); });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      stops.forEach(function (s) { obs.observe(s); });
    }

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 40); });
    }, { passive: true });
  }

  var menuSetter = null;
  function closeMenu() { if (menuSetter) menuSetter(false); }
  function initMenu() {
    var btn = $(".nav__toggle"), menu = $("#menu");
    if (!btn || !menu) return;
    menuSetter = function (open) {
      if (menu.hidden === !open) return;
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Fermer" : "Menu";
      document.body.classList.toggle("menu-open", open);
      pause(open);
    };
    btn.addEventListener("click", function () { menuSetter(menu.hidden); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { menuSetter(false); btn.focus(); } });
  }

  /* ================================================================
     3. Apparitions, étude de cas
  ================================================================ */
  function initReveals() {
    var els = $$("[data-reveal]");
    if (REDUCED || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); obs.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.04 });
    els.forEach(function (e) { obs.observe(e); });
  }

  function initCase() {
    var sec = $("#etude-de-cas"), g = $("[data-chart]");
    if (!sec || !g) return;
    var steps = $$(".flow__step", sec);
    var beatP = $('[data-beat="problem"]', sec), beatS = $('[data-beat="solution"]', sec);
    var status = $("[data-case-status]", sec), splitLabel = $(".chart__label--split", sec);
    var NS = "http://www.w3.org/2000/svg";
    function svg(tag, attrs, text) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (text) n.textContent = text;
      g.appendChild(n);
      return n;
    }
    var BASE = 250, LIMIT = 92, TOP = 24, IN = BASE - LIMIT, TOTAL = BASE - TOP;
    var HEIGHTS = [118, 136, 96, 128, 142, 104, 122, 134, 100, 140, 112, 126, 132, 98, 120, 138];
    var bar = svg("rect", { "class": "chart__bar", x: 44, width: 88, y: BASE, height: 0, rx: 6 });
    var over = svg("rect", { "class": "chart__overflow", x: 44, width: 88, y: LIMIT, height: 0 });
    var lost = svg("text", { "class": "chart__lost-label", x: 88, y: LIMIT - 10, "text-anchor": "middle", opacity: 0 }, "perdu");
    var slices = HEIGHTS.map(function () { return svg("rect", { "class": "chart__slice", rx: 3, opacity: 0 }); });
    var hexes = HEIGHTS.map(function (h, i) { return svg("text", { "class": "chart__hex", x: 306.5 + i * 20, y: 268, "text-anchor": "middle", opacity: 0 }, HEX[i]); });

    var lastStatus = "";
    function setStatus(txt) {
      if (txt === lastStatus || !status) return;
      lastStatus = txt;
      status.classList.add("is-swap");
      setTimeout(function () { status.textContent = txt; status.classList.remove("is-swap"); }, 150);
    }

    function render(p) {
      steps.forEach(function (s, i) { s.classList.toggle("is-on", p >= i * 0.07 + 0.01); });
      var t1 = easeInOut(clamp((p - 0.3) / 0.24, 0, 1)), t2 = clamp((p - 0.6) / 0.3, 0, 1);
      var h = TOTAL * t1, inH = Math.min(h, IN), ovH = Math.max(0, h - IN), single = t2 <= 0;
      bar.setAttribute("y", (BASE - inH).toFixed(1)); bar.setAttribute("height", inH.toFixed(1)); bar.setAttribute("opacity", single ? 1 : 0);
      over.setAttribute("y", (LIMIT - ovH).toFixed(1)); over.setAttribute("height", ovH.toFixed(1)); over.setAttribute("opacity", single ? 1 : 0);
      lost.setAttribute("y", (LIMIT - ovH - 10).toFixed(1)); lost.setAttribute("opacity", single ? clamp(ovH / 40, 0, 1).toFixed(2) : 0);
      slices.forEach(function (s, i) {
        if (single) { s.setAttribute("opacity", 0); return; }
        var ti = easeInOut(clamp(t2 * 1.3 - i * 0.018, 0, 1)), hh = lerp(TOTAL, HEIGHTS[i], ti);
        s.setAttribute("x", lerp(44 + i * 5.5, 300 + i * 20, ti).toFixed(1));
        s.setAttribute("width", lerp(5.5, 13, ti).toFixed(1));
        s.setAttribute("y", (BASE - hh).toFixed(1));
        s.setAttribute("height", hh.toFixed(1));
        s.setAttribute("opacity", 1);
      });
      var la = clamp((t2 - 0.72) / 0.28, 0, 1).toFixed(2);
      hexes.forEach(function (tx) { tx.setAttribute("opacity", la); });
      if (splitLabel) splitLabel.setAttribute("opacity", la);
      if (beatP) beatP.classList.toggle("is-on", p >= 0.3 && p < 0.6);
      if (beatS) beatS.classList.toggle("is-on", p >= 0.6);
      if (p < 0.3) setStatus("Chaîne en place");
      else if (p < 0.6) setStatus(ovH > 0 ? "Réponse tronquée à 100 000 lignes" : "Requête en cours");
      else if (t2 < 1) setStatus("Découpage par préfixe");
      else setStatus("Aucune ligne perdue");
    }

    var playing = false;
    function play() {
      if (REDUCED) { render(1); return; }
      if (playing) return;
      playing = true;
      var t0 = performance.now(), DUR = 6000;
      (function tick(now) {
        var k = clamp((now - t0) / DUR, 0, 1);
        render(k);
        if (k < 1) requestAnimationFrame(tick); else playing = false;
      })(t0);
    }
    render(REDUCED ? 1 : 0);
    var replay = $("[data-case-replay]", sec);
    if (replay) replay.addEventListener("click", function () { playing = false; play(); });
    if ("IntersectionObserver" in window) {
      var played = false;
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && !played) { played = true; play(); }
      }, { threshold: 0.35 }).observe($(".case__chart", sec));
    } else render(1);
  }

  /* ================================================================
     4. Interactions
  ================================================================ */
  function initPointer() {
    if (!FINE || REDUCED) return;
    var pending = null, current = null;
    document.addEventListener("pointermove", function (e) { pending = e; }, { passive: true });
    tickers.push(function () {
      var e = pending;
      if (!e) return;
      pending = null;
      var t = e.target;
      if (!t || !t.closest) return;
      var m = t.closest("[data-magnetic]");
      if (current && current !== m) { current.style.transform = ""; current = null; }
      if (m) {
        current = m;
        var r = m.getBoundingClientRect();
        m.style.transform = "translate(" + ((e.clientX - (r.left + r.width / 2)) * 0.25).toFixed(1) + "px," + ((e.clientY - (r.top + r.height / 2)) * 0.32).toFixed(1) + "px)";
      }
      var h = t.closest("[data-holo]");
      if (h) {
        var hr = h.getBoundingClientRect(), px = (e.clientX - hr.left) / hr.width, py = (e.clientY - hr.top) / hr.height;
        h.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        h.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
        h.style.transform = "perspective(900px) rotateX(" + ((py - 0.5) * -6).toFixed(2) + "deg) rotateY(" + ((px - 0.5) * 8).toFixed(2) + "deg)";
      }
    });
    $$("[data-holo]").forEach(function (h) { h.addEventListener("pointerleave", function () { h.style.transform = ""; }); });
  }

  function initViewer() {
    var dlg = $("#viewer");
    if (!dlg) return;
    var body = $("[data-viewer-body]", dlg), cap = $("[data-viewer-caption]", dlg), opener = null;
    function close() {
      if (typeof dlg.close === "function") dlg.close();
      else { dlg.removeAttribute("open"); body.innerHTML = ""; pause(false); }
    }
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-view]");
      if (!t) return;
      e.preventDefault();
      opener = t;
      var src = t.getAttribute("data-src"), caption = t.getAttribute("data-caption") || "";
      body.innerHTML = t.getAttribute("data-view") === "video"
        ? '<video controls autoplay playsinline src="' + esc(src) + '"></video>'
        : '<img src="' + esc(src) + '" alt="' + esc(caption) + '">';
      body.firstChild.addEventListener("error", function () { body.innerHTML = '<p class="viewer__error">Fichier introuvable : ' + esc(src) + "</p>"; });
      cap.textContent = caption;
      pause(true);
      if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    });
    $("[data-viewer-close]", dlg).addEventListener("click", close);
    dlg.addEventListener("click", function (e) { if (e.target === dlg) close(); });
    dlg.addEventListener("close", function () { body.innerHTML = ""; pause(false); if (opener) opener.focus(); });
  }

  function initCopy() {
    var btn = $("[data-copy]"), status = $("[data-copy-status]");
    if (!btn) return;
    var label = btn.textContent;
    btn.addEventListener("click", function () {
      var value = btn.getAttribute("data-copy");
      function done(ok) {
        btn.textContent = ok ? "Adresse copiée" : "Copie impossible";
        if (status) status.textContent = ok ? "Adresse e-mail copiée" : "";
        setTimeout(function () { btn.textContent = label; }, 2200);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(function () { done(true); }, function () { done(false); });
      } else {
        var ta = document.createElement("textarea");
        ta.value = value; ta.setAttribute("readonly", ""); ta.style.position = "absolute"; ta.style.left = "-9999px";
        document.body.appendChild(ta); ta.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
        document.body.removeChild(ta);
        done(ok);
      }
    });
  }

  function initMediaFallback() {
    $$("[data-media-fallback]").forEach(function (fig) {
      var video = $("video", fig);
      if (!video) return;
      var sources = $$("source", video), fallback = fig.getAttribute("data-media-fallback"), swapped = false;
      function swap() {
        if (swapped) return;
        swapped = true;
        fig.innerHTML = '<img src="' + esc(fallback) + '" alt="Mon piano, un Roland FP-10" loading="lazy">';
      }
      var last = sources[sources.length - 1];
      if (last) last.addEventListener("error", swap);
      video.addEventListener("error", swap);
    });
  }

  /* ================================================================
     Démarrage
  ================================================================ */
  renderAll();
  initLenis();
  initAnchors();
  initNav();
  initMenu();
  initReveals();
  initCase();
  initPointer();
  initViewer();
  initCopy();
  initMediaFallback();

  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 900); })]).then(function () {
    root.classList.add("intro-go");
    world("refresh");
  });
  window.addEventListener("load", function () { world("refresh"); });
  if ("ResizeObserver" in window) {
    var rt = 0;
    new ResizeObserver(function () { clearTimeout(rt); rt = setTimeout(function () { world("refresh"); }, 150); }).observe($("main"));
  }
})();
