/* ================================================================
   SIGNAL — Portfolio Engine · Saad Zebiri 2025
   ================================================================ */

/* ─── UTILS ───────────────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ─── LOADER ──────────────────────────────────────────────────── */
function initLoader() {
  const loader = $('#loader');
  const bar    = $('#ld-bar');
  const status = $('#ld-status');
  if (!loader) return;

  const steps = [
    { pct: 30,  label: 'Chargement des assets...' },
    { pct: 65,  label: 'Initialisation des modules...' },
    { pct: 90,  label: 'Configuration du réseau...' },
    { pct: 100, label: 'Prêt.' },
  ];

  let i = 0;
  function step() {
    if (i >= steps.length) return;
    const s = steps[i++];
    bar.style.width = s.pct + '%';
    status.textContent = s.label;
    if (i < steps.length) setTimeout(step, 280);
    else setTimeout(() => { loader.classList.add('done'); initHeroCanvas(); }, 320);
  }
  setTimeout(step, 120);
}

/* ─── NAVIGATION ──────────────────────────────────────────────── */
function initNav() {
  const wrap   = $('#nav-wrap');
  const toggle = $('#nav-toggle');
  const menu   = $('#mob-menu');
  const overlay = $('#mob-overlay');
  if (!wrap) return;

  // Scroll class
  window.addEventListener('scroll', () => {
    wrap.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Mobile toggle
  function openMenu() {
    menu.classList.add('open');
    overlay.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    menu.classList.remove('open');
    overlay.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });
  overlay.addEventListener('click', closeMenu);

  $$('.mm-link').forEach(link => link.addEventListener('click', closeMenu));
}

/* ─── SMOOTH SCROLL ───────────────────────────────────────────── */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ─── ACTIVE NAV ──────────────────────────────────────────────── */
function initActiveNav() {
  const sections = $$('[data-section]');
  const navLinks = $$('.nl[data-target]');
  const mobLinks = $$('.mm-link[data-target]');

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.dataset.section;
      [...navLinks, ...mobLinks].forEach(l => {
        l.classList.toggle('active', l.dataset.target === id);
      });
    });
  }, { threshold: 0.35 });

  sections.forEach(s => obs.observe(s));
}

/* ─── CURSOR SPOTLIGHT ────────────────────────────────────────── */
function initCursorSpotlight() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  let rafId;
  document.addEventListener('mousemove', e => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--mx', e.clientX + 'px');
      document.documentElement.style.setProperty('--my', e.clientY + 'px');
    });
  }, { passive: true });
}

/* ─── HERO CANVAS ─────────────────────────────────────────────── */
function initHeroCanvas() {
  const canvas = $('#hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const AC = [75, 143, 255];
  let W, H, nodes = [], scanY = 0, scanDir = 1, lastTime = 0;
  const COUNT = 55;
  const MAX_D = 150;
  // Ping effect: occasional node-to-node "packet" ripple
  const pings = [];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    scanY = 0;
  }

  function spawn() {
    nodes = [];
    for (let i = 0; i < COUNT; i++) {
      nodes.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r:  Math.random() * 1.5 + 0.5,
      });
    }
  }

  function spawnPing() {
    const src = Math.floor(Math.random() * nodes.length);
    let dst;
    do { dst = Math.floor(Math.random() * nodes.length); } while (dst === src);
    pings.push({ src, dst, t: 0 });
  }
  // Spawn a ping every 2.5s
  setInterval(spawnPing, 2500);

  function draw(ts) {
    requestAnimationFrame(draw);
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    ctx.clearRect(0, 0, W, H);

    // Move nodes
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > W) n.vx *= -1;
      if (n.y < 0 || n.y > H) n.vy *= -1;
    }

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX_D) {
          ctx.strokeStyle = `rgba(${AC[0]},${AC[1]},${AC[2]},${(1 - d / MAX_D) * 0.09})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw ping packets (moving dot along edge)
    for (let i = pings.length - 1; i >= 0; i--) {
      const p = pings[i];
      p.t += dt * 0.8;
      if (p.t >= 1) { pings.splice(i, 1); continue; }
      const sn = nodes[p.src], dn = nodes[p.dst];
      const px = sn.x + (dn.x - sn.x) * p.t;
      const py = sn.y + (dn.y - sn.y) * p.t;
      // Glow ring
      const grd = ctx.createRadialGradient(px, py, 0, px, py, 10);
      grd.addColorStop(0, `rgba(${AC[0]},${AC[1]},${AC[2]},0.6)`);
      grd.addColorStop(1, `rgba(${AC[0]},${AC[1]},${AC[2]},0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(px, py, 10, 0, Math.PI * 2);
      ctx.fill();
      // Dot
      ctx.fillStyle = `rgba(${AC[0]},${AC[1]},${AC[2]},0.9)`;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Scan line sweeping top→bottom then reset
    scanY += dt * H * 0.09; // full sweep in ~11s
    if (scanY > H + 40) scanY = -40;
    const grd = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
    grd.addColorStop(0, 'rgba(75,143,255,0)');
    grd.addColorStop(0.5, 'rgba(75,143,255,0.055)');
    grd.addColorStop(1, 'rgba(75,143,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, scanY - 30, W, 60);

    // Draw nodes
    for (const n of nodes) {
      ctx.fillStyle = `rgba(${AC[0]},${AC[1]},${AC[2]},0.35)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  resize();
  spawn();
  requestAnimationFrame(draw);

  window.addEventListener('resize', () => { resize(); spawn(); }, { passive: true });
}

/* ─── HERO TYPEWRITER (console) ────────────────────────────────── */
function initConsoleTypewriter() {
  const el = $('#sc-tw');
  if (!el) return;

  const phrases = [
    'Cisco · Linux · Python',
    'Nmap · OT Security · VLANs',
    'React · Node.js · Docker',
    'Risk Assessment · Log Analysis',
    'ESP32 · IoT · Full-Stack',
  ];
  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const target = phrases[pi];
    if (!deleting) {
      ci++;
      el.textContent = target.slice(0, ci);
      if (ci === target.length) {
        deleting = true;
        setTimeout(tick, 2200);
        return;
      }
    } else {
      ci--;
      el.textContent = target.slice(0, ci);
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? 45 : 75);
  }
  setTimeout(tick, 800);
}

/* ─── TERMINAL CURSOR ─────────────────────────────────────────── */
function initTerminalCursors() {
  // term-cur cursors blink via CSS — nothing needed here
  // Animate a few lines typewriter-style in the about terminal
  const rows = $$('#about .term-bd .tr');
  rows.forEach((row, i) => {
    row.style.opacity = '0';
    row.style.transform = 'translateX(-8px)';
    row.style.transition = `opacity 0.35s ease, transform 0.35s ease`;
    row.style.transitionDelay = `${i * 0.07}s`;
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        $$('.tr', e.target).forEach(row => {
          row.style.opacity = '1';
          row.style.transform = 'none';
        });
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.25 });

  const termBd = $('.term-bd');
  if (termBd) obs.observe(termBd);
}

/* ─── HERO COUNTER ────────────────────────────────────────────── */
function initCounters() {
  const els = $$('[data-count]');
  if (!els.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const end = parseInt(el.dataset.count, 10);
      const dur = 1200;
      const start = performance.now();

      function update(now) {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(eased * end);
        if (t < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  els.forEach(el => obs.observe(el));
}

/* ─── SCROLL REVEALS ──────────────────────────────────────────── */
function initReveals() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach(el => obs.observe(el));
}

/* ─── SKILL BARS ──────────────────────────────────────────────── */
function initSkillBars() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      $$('.sbar-fill', e.target.closest('.section') || document).forEach(fill => {
        fill.style.width = fill.dataset.pct + '%';
      });
      obs.unobserve(e.target);
    });
  }, { threshold: 0.3 });

  const skillSection = $('#skills');
  if (skillSection) obs.observe(skillSection);
}

/* ─── ACTIVITY FILTERS ────────────────────────────────────────── */
function initFilters() {
  const btns  = $$('.af-btn');
  const cards = $$('.ac-card[data-category]');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
        // Span override
        if (match && card.classList.contains('ac-card--lg')) {
          card.style.gridColumn = filter === 'all' ? '' : 'span 1';
        }
      });
    });
  });
}

/* ─── LIGHTBOX ────────────────────────────────────────────────── */
function initLightbox() {
  const lb      = $('#lightbox');
  const lbImg   = $('#lb-img');
  const lbCap   = $('#lb-caption');
  const lbClose = $('#lb-close');
  if (!lb) return;

  function open(src, caption) {
    lbImg.src = src;
    lbImg.alt = caption || '';
    if (lbCap) lbCap.textContent = caption || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lbImg.src = ''; }, 300);
  }

  // Support both .gal-item (index) and .pg-item (activities page)
  $$('.gal-item, .pg-item').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.dataset.src;
      const cap = item.dataset.caption || '';
      if (src) open(src, cap);
    });
  });

  lbClose.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ─── TEXT SCRAMBLE on sec-num ────────────────────────────────── */
function initScramble() {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·/─';

  function scramble(el) {
    const original = el.textContent;
    const frames = 18;
    let f = 0;
    const iv = setInterval(() => {
      el.textContent = original.split('').map((ch, i) => {
        if (ch === ' ' || ch === '/' || ch === '·') return ch;
        if (f / frames > i / original.length) return ch;
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      }).join('');
      f++;
      if (f > frames) { el.textContent = original; clearInterval(iv); }
    }, 32);
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { scramble(e.target); obs.unobserve(e.target); }
    });
  }, { threshold: 0.8 });

  $$('.sec-num').forEach(el => obs.observe(el));
}

/* ─── CARD SPOTLIGHT ──────────────────────────────────────────── */
function initCardSpotlight() {
  $$('.ac-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      card.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    }, { passive: true });
  });
}

/* ─── CARD TILT ───────────────────────────────────────────────── */
function initTilt() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  $$('.ac-card, .svc-item').forEach(card => {
    card.style.transition = 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s';
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width  - 0.5;
      const cy = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${(-cy * 3.5).toFixed(2)}deg) rotateY(${(cx * 3.5).toFixed(2)}deg) translateZ(4px)`;
    }, { passive: true });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ─── GSAP ENTRANCE ───────────────────────────────────────────── */
function initEntrance() {
  if (typeof gsap === 'undefined') return;

  gsap.set('.hero-left > *', { y: 20, opacity: 0 });
  gsap.to('.hero-left > *', {
    y: 0,
    opacity: 1,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power2.out',
    delay: 0.1,
    clearProps: 'transform,opacity',
  });

  gsap.set('.status-console', { y: 30, opacity: 0 });
  gsap.to('.status-console', {
    y: 0,
    opacity: 1,
    duration: 0.7,
    ease: 'power2.out',
    delay: 0.5,
    clearProps: 'transform,opacity',
  });

  gsap.set('.hero-chip', { scale: 0.8, opacity: 0 });
  gsap.to('.hero-chip', {
    scale: 1,
    opacity: 1,
    duration: 0.5,
    stagger: 0.12,
    ease: 'back.out(1.5)',
    delay: 0.9,
    clearProps: 'transform,opacity',
  });
}

/* ─── INIT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initCursorSpotlight();
  initNav();
  initSmoothScroll();
  initActiveNav();
  initConsoleTypewriter();
  initTerminalCursors();
  initCounters();
  initReveals();
  initSkillBars();
  initFilters();
  initLightbox();
  initScramble();
  initCardSpotlight();
  initTilt();
  initEntrance();
});
