/* ========================================================================
   PORTFOLIO BAC3 - JAVASCRIPT
   Zebiri Saad - EPHEC 2025
   ======================================================================== */

// ========================================================================
// 🔧 CONFIGURATION DES DONNÉES
// ========================================================================

const DATA = {
  meta: {
    summary: "Étudiant en 3e Bac TI à l'EPHEC, passionné par le réseau, la cybersécurité et l'IA. Je construis des projets MERN/IoT et je cherche un stage pour apprendre et contribuer."
  },
  
  cv: {
    skills: [
      'Cisco / Packet Tracer', 
      'Linux basics', 
      'Admin Systèmes & Réseaux', 
      'Docker, DNS, HTTP/HTTPS, Mail', 
      'Web MERN (Mongo/Express/React/Node)', 
      'IoT & intégration soft/hard', 
      'Python, C, C++, JS, HTML/CSS', 
      'Git & GitHub'
    ],
    experience: [
      {
        title: 'IT Support Practice – EPHEC', 
        period: '2023–2024', 
        details: 'Diagnostic pannes logicielles & matérielles (Windows/Linux).'
      },
      {
        title: 'Network Basics Project – EPHEC', 
        period: '2023–2025', 
        details: 'Config routeurs/switches, adressage IP, troubleshooting.'
      },
      {
        title: 'Group IT Project – EPHEC', 
        period: '2023–2025', 
        details: 'Gestion de projet, présentation de solution (ex: multiprise connectée).'
      },
      {
        title: 'Personal Tech Support', 
        period: '2023–Maintenant', 
        details: 'Assistance famille/amis : installs, réseau, bugs quotidiens.'
      }
    ],
    education: [
      {title: 'Bachelier TI', place: 'EPHEC – Bruxelles', period: '2023–…'},
      {title: 'MOOC Python', place: 'OpenClassrooms', period: '2022'},
      {title: 'CESS', place: 'Lycée Daschbeck – Bruxelles', period: '2021'}
    ],
    languages: [
      {name: 'Français', level: 'Courant'}, 
      {name: 'Arabe', level: 'Courant'}, 
      {name: 'Anglais', level: 'B2'}, 
      {name: 'Néerlandais', level: 'Bases'}
    ]
  },
  
  themes: [
    {id: 'network', name: 'Réseaux', type: 'tech', color: '#3b82f6'},
    {id: 'security', name: 'Cybersécurité', type: 'tech', color: '#8b5cf6'},
    {id: 'web', name: 'Web / MERN', type: 'tech', color: '#06b6d4'},
    {id: 'iot', name: 'IoT', type: 'tech', color: '#10b981'},
    {id: 'communication', name: 'Communication', type: 'soft', color: '#f59e0b'},
    {id: 'project', name: 'Gestion de projet', type: 'soft', color: '#ef4444'}
  ],
  
  // ========== AJOUTE TES ACTIVITÉS ICI ==========
  activities: [
    // Exemples à décommenter et modifier :
    // 
    // {
    //   theme: 'network',
    //   title: 'Formation Cisco CCNA',
    //   kind: 'training',
    //   hours: 25,
    //   date: '2025-02-15'
    // },
    // 
    // {
    //   theme: 'security',
    //   title: 'Workshop CTF Cybersécurité',
    //   kind: 'event',
    //   hours: 6,
    //   date: '2025-03-10'
    // },
    // 
    // {
    //   theme: 'communication',
    //   title: 'Présentation projet EPHEC',
    //   kind: 'event',
    //   hours: 4,
    //   date: '2025-03-20'
    // },
  ]
};

// ========================================================================
// 🎨 ANIMATIONS & PARTICULES
// ========================================================================

function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    particle.style.animationDelay = Math.random() * 5 + 's';
    particle.style.opacity = Math.random() * 0.5 + 0.1;
    
    const style = document.createElement('style');
    const animName = `floatParticle${i}`;
    style.textContent = `
      @keyframes ${animName} {
        0% {
          transform: translateY(100vh) translateX(0);
          opacity: 0;
        }
        10% {
          opacity: 0.3;
        }
        90% {
          opacity: 0.3;
        }
        100% {
          transform: translateY(-100vh) translateX(${Math.random() * 200 - 100}px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    particle.style.animation = `${animName} ${Math.random() * 20 + 15}s linear infinite`;
    
    container.appendChild(particle);
  }
}

// ========================================================================
// 📊 CALCUL DES HEURES
// ========================================================================

const countedActivityHours = a => {
  // Les formations comptent maximum 10h
  if (a.kind === 'training') {
    return Math.min(a.hours || 0, 10);
  }
  return a.hours || 0;
};

function aggregate() {
  const themeTotals = Object.fromEntries(DATA.themes.map(t => [t.id, 0]));
  const rows = [];
  
  for (const a of DATA.activities) {
    const counted = countedActivityHours(a);
    // Maximum 10h par thème
    const newTotal = Math.min(10, themeTotals[a.theme] + counted);
    const added = newTotal - themeTotals[a.theme];
    themeTotals[a.theme] = newTotal;
    rows.push({a, counted, added});
  }
  
  const soft = DATA.themes
    .filter(t => t.type === 'soft')
    .reduce((s, t) => s + themeTotals[t.id], 0);
  
  const tech = DATA.themes
    .filter(t => t.type === 'tech')
    .reduce((s, t) => s + themeTotals[t.id], 0);
  
  return {themeTotals, soft, tech, rows};
}

// ========================================================================
// 🖼️ RENDU DES ÉLÉMENTS
// ========================================================================

function renderProgress() {
  const progressEl = document.getElementById('progress');
  if (!progressEl) return;
  
  const {soft, tech} = aggregate();
  const total = soft + tech;
  
  const bar = (label, val, max, color) => `
    <div>
      <div class="flex justify-between text-sm mb-3">
        <span class="text-slate-300">${label}</span>
        <span class="font-bold mono">${val} / ${max}h</span>
      </div>
      <div class="progress-container">
        <div class="progress-fill" style="width: ${Math.min(100, (val / max) * 100)}%; background: ${color}; color: ${color};"></div>
      </div>
    </div>
  `;
  
  progressEl.innerHTML = [
    bar('Soft skills', soft, 10, '#f59e0b'),
    bar('Informatique', tech, 50, '#3b82f6'),
    `<div class="mt-6 p-5 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/30">
      <div class="text-sm text-slate-400 mb-2">Total comptabilisé</div>
      <div class="text-3xl font-bold gradient-text">${total} / 60h</div>
    </div>`
  ].join('');
  
  const warningsEl = document.getElementById('warnings');
  if (warningsEl) {
    const warn = [];
    if (soft > 10) warn.push('⚠️ Soft > 10h');
    if (tech > 50) warn.push('⚠️ IT > 50h');
    if (total < 60) warn.push(`📌 ${60 - total}h restantes`);
    warningsEl.textContent = warn.join(' • ');
  }
}

function renderThemes() {
  const themesGrid = document.getElementById('themesGrid');
  if (!themesGrid) return;
  
  const {themeTotals} = aggregate();
  const actsByTheme = {};
  DATA.activities.forEach(a => {
    (actsByTheme[a.theme] ??= []).push(a);
  });
  
  themesGrid.innerHTML = DATA.themes.map(t => {
    const pct = Math.min(100, (themeTotals[t.id] / 10) * 100);
    const acts = (actsByTheme[t.id] || []).map(a => 
      `<div class="flex justify-between text-sm py-2 border-b border-white/5">
        <span class="text-slate-300">• ${a.title}</span>
        <span class="text-slate-500 text-xs mono">${a.hours}h → ${Math.min(countedActivityHours(a), 10)}h</span>
      </div>`
    ).join('') || '<div class="text-sm text-slate-500 italic py-2">— à compléter —</div>';
    
    return `
      <div class="glass-card p-6">
        <div class="flex justify-between items-center mb-4">
          <span class="font-bold text-lg">${t.name}</span>
          <span class="badge" style="background: ${t.color}20; color: ${t.color}; border: 1px solid ${t.color};">
            ${themeTotals[t.id]} / 10h
          </span>
        </div>
        <div class="progress-container mb-4">
          <div class="progress-fill" style="width: ${pct}%; background: ${t.color}; color: ${t.color};"></div>
        </div>
        <div class="space-y-1">${acts}</div>
      </div>
    `;
  }).join('');
}

function renderTable() {
  const tbody = document.querySelector('#summaryTable tbody');
  if (!tbody) return;
  
  const {rows} = aggregate();
  const themeMap = Object.fromEntries(DATA.themes.map(t => [t.id, t]));
  
  if (rows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-16">
          <div class="text-6xl mb-4 opacity-20">📊</div>
          <div class="text-xl mb-3 font-semibold">Aucune activité enregistrée</div>
          <div class="text-sm text-slate-500">
            Ajoute tes activités dans <code class="bg-blue-500/10 px-3 py-1 rounded text-blue-400 mono">DATA.activities</code>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = rows.map(({a, counted}) => {
    const theme = themeMap[a.theme];
    return `
      <tr>
        <td>
          <span class="badge" style="background: ${theme.color}20; color: ${theme.color}; border: 1px solid ${theme.color};">
            ${theme.name}
          </span>
        </td>
        <td class="font-medium">${a.title}</td>
        <td>
          <span class="badge" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); font-size: 12px;">
            ${a.kind}
          </span>
        </td>
        <td class="text-right text-slate-400 mono">${a.hours}h</td>
        <td class="text-right font-bold text-lg mono" style="color: ${theme.color};">${counted}h</td>
        <td class="text-slate-500 text-sm mono">
          ${a.date ? new Date(a.date).toLocaleDateString('fr-BE') : '—'}
        </td>
      </tr>
    `;
  }).join('');
}

function renderCV() {
  const skillsEl = document.getElementById('skills');
  if (skillsEl) {
    skillsEl.innerHTML = DATA.cv.skills.map(s => `<span class="skill-tag">${s}</span>`).join('');
  }
  
  const languagesEl = document.getElementById('languages');
  if (languagesEl) {
    languagesEl.innerHTML = DATA.cv.languages.map(l => `<span class="skill-tag">${l.name} – ${l.level}</span>`).join('');
  }
  
  const xpEl = document.getElementById('xp');
  if (xpEl) {
    xpEl.innerHTML = DATA.cv.experience.map(e => `
      <div class="glass-card p-5">
        <div class="font-semibold text-lg">${e.title}</div>
        <div class="text-sm text-blue-400 mt-1 mono">${e.period}</div>
        <div class="text-sm text-slate-400 mt-3">${e.details}</div>
      </div>
    `).join('');
  }
  
  const eduEl = document.getElementById('edu');
  if (eduEl) {
    eduEl.innerHTML = DATA.cv.education.map(e => `
      <div class="glass-card p-5">
        <div class="font-semibold text-lg">${e.title}</div>
        <div class="text-sm text-cyan-400 mt-1">${e.place}</div>
        <div class="text-sm text-slate-400 mt-1 mono">${e.period}</div>
      </div>
    `).join('');
  }
}

// ========================================================================
// 📧 FORMULAIRE DE CONTACT
// ========================================================================

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  
  form.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const subject = encodeURIComponent('Contact depuis le portfolio');
    const body = encodeURIComponent(
      `Nom: ${formData.get('name')}\nEmail: ${formData.get('email')}\n\nMessage:\n${formData.get('msg')}`
    );
    window.location.href = `mailto:saadzebiri65@gmail.com?subject=${subject}&body=${body}`;
  });
}

// ========================================================================
// 🎯 ACTIVE NAVIGATION LINK
// ========================================================================

function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// ========================================================================
// 🚀 INITIALISATION
// ========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Année dans le footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
  
  // Résumé
  const summaryEl = document.getElementById('summary');
  if (summaryEl) {
    summaryEl.textContent = DATA.meta.summary;
  }
  
  const cvSummaryEl = document.getElementById('cvSummary');
  if (cvSummaryEl) {
    cvSummaryEl.textContent = DATA.meta.summary;
  }
  
  // Créer les particules
  createParticles();
  
  // Rendre les éléments selon la page
  renderProgress();
  renderThemes();
  renderTable();
  renderCV();
  
  // Initialiser le formulaire
  initContactForm();
  
  // Active nav link
  setActiveNavLink();
});

// Export pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DATA, aggregate, renderProgress, renderThemes, renderTable };
}