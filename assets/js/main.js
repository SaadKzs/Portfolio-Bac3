/* ========================================================================
   PORTFOLIO BAC3 - JAVASCRIPT
   Zebiri Saad - EPHEC 2025
   ======================================================================== */

// ========================================================================
// 🔧 CONFIGURATION DES DONNÉES
// ========================================================================

const DATA = {
    skills: [
        { name: 'Réseaux (Cisco/TCP-IP)', val: 85, color: '#3b82f6' },
        { name: 'Cybersécurité', val: 75, color: '#8b5cf6' },
        { name: 'SysAdmin (Linux)', val: 80, color: '#10b981' },
        { name: 'MERN Stack', val: 70, color: '#06b6d4' }
    ],
    themes: [
        {id: 'network', name: 'Réseaux', type: 'tech', color: '#3b82f6', icon: '📡'},
        {id: 'security', name: 'Cybersécurité', type: 'tech', color: '#8b5cf6', icon: '🛡️'},
        {id: 'web', name: 'Dev Web & MERN', type: 'tech', color: '#06b6d4', icon: '🌐'},
        {id: 'iot', name: 'IoT & Hardware', type: 'tech', color: '#10b981', icon: '📟'},
        {id: 'communication', name: 'Communication', type: 'soft', color: '#f59e0b', icon: '🗣️'},
        {id: 'project', name: 'Gestion Projet', type: 'soft', color: '#ef4444', icon: '📅'}
    ],
    // ==============================================
    // 🔽 AJOUTE TES ACTIVITÉS ICI (MAX 60H) 🔽
    // ==============================================
    activities: [
        /* EXEMPLES (A DÉCOMMENTER ET REMPLACER) :
        {
            theme: 'network',
            title: 'Certification Cisco CCNA 1',
            kind: 'training', // training = max 10h comptées
            hours: 25,
            date: '2025-01-10'
        },
        {
            theme: 'security',
            title: 'Capture The Flag (CTF) - RootMe',
            kind: 'hackathon',
            hours: 8,
            date: '2025-02-20'
        },
        */
    ]
};

// --- Calculateur Logic ---
function calculateHours() {
    const themeTotals = {};
    DATA.themes.forEach(t => themeTotals[t.id] = 0);
    const rows = [];

    DATA.activities.forEach(act => {
        // Règle : Max 10h pour une formation ("training")
        let countable = act.hours;
        if (act.kind === 'training' && act.hours > 10) countable = 10;

        // Règle : Max 10h par thème au total
        const currentTotal = themeTotals[act.theme];
        const spaceLeft = 10 - currentTotal;
        const actuallyAdded = Math.min(countable, Math.max(0, spaceLeft));

        themeTotals[act.theme] += actuallyAdded;

        rows.push({ ...act, counted: actuallyAdded });
    });

    const softTotal = DATA.themes.filter(t => t.type === 'soft').reduce((sum, t) => sum + themeTotals[t.id], 0);
    const techTotal = DATA.themes.filter(t => t.type === 'tech').reduce((sum, t) => sum + themeTotals[t.id], 0);

    return { themeTotals, softTotal, techTotal, rows };
}

// --- Renderers ---
function renderProgress() {
    const stats = calculateHours();
    const total = stats.softTotal + stats.techTotal;
    
    // Barres globales
    const globalEl = document.getElementById('global-progress');
    if(globalEl) {
        globalEl.innerHTML = `
            <div class="mb-6">
                <div class="flex justify-between mb-2 font-mono text-sm">
                    <span class="text-blue-400">TOTAL SYSTEM LOAD</span>
                    <span>${total} / 60 HOURS</span>
                </div>
                <div class="cyber-progress h-4 bg-slate-900 border border-slate-700">
                    <div class="cyber-progress-bar bg-gradient-to-r from-blue-600 to-purple-600" style="width: ${(total/60)*100}%"></div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                     <div class="flex justify-between text-xs mono mb-1 text-slate-400"><span>TECH SKILLS</span><span>${stats.techTotal}/50</span></div>
                     <div class="cyber-progress"><div class="cyber-progress-bar bg-blue-500" style="width: ${(stats.techTotal/50)*100}%"></div></div>
                </div>
                <div>
                     <div class="flex justify-between text-xs mono mb-1 text-slate-400"><span>SOFT SKILLS</span><span>${stats.softTotal}/10</span></div>
                     <div class="cyber-progress"><div class="cyber-progress-bar bg-yellow-500" style="width: ${(stats.softTotal/10)*100}%"></div></div>
                </div>
            </div>
        `;
    }

    // Cartes Thèmes
    const themesEl = document.getElementById('themes-grid');
    if(themesEl) {
        themesEl.innerHTML = DATA.themes.map(theme => {
            const val = stats.themeTotals[theme.id];
            const percent = (val / 10) * 100;
            const isComplete = val >= 10;
            
            return `
            <div class="tech-card p-6 fade-up">
                <div class="flex justify-between items-start mb-4">
                    <div class="text-3xl">${theme.icon}</div>
                    <div class="mono text-xs px-2 py-1 border ${isComplete ? 'border-green-500 text-green-500' : 'border-slate-600 text-slate-500'} rounded">
                        ${isComplete ? 'MAX' : 'ACTIVE'}
                    </div>
                </div>
                <h3 class="text-xl font-bold mb-1">${theme.name}</h3>
                <div class="flex justify-between text-sm text-slate-400 mono mb-2">
                    <span>Capacity</span>
                    <span>${val} / 10h</span>
                </div>
                <div class="cyber-progress bg-black">
                    <div class="cyber-progress-bar" style="width: ${percent}%; background: ${theme.color}; box-shadow: 0 0 10px ${theme.color}"></div>
                </div>
            </div>`;
        }).join('');
    }

    // Tableau Recap
    const tableEl = document.querySelector('#log-table tbody');
    if(tableEl && stats.rows.length > 0) {
        tableEl.innerHTML = stats.rows.map(row => `
            <tr class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td class="py-3 text-blue-400 mono text-sm">[${row.theme.toUpperCase()}]</td>
                <td class="py-3 font-medium">${row.title}</td>
                <td class="py-3 text-slate-400 text-sm">${row.kind}</td>
                <td class="py-3 text-right mono">${row.hours}h</td>
                <td class="py-3 text-right mono font-bold text-white">${row.counted}h</td>
                <td class="py-3 text-right text-slate-500 text-sm mono">${row.date || 'N/A'}</td>
            </tr>
        `).join('');
    }
}

// --- UI Effects ---
function typeWriter(elementId, text, speed = 50) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = '';
    let i = 0;
    function type() {
        if (i < text.length) {
            el.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Trigger progress bars if inside
                const bars = entry.target.querySelectorAll('.cyber-progress-bar');
                bars.forEach(bar => {
                    // Force redraw hack for transition
                    const w = bar.style.width;
                    bar.style.width = '0';
                    setTimeout(() => bar.style.width = w, 100);
                });
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    renderProgress();
    initScrollObserver();
    
    // Typer effect on Hero
    if(document.getElementById('hero-title')) {
        typeWriter('hero-subtitle', 'Network Administrator | Cyber Security Student | SysAdmin', 30);
    }

    // Update Copyright Year
    const y = document.getElementById('year');
    if(y) y.textContent = new Date().getFullYear();
});