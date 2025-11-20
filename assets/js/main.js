/* ========================================================================
   PORTFOLIO BAC3 - JAVASCRIPT
   Zebiri Saad - EPHEC 2025
   ======================================================================== */

// ========================================================================
// 🔧 CONFIGURATION DES DONNÉES
// ========================================================================



const DATA = {
    // --- 📊 DONNÉES À REMPLIR ---
    stats: { soft: 0, tech: 0, total: 0 },
    themes: [
        {id: 'network', name: 'Réseaux', color: '#3b82f6', icon: '📡'},
        {id: 'security', name: 'Sécurité', color: '#8b5cf6', icon: '🔐'},
        {id: 'web', name: 'Web & Dev', color: '#06b6d4', icon: '💻'},
        {id: 'iot', name: 'IoT', color: '#10b981', icon: '🤖'},
        {id: 'soft', name: 'Soft Skills', color: '#f59e0b', icon: '🗣️'}
    ],
    activities: [
        // EXEMPLE 1:
        // { theme: 'network', title: 'Certification Cisco', kind: 'Formation', hours: 15, date: '2025-01-10' },
        // EXEMPLE 2:
        // { theme: 'security', title: 'CTF RootMe', kind: 'Event', hours: 5, date: '2025-02-15' },
    ]
};

// --- 🧮 Moteur de Calcul (Keep it simple) ---
function processData() {
    const themeCounts = {};
    DATA.themes.forEach(t => themeCounts[t.id] = 0);
    const rows = [];

    DATA.activities.forEach(act => {
        // Logique : Max 10h/formation, Max 10h/thème
        let allowed = act.hours;
        if (act.kind.toLowerCase().includes('formation') && allowed > 10) allowed = 10;
        
        // Soft skill mapping
        let themeId = act.theme;
        if (themeId === 'communication' || themeId === 'project') themeId = 'soft';

        const current = themeCounts[themeId] || 0;
        const space = 10 - current;
        const added = Math.min(allowed, Math.max(0, space));
        
        if (themeCounts[themeId] !== undefined) themeCounts[themeId] += added;
        
        rows.push({...act, counted: added});
    });

    // Totals
    let tech = 0, soft = 0;
    DATA.themes.forEach(t => {
        if(t.id === 'soft') soft += themeCounts[t.id];
        else tech += themeCounts[t.id];
    });

    return { themeCounts, rows, tech, soft, total: tech + soft };
}

// --- 🎨 Rendu Visuel ---
function renderDashboard() {
    const data = processData();
    
    // 1. Global Progress
    const totalEl = document.getElementById('total-hours');
    if (totalEl) totalEl.innerText = `${data.total}h`;
    
    const barEl = document.getElementById('main-progress-bar');
    if (barEl) barEl.style.width = `${(data.total / 60) * 100}%`;

    const subStatsEl = document.getElementById('sub-stats');
    if (subStatsEl) {
        subStatsEl.innerHTML = `
            <span class="text-blue-400">IT: ${data.tech}/50h</span> • 
            <span class="text-yellow-400">Soft: ${data.soft}/10h</span>
        `;
    }

    // 2. Mini Cards Themes
    const themesContainer = document.getElementById('mini-themes');
    if (themesContainer) {
        themesContainer.innerHTML = DATA.themes.map(t => {
            const val = data.themeCounts[t.id] || 0;
            const pct = (val / 10) * 100;
            return `
                <div class="mb-3">
                    <div class="flex justify-between text-xs mb-1 text-slate-300">
                        <span>${t.icon} ${t.name}</span>
                        <span>${val}/10</span>
                    </div>
                    <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div class="h-full" style="width: ${pct}%; background: ${t.color}"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 3. Tableau
    const tbody = document.querySelector('#activity-table tbody');
    if (tbody) {
        tbody.innerHTML = data.rows.map(row => `
            <tr>
                <td><span class="badge">${row.theme}</span></td>
                <td class="font-semibold text-white">${row.title}</td>
                <td>${row.kind}</td>
                <td class="text-right opacity-50">${row.hours}h</td>
                <td class="text-right font-bold text-blue-400">${row.counted}h</td>
            </tr>
        `).join('');
    }
}

// --- 🖱️ Interaction & 3D Tilt ---
function initInteractions() {
    // 1. Blobs follow mouse (Parallax soft)
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        document.querySelector('.blob-1').style.transform = `translate(${x * 30}px, ${y * 30}px)`;
        document.querySelector('.blob-2').style.transform = `translate(${-x * 30}px, ${-y * 30}px)`;
    });

    // 2. 3D Tilt Effect on Cards
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculer la rotation (max 5deg)
            const xPct = (x / rect.width) - 0.5;
            const yPct = (y / rect.height) - 0.5;
            
            // rotateY dépend de X, rotateX dépend de Y (inversé)
            card.style.transform = `perspective(1000px) rotateY(${xPct * 5}deg) rotateX(${yPct * -5}deg) scale(1.01)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateY(0) rotateX(0) scale(1)';
        });
    });
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    renderDashboard();
    initInteractions();
    
    // Active Link Logic
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === path) link.classList.add('active');
    });
});