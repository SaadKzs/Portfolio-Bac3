/* ================================================================
   STELLAR — Portfolio Engine · Saad Zebiri 2025
   ================================================================ */

/* ─── DATA ───────────────────────────────────────────────────── */
const DATA = {
  themes: [
    { id: 'network',       name: 'Réseaux',        color: '#3b82f6', type: 'tech' },
    { id: 'security',      name: 'Cybersécurité',  color: '#8b5cf6', type: 'tech' },
    { id: 'web',           name: 'Web / MERN',      color: '#06b6d4', type: 'tech' },
    { id: 'iot',           name: 'IoT',             color: '#10b981', type: 'tech' },
    { id: 'communication', name: 'Communication',  color: '#f59e0b', type: 'soft' },
    { id: 'project',       name: 'Gestion Projet', color: '#ef4444', type: 'soft' }
  ],
  types: {
    'hackathon':      { label: 'Hackathon',           icon: 'fa-solid fa-trophy' },
    'training_online':{ label: 'Formation en ligne',  icon: 'fa-solid fa-globe' },
    'training_onsite':{ label: 'Formation présentiel',icon: 'fa-solid fa-graduation-cap' },
    'conference':     { label: 'Conférence',          icon: 'fa-solid fa-microphone' },
    'visit':          { label: 'Visite entreprise',   icon: 'fa-solid fa-building' },
    'fair':           { label: 'Salon / DevDay',      icon: 'fa-solid fa-calendar-star' },
    'jobday':         { label: 'IT Job Day',          icon: 'fa-solid fa-briefcase' },
    'project':        { label: 'Projet',              icon: 'fa-solid fa-code' },
    'stage':          { label: 'Stage',               icon: 'fa-solid fa-id-badge' }
  },
  activities: [
    { theme: 'network',       title: 'Network Basics Project',      type: 'project',        hours: 15, date: '2024-05-10' },
    { theme: 'iot',           title: 'Smart Mailbox "Boite-alerte"',type: 'hackathon',      hours: 20, date: '2024-03-15' },
    { theme: 'security',      title: 'Lhoist Security Onboarding',  type: 'stage',          hours: 8,  date: '2025-02-01' },
    { theme: 'web',           title: 'Développement Portfolio',     type: 'project',        hours: 12, date: '2025-01-20' },
    { theme: 'communication', title: 'Formation Présentation',      type: 'training_onsite',hours: 4,  date: '2024-11-10' },
    { theme: 'communication', title: 'Atelier Communication',       type: 'conference',     hours: 8,  date: '2024-12-05' }
  ]
};

/* ─── HELPERS ────────────────────────────────────────────────── */
function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function themeStats() {
  const acc = {};
  DATA.themes.forEach(t => acc[t.id] = 0);
  DATA.activities.forEach(a => {
    if (acc[a.theme] !== undefined)
      acc[a.theme] += Math.min(a.hours, Math.max(0, 10 - acc[a.theme]));
  });
  return acc;
}

/* ─── THREE.JS HERO SCENE ────────────────────────────────────── */
function initThreeScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = canvas.offsetWidth;
  const H = canvas.offsetHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 100);
  camera.position.z = 5;

  /* — Particles — */
  const count = 2200;
  const pos   = new Float32Array(count * 3);
  const col   = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3]   = (Math.random() - .5) * 22;
    pos[i*3+1] = (Math.random() - .5) * 22;
    pos[i*3+2] = (Math.random() - .5) * 12;
    const t = Math.random();
    col[i*3]   = .32 + t * .42;
    col[i*3+1] = .14 + t * .58;
    col[i*3+2] = .52 + t * .48;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .024, vertexColors: true, transparent: true, opacity: .6 })));

  /* — Wireframe icosahedrons — */
  const ico  = new THREE.Mesh(new THREE.IcosahedronGeometry(2.2, 1), new THREE.MeshBasicMaterial({ color: 0x915eff, wireframe: true, transparent: true, opacity: .1 }));
  const ico2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), new THREE.MeshBasicMaterial({ color: 0x00d4aa, wireframe: true, transparent: true, opacity: .17 }));
  scene.add(ico, ico2);

  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - .5) * 2;
    my = -(e.clientY / window.innerHeight - .5) * 2;
  });

  let time = 0;
  (function animate() {
    requestAnimationFrame(animate);
    time += .004;
    ico.rotation.y  =  time * .18; ico.rotation.x  = time * .10;
    ico2.rotation.y = -time * .28; ico2.rotation.z = time * .15;
    camera.position.x += (mx * .55 - camera.position.x) * .04;
    camera.position.y += (my * .55 - camera.position.y) * .04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }, { passive: true });
}

/* ─── CUSTOM CURSOR ──────────────────────────────────────────── */
function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot  = document.createElement('div'); dot.className  = 'c-dot';
  const ring = document.createElement('div'); ring.className = 'c-ring';
  document.body.append(dot, ring);

  let mx = -200, my = -200, rx = -200, ry = -200;
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });

  function lerp(a, b, t) { return a + (b - a) * t; }
  (function tick() {
    rx = lerp(rx, mx, .12); ry = lerp(ry, my, .12);
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(tick);
  })();

  const hoverSel = 'a,button,.proj-card,.filter-btn,input,textarea,[role="button"]';
  document.addEventListener('mouseover', e => { if (e.target.closest(hoverSel)) ring.classList.add('hover'); });
  document.addEventListener('mouseout',  e => { if (e.target.closest(hoverSel)) ring.classList.remove('hover'); });
  document.addEventListener('mousedown', () => ring.classList.add('click'));
  document.addEventListener('mouseup',   () => ring.classList.remove('click'));
}

/* ─── PAGE CURTAIN ───────────────────────────────────────────── */
function initCurtain() {
  const curtain = document.querySelector('.curtain');
  if (!curtain) return;

  if (typeof gsap === 'undefined') {
    curtain.style.display = 'none';
    initHeroEntrance();
    return;
  }

  const tl  = gsap.timeline({ onComplete: () => { curtain.style.display = 'none'; initHeroEntrance(); } });
  const txt = curtain.querySelector('.curtain-text');
  if (txt) tl.to(txt, { opacity: 0, duration: .3, ease: 'power2.in' }, .05);
  tl.to(curtain, { scaleY: 0, duration: 1.1, ease: 'expo.inOut' }, .2);
}

function initHeroEntrance() {
  const roleSup     = document.querySelector('.role-sup');
  const roleMain    = document.querySelector('.role-main');
  const roleOutline = document.querySelector('.role-outline');
  const badge       = document.querySelector('.intro-badge');
  const meta        = document.querySelector('.intro-meta');
  const ctas        = document.querySelector('.intro-ctas');
  const stats       = document.querySelector('.intro-stats');
  const hint        = document.querySelector('.scroll-hint');

  const els = [roleSup, roleMain, roleOutline, badge, meta, ctas, stats, hint].filter(Boolean);

  if (typeof gsap === 'undefined') {
    els.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }

  if (roleSup)     gsap.to(roleSup,     { opacity: 1, y: 0, duration: .9,  ease: 'expo.out', delay: .1 });
  if (roleMain)    gsap.to(roleMain,    { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', delay: .22 });
  if (roleOutline) gsap.to(roleOutline, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', delay: .32 });
  if (badge)       gsap.to(badge,       { opacity: 1, y: 0, duration: .8,  ease: 'power3.out', delay: .55 });
  if (meta)        gsap.to(meta,        { opacity: 1, y: 0, duration: .8,  ease: 'power3.out', delay: .68 });
  if (ctas)        gsap.to(ctas,        { opacity: 1, y: 0, duration: .8,  ease: 'power3.out', delay: .80 });
  if (stats)       gsap.to(stats,       { opacity: 1, y: 0, duration: .8,  ease: 'power3.out', delay: .92 });
  if (hint)        gsap.to(hint,        { opacity: 1, y: 0, duration: .8,  ease: 'power3.out', delay: 1.0 });
}

/* ─── SIDEBAR ────────────────────────────────────────────────── */
function initSidebar() {
  const sidebar  = document.querySelector('.sidebar');
  const toggles  = document.querySelectorAll('.sb-toggle');
  const overlay  = document.querySelector('.sidebar-overlay');

  function close() {
    sidebar && sidebar.classList.remove('open');
    overlay && overlay.classList.remove('show');
    toggles.forEach(t => { t.innerHTML = '<i class="fa-solid fa-bars"></i>'; });
  }

  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const open = sidebar.classList.toggle('open');
      overlay && overlay.classList.toggle('show', open);
      btn.innerHTML = open ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });
  });

  overlay && overlay.addEventListener('click', close);

  sidebar && sidebar.querySelectorAll('.sb-link').forEach(a =>
    a.addEventListener('click', close)
  );

  /* Active link on scroll */
  const sections = document.querySelectorAll('[data-section]');
  const links    = document.querySelectorAll('.sb-link[data-target]');
  if (sections.length && links.length) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const id = e.target.dataset.section;
          links.forEach(l => l.classList.toggle('active', l.dataset.target === id));
        }
      });
    }, { threshold: .35 });
    sections.forEach(s => obs.observe(s));
  }
}

/* ─── CARD TILT + SPOTLIGHT ──────────────────────────────────── */
function initTilt() {
  document.querySelectorAll('.proj-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = e.clientX - r.left;
      const y  = e.clientY - r.top;
      const rx = ((y - r.height / 2) / r.height) * -7;
      const ry = ((x - r.width  / 2) / r.width)  *  7;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px) scale(1.008)`;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ─── WORD REVEAL ────────────────────────────────────────────── */
function initWordReveal() {
  document.querySelectorAll('.w-reveal').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w, i) =>
      `<span class="w" style="transition-delay:${(i * .055).toFixed(3)}s">${w}</span>`
    ).join(' ');
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.querySelectorAll('.w').forEach(w => {
        w.style.opacity   = '1';
        w.style.transform = 'translateY(0)';
        w.style.filter    = 'blur(0)';
      });
      obs.unobserve(e.target);
    });
  }, { threshold: .15 });

  document.querySelectorAll('.w-reveal').forEach(el => obs.observe(el));
}

/* ─── TERMINAL ───────────────────────────────────────────────── */
function initTerminal() {
  const out = document.getElementById('terminal-output');
  if (!out) return;

  const lines = [
    { delay: 200,  html: '<span class="t-p">saad@lhoist</span><span class="t-d">:~$</span> <span class="t-c">nmap -sS -O 192.168.1.0/24</span>' },
    { delay: 650,  html: '<span class="t-d">Starting Nmap 7.94 scan…</span>' },
    { delay: 1150, html: '<span class="t-ok">[+]</span> 192.168.1.1 — 22/ssh · 80/http · 443/https' },
    { delay: 1700, html: '<span class="t-ok">[+]</span> 192.168.1.105 — 3389/rdp · 445/smb' },
    { delay: 2300, html: '<span class="t-w">[!]</span> CVE-2024-1182 on 192.168.1.105 <span class="t-d">· severity: HIGH</span>' },
    { delay: 2950, html: '<span class="t-ok">[+]</span> OT Device: 192.168.1.200 — <span class="t-w">Modbus/TCP</span>' },
    { delay: 3600, html: '<span class="t-ok">[✓]</span> TVM Pipeline initiated' },
    { delay: 4300, html: '<span class="t-ok">[✓]</span> <span class="t-d">Report →</span> scan_20250301.pdf' },
    { delay: 5100, html: '<span class="t-d">Done · 24 hosts · 3 vulns · 4.23s</span>' },
    { delay: 5900, html: '<span class="t-p">saad@lhoist</span><span class="t-d">:~$</span> <span class="t-cur"></span>' }
  ];

  lines.forEach(({ delay, html }) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.innerHTML = html;
      out.appendChild(div);
      out.scrollTop = out.scrollHeight;
    }, delay);
  });

  setTimeout(() => { out.innerHTML = ''; initTerminal(); }, 10500);
}

/* ─── MAGNETIC BUTTONS ───────────────────────────────────────── */
function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) * .35;
      const dy = (e.clientY - r.top  - r.height / 2) * .35;
      btn.style.transform = `translate(${dx}px,${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1)';
      btn.style.transform  = '';
      setTimeout(() => { btn.style.transition = ''; }, 500);
    });
  });
}

/* ─── COUNTERS ───────────────────────────────────────────────── */
function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const tgt = parseInt(el.dataset.count, 10);
      const t0  = performance.now();
      const dur = 1500;
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * tgt);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = tgt;
      };
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: .6 });

  document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
}

/* ─── SCROLL REVEAL ──────────────────────────────────────────── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: .08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ─── MARQUEE ────────────────────────────────────────────────── */
function initMarquee() {
  const wrap  = document.querySelector('.marquee-wrap');
  const track = wrap && wrap.querySelector('.marquee-track');
  if (track) wrap.appendChild(track.cloneNode(true));
}

/* ─── SKILL BARS ─────────────────────────────────────────────── */
function initSkillBars() {
  const fills = document.querySelectorAll('.skill-fill[data-pct]');
  if (!fills.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.pct + '%';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: .4 });

  fills.forEach(el => obs.observe(el));
}

/* ─── EXPLORER ───────────────────────────────────────────────── */
let currentFilter = 'all';

window.setFilter = function(id) {
  currentFilter = id;
  renderFilters();
  renderActivities();
};

function renderFilters() {
  const container = document.getElementById('filter-container');
  if (!container) return;
  const stats = themeStats();

  const allBtn = `<button onclick="setFilter('all')" class="filter-btn ${currentFilter === 'all' ? 'active' : ''}">Tous</button>`;

  const themesBtns = DATA.themes.map(t => {
    const h      = stats[t.id] || 0;
    const active = currentFilter === t.id;
    return `<button onclick="setFilter('${t.id}')"
      class="filter-btn ${active ? 'active' : ''}"
      ${active ? `style="border-color:${t.color}40;color:${t.color}"` : ''}>
      <span class="f-dot" style="background:${t.color}"></span>
      ${t.name}
      <span class="f-cnt">${h}/10h</span>
      ${h >= 10 ? '<i class="fa-solid fa-circle-check" style="color:#22c55e;font-size:.6rem"></i>' : ''}
    </button>`;
  }).join('');

  container.innerHTML = allBtn + themesBtns;
}

function renderActivities() {
  const grid  = document.getElementById('activities-grid');
  const empty = document.getElementById('empty-state');
  if (!grid) return;

  const filtered = currentFilter === 'all'
    ? DATA.activities
    : DATA.activities.filter(a => a.theme === currentFilter);

  if (!filtered.length) {
    grid.innerHTML = '';
    empty && empty.classList.remove('hidden');
    return;
  }
  empty && empty.classList.add('hidden');

  const acc = {};
  DATA.themes.forEach(t => acc[t.id] = 0);

  grid.innerHTML = filtered.map((a, i) => {
    const theme   = DATA.themes.find(t => t.id === a.theme) || { color: '#666', name: '—' };
    const type    = DATA.types[a.type] || { label: a.type, icon: 'fa-solid fa-tag' };
    const space   = Math.max(0, 10 - (acc[a.theme] || 0));
    const counted = Math.min(a.hours, space);
    if (acc[a.theme] !== undefined) acc[a.theme] += counted;
    const muted = counted === 0 ? 'act-muted' : '';

    return `<div class="act-card ${muted}" style="animation-delay:${i * .05}s">
      <div class="act-side" style="background:${theme.color}"></div>
      <div class="act-title">${a.title}</div>
      <div class="act-meta">
        <span class="act-badge" style="background:${theme.color}18;color:${theme.color};border:1px solid ${theme.color}35">${theme.name}</span>
        <span class="act-badge" style="background:rgba(255,255,255,.04);color:#677a96;border:1px solid rgba(255,255,255,.08)">
          <i class="${type.icon}" style="font-size:.6rem"></i> ${type.label}
        </span>
      </div>
      <div class="act-footer">
        <div class="act-hours"><strong>${a.hours}h</strong> → <span style="color:${counted > 0 ? theme.color : '#f87171'}">${counted}h comptées</span>${counted === 0 ? '<br><span style="font-size:.62rem;color:#f87171">Plafond atteint</span>' : ''}</div>
        <div class="act-date">${fmtDate(a.date)}</div>
      </div>
    </div>`;
  }).join('');
}

function renderSummary() {
  const tbody   = document.getElementById('activity-table-body');
  const progCont = document.getElementById('theme-progress-container');
  const acc = {};
  DATA.themes.forEach(t => acc[t.id] = 0);

  if (tbody) {
    tbody.innerHTML = DATA.activities.map(a => {
      const added = Math.min(a.hours, Math.max(0, 10 - (acc[a.theme] || 0)));
      if (acc[a.theme] !== undefined) acc[a.theme] += added;
      const theme = DATA.themes.find(t => t.id === a.theme);
      return `<tr>
        <td style="font-family:var(--fm);font-size:.75rem">${fmtDate(a.date)}</td>
        <td style="color:var(--t1);font-weight:600">${a.title}</td>
        <td><span class="tbl-badge" style="background:${theme.color}18;color:${theme.color};border:1px solid ${theme.color}30">${theme.name}</span></td>
        <td style="font-family:var(--fm)">${a.hours}h</td>
      </tr>`;
    }).join('');
  }

  if (progCont) {
    progCont.innerHTML = DATA.themes.map(t => {
      const v = acc[t.id] || 0;
      return `<div class="progress-item">
        <div class="progress-label"><strong>${t.name}</strong><span>${v}/10h</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${(v/10)*100}%;background:${t.color}"></div></div>
      </div>`;
    }).join('');
  }
}

/* ─── INIT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initThreeScene();
  initCursor();
  initCurtain();       // triggers initHeroEntrance() on complete
  initSidebar();
  initTilt();
  initWordReveal();
  initReveal();
  initMagnetic();
  initCounters();
  initMarquee();
  initSkillBars();
  initTerminal();

  if (document.getElementById('filter-container')) {
    renderFilters();
    renderActivities();
    renderSummary();
  }
});
