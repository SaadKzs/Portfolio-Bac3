/* ═══════════════════════════════════════════════════════════
   EDITORIAL TECH — main.js
═══════════════════════════════════════════════════════════ */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── NETWORK BACKGROUND CANVAS ───────────────────────────── */
let _networkRAF = null;

function initNetwork() {
  cancelAnimationFrame(_networkRAF);
  const existing = document.getElementById('bg-network');
  if (existing) existing.remove();

  const canvas = document.createElement('canvas');
  canvas.id = 'bg-network';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;';
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx    = canvas.getContext('2d');
  const NR     = [27, 42, 78]; // --navy #1B2A4E
  let W, H;

  const COUNT = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 20000), 52);
  const DIST  = Math.min(window.innerWidth, window.innerHeight) * 0.24;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeNode() {
    return {
      x:     Math.random() * W,
      y:     Math.random() * H,
      vx:    (Math.random() - .5) * .18,
      vy:    (Math.random() - .5) * .18,
      r:     1.5 + Math.random() * 2.2,
      phase: Math.random() * Math.PI * 2,
      spd:   .006 + Math.random() * .008,
    };
  }

  new ResizeObserver(resize).observe(canvas);
  resize();
  const nodes = Array.from({ length: COUNT }, makeNode);

  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    /* edges */
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          const a = (1 - d / DIST) * .07;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(${NR[0]},${NR[1]},${NR[2]},${a.toFixed(3)})`;
          ctx.lineWidth = .7;
          ctx.stroke();
        }
      }
    }

    /* nodes */
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = W + 20;
      if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20;
      if (n.y > H + 20) n.y = -20;

      const pulse = .25 + .35 * (.5 + .5 * Math.sin(t * .001 * n.spd * 1000 + n.phase));
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${NR[0]},${NR[1]},${NR[2]},${pulse.toFixed(3)})`;
      ctx.fill();
    }

    _networkRAF = requestAnimationFrame(draw);
  }

  _networkRAF = requestAnimationFrame(draw);
}

/* ── NAV ─────────────────────────────────────────────────── */
function initNav() {
  const wrap    = document.getElementById('nav-wrap');
  const toggle  = document.getElementById('nav-toggle');
  const menu    = document.getElementById('mob-menu');
  const overlay = document.getElementById('mob-overlay');
  if (!wrap) return;

  window.addEventListener('scroll', () => {
    wrap.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  if (toggle && menu && overlay) {
    const open  = () => { menu.classList.add('open'); overlay.classList.add('open'); toggle.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); };
    const close = () => { menu.classList.remove('open'); overlay.classList.remove('open'); toggle.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); };
    toggle.addEventListener('click', () => menu.classList.contains('open') ? close() : open());
    overlay.addEventListener('click', close);
    menu.querySelectorAll('.mm-link').forEach(l => l.addEventListener('click', close));
  }
}

/* ── REVEAL ──────────────────────────────────────────────── */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  els.forEach(el => obs.observe(el));
}

/* ── CUSTOM CURSOR ───────────────────────────────────────── */
function initCursor() {
  if (REDUCED || window.matchMedia('(hover:none)').matches) return;

  const el = Object.assign(document.createElement('div'), { className: 'cursor' });
  document.body.appendChild(el);

  /* Suit la souris exactement via transform — zéro lerp, zéro lag */
  document.addEventListener('mousemove', e => {
    el.style.transform = `translate(${e.clientX}px,${e.clientY}px)`;
  }, { passive: true });

  const sel = 'a, button, .btn, .proj-card, .svc-card, .act-item, .pg-item, .afb-btn, .tb-tags span, .tag, label';
  document.addEventListener('mouseover', e => { if (e.target.closest(sel)) el.classList.add('hover'); });
  document.addEventListener('mouseout',  e => { if (e.target.closest(sel)) el.classList.remove('hover'); });

  document.addEventListener('mousedown', () => el.classList.add('press'));
  document.addEventListener('mouseup',   () => el.classList.remove('press'));
}

/* ── COUNTERS ────────────────────────────────────────────── */
function initCounters() {
  const spans = document.querySelectorAll('.hstat-n span');
  if (!spans.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const target = parseInt(e.target.dataset.target || e.target.textContent, 10);
      if (isNaN(target)) return;
      e.target.dataset.target = target;
      if (REDUCED) { e.target.textContent = target; return; }
      let cur = 0;
      const step = Math.max(1, target / 40);
      const t = setInterval(() => {
        cur += step;
        if (cur >= target) { e.target.textContent = target; clearInterval(t); return; }
        e.target.textContent = Math.floor(cur);
      }, 28);
      obs.unobserve(e.target);
    });
  }, { threshold: .5 });
  spans.forEach(s => {
    const v = parseInt(s.textContent, 10);
    if (!isNaN(v)) { s.dataset.target = v; if (!REDUCED) s.textContent = '0'; obs.observe(s); }
  });
}

/* ── LANG BARS ───────────────────────────────────────────── */
function initLangBars() {
  const sections = document.querySelectorAll('.lang-bars');
  if (!sections.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('.lang-fill').forEach(f => { f.style.width = (f.dataset.w || 0) + '%'; });
      obs.unobserve(e.target);
    });
  }, { threshold: .3 });
  sections.forEach(s => obs.observe(s));
}

/* ── SVG RING ────────────────────────────────────────────── */
function initRing() {
  const ring = document.getElementById('ring-fill');
  if (!ring) return;
  const r = 85, circ = 2 * Math.PI * r;
  const val = parseFloat(ring.dataset.value ?? 60);
  const max = parseFloat(ring.dataset.max   ?? 60);
  ring.style.strokeDasharray  = circ;
  ring.style.strokeDashoffset = circ;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      ring.style.transition       = REDUCED ? 'none' : 'stroke-dashoffset 1.5s cubic-bezier(.22,1,.36,1)';
      ring.style.strokeDashoffset = circ * (1 - val / max);
      obs.unobserve(e.target);
    });
  }, { threshold: .4 });
  obs.observe(ring);
}

/* ── ACTIVITY ACCORDIONS ─────────────────────────────────── */
function initActivityAccordions() {
  const accordions = document.querySelectorAll('.act-accordion');
  if (!accordions.length) return;
  accordions.forEach(acc => {
    const head = acc.querySelector('.accord-head');
    if (!head) return;
    head.addEventListener('click', () => {
      const isOpen = acc.classList.contains('open');
      accordions.forEach(a => a.classList.remove('open'));
      if (!isOpen) acc.classList.add('open');
    });
    const backBtn = acc.querySelector('.accord-back-btn');
    if (backBtn) backBtn.addEventListener('click', e => { e.stopPropagation(); acc.classList.remove('open'); });
  });
}

/* ── ACTIVITIES THEME FILTER ─────────────────────────────── */
function initThemeFilter() {
  const btns   = document.querySelectorAll('[data-filter-theme]');
  const blocs  = document.querySelectorAll('[data-theme]');
  if (!btns.length) return;
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filterTheme;
      blocs.forEach(b => { b.style.display = (f === 'all' || b.dataset.theme === f) ? '' : 'none'; });
    });
  });
}

/* ── ACTIVITIES FILTER ───────────────────────────────────── */
function initActivitiesFilter() {
  const btns  = document.querySelectorAll('.afb-btn');
  const items = document.querySelectorAll('.act-item');
  if (!btns.length) return;
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filterType;
      items.forEach(item => { item.style.display = (f === 'all' || item.dataset.type === f) ? '' : 'none'; });
    });
  });
}

/* ── LIGHTBOX ────────────────────────────────────────────── */
function initLightbox() {
  const lb      = document.getElementById('lightbox');
  const lbImg   = document.getElementById('lb-img');
  const lbCap   = document.getElementById('lb-caption');
  const lbClose = document.getElementById('lb-close');
  if (!lb) return;

  document.querySelectorAll('.pg-item').forEach(item => {
    item.addEventListener('click', () => {
      lbImg.src = item.dataset.src;
      if (lbCap) lbCap.textContent = item.dataset.caption || '';
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
  lbClose?.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ── ACCORDION ───────────────────────────────────────────── */
function initAccordion() {
  const trigger = document.getElementById('rules-trigger');
  const content = document.getElementById('rules-content');
  if (!trigger || !content) return;
  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', !open);
    trigger.classList.toggle('open', !open);
    content.classList.toggle('open', !open);
  });
}

/* ── THEME BARS ──────────────────────────────────────────── */
function initThemeBars() {
  const section = document.querySelector('.theme-section');
  if (!section) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('.tbr-fill').forEach(f => { f.style.width = (f.dataset.pct || 0) + '%'; });
      obs.unobserve(e.target);
    });
  }, { threshold: .2 });
  obs.observe(section);
}

/* ── INIT ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (!REDUCED) initNetwork();
  initNav();
  initReveal();
  if (!REDUCED) initCursor();
  initCounters();
  initLangBars();
  initRing();
  initActivitiesFilter();
  initActivityAccordions();
  initThemeFilter();
  initLightbox();
  initAccordion();
  initThemeBars();
});

