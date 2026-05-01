/* ═══════════════════════════════════════════════════════════
   CYBER-ÉLÉGANCE — main.js
═══════════════════════════════════════════════════════════ */

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
    const open  = () => { menu.classList.add('open'); overlay.classList.add('open'); toggle.classList.add('open'); toggle.setAttribute('aria-expanded','true'); };
    const close = () => { menu.classList.remove('open'); overlay.classList.remove('open'); toggle.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); };
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
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  els.forEach(el => obs.observe(el));
}

/* ── CANVAS — Network topology (Cobalt + Neon) ───────────── */
function initCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const isMobile    = window.innerWidth < 768;
  const NODE_COUNT  = isMobile ? 35 : 65;
  const CONNECT_D   = isMobile ? 130 : 160;
  const MOUSE_D     = 180;

  let W, H, nodes = [];
  let mouseX = -9999, mouseY = -9999;
  let raf;

  /* Inline canvas styles so it sits behind content */
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;';

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeNode() {
    const isCobalt = Math.random() > .3;
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - .5) * .25,
      vy: (Math.random() - .5) * .25,
      r:  Math.random() * 1.6 + .6,
      cobalt: isCobalt,
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.x += n.vx; n.y += n.vy;
      if (n.x < -20) n.x = W + 20;
      if (n.x > W+20) n.x = -20;
      if (n.y < -20) n.y = H + 20;
      if (n.y > H+20) n.y = -20;

      /* Mouse repulsion */
      const dx = n.x - mouseX, dy = n.y - mouseY;
      const dm = Math.sqrt(dx*dx + dy*dy);
      if (dm < MOUSE_D && dm > 0) {
        const f = (MOUSE_D - dm) / MOUSE_D;
        n.x += (dx/dm) * f * 1.8;
        n.y += (dy/dm) * f * 1.8;
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
      ctx.fillStyle = n.cobalt
        ? `rgba(0,102,255,${.5 + Math.random()*.08})`
        : `rgba(57,255,20,${.45 + Math.random()*.08})`;
      ctx.fill();
    }

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i+1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < CONNECT_D) {
          const a = (1 - d/CONNECT_D) * .14;
          const isMixed = nodes[i].cobalt !== nodes[j].cobalt;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = isMixed
            ? `rgba(57,255,20,${a * .6})`
            : nodes[i].cobalt
              ? `rgba(0,102,255,${a})`
              : `rgba(57,255,20,${a * .5})`;
          ctx.lineWidth = .65;
          ctx.stroke();
        }
      }
    }

    raf = requestAnimationFrame(draw);
  }

  const hero = canvas.closest('.hero');
  hero?.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouseX = e.clientX - r.left;
    mouseY = e.clientY - r.top;
  }, { passive: true });
  hero?.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

  new ResizeObserver(() => resize()).observe(canvas);
  resize();
  nodes = Array.from({ length: NODE_COUNT }, makeNode);
  draw();
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
    if (!isNaN(v)) { s.dataset.target = v; s.textContent = '0'; obs.observe(s); }
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

/* ── EPHEC BAR ───────────────────────────────────────────── */
function initEPHECBar() {
  const bar = document.querySelector('.ep-bar-fill');
  if (!bar) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      bar.style.width = (bar.dataset.w || 70) + '%';
      obs.unobserve(e.target);
    });
  }, { threshold: .5 });
  obs.observe(bar);
}

/* ── SVG RING ────────────────────────────────────────────── */
function initRing() {
  const ring = document.getElementById('ring-fill');
  if (!ring) return;
  const r    = 85;
  const circ = 2 * Math.PI * r;
  ring.style.strokeDasharray  = circ;
  ring.style.strokeDashoffset = circ;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      ring.style.transition       = 'stroke-dashoffset 1.5s cubic-bezier(.22,1,.36,1)';
      ring.style.strokeDashoffset = circ * (1 - 42/60);
      obs.unobserve(e.target);
    });
  }, { threshold: .4 });
  obs.observe(ring);
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
      items.forEach(item => {
        item.style.display = (f === 'all' || item.dataset.type === f) ? '' : 'none';
      });
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
  initNav();
  initReveal();
  initCanvas();
  initCounters();
  initLangBars();
  initEPHECBar();
  initRing();
  initActivitiesFilter();
  initLightbox();
  initAccordion();
  initThemeBars();
});
