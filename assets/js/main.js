/* ========================================================================
   PORTFOLIO ENGINE - SAAD ZEBIRI
   ======================================================================== */

const DATA = {
    // ⚠️ REMPLIS TES ACTIVITÉS ICI ⚠️
    activities: [
        // { theme: 'network', title: 'Formation Cisco CCNA 1', kind: 'Formation', hours: 25, date: '2025-01-15' },
        // { theme: 'security', title: 'Workshop Cyber', kind: 'Atelier', hours: 4, date: '2025-02-20' },
        // { theme: 'web', title: 'Projet React Personnel', kind: 'Projet', hours: 15, date: '2025-03-10' }
    ],
    
    themes: [
        { id: 'network', name: 'Réseaux', color: 'from-blue-500 to-blue-700', icon: 'fa-network-wired', max: 10 },
        { id: 'security', name: 'Cybersécurité', color: 'from-purple-500 to-purple-700', icon: 'fa-shield-alt', max: 10 },
        { id: 'web', name: 'Dev Web', color: 'from-cyan-500 to-cyan-700', icon: 'fa-code', max: 10 },
        { id: 'iot', name: 'IoT & SysAdmin', color: 'from-emerald-500 to-emerald-700', icon: 'fa-server', max: 10 },
        { id: 'soft', name: 'Soft Skills', color: 'from-orange-500 to-orange-700', icon: 'fa-users', max: 10 },
        { id: 'project', name: 'Gestion Projet', color: 'from-red-500 to-red-700', icon: 'fa-tasks', max: 10 }
    ]
};

function initDashboard() {
    const themeStats = {};
    DATA.themes.forEach(t => themeStats[t.id] = 0);
    
    let totalHours = 0;
    const tableBody = document.getElementById('activity-tbody');
    
    // Si on n'est pas sur la page d'accueil (pas de tableau), on arrête le script
    if (!tableBody) return; 
    
    tableBody.innerHTML = '';

    // 1. CALCULER ET REMPLIR LE TABLEAU
    DATA.activities.forEach(act => {
        let hoursToAdd = act.hours;
        
        const currentThemeTotal = themeStats[act.theme] || 0;
        const remainingSpace = 10 - currentThemeTotal;
        const counted = Math.min(hoursToAdd, Math.max(0, remainingSpace));
        
        themeStats[act.theme] += counted;
        totalHours += counted;

        // Ajouter au tableau HTML
        const row = `
            <tr class="hover:bg-white/5 transition">
                <td class="p-4">
                    <span class="px-2 py-1 rounded text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700 uppercase">
                        ${act.theme}
                    </span>
                </td>
                <td class="p-4 font-medium text-white">${act.title}</td>
                <td class="p-4 text-gray-400">${act.kind}</td>
                <td class="p-4 text-right font-mono">
                    <span class="text-gray-500 line-through text-xs mr-2">${act.hours > counted ? act.hours : ''}</span>
                    <span class="text-brand-blue font-bold">${counted}h</span>
                </td>
                <td class="p-4 text-right text-gray-500 font-mono">${act.date}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    // 2. METTRE À JOUR LES CARTES THÈMES
    const themesGrid = document.getElementById('themes-grid');
    if (themesGrid) {
        themesGrid.innerHTML = DATA.themes.map(t => {
            const val = themeStats[t.id] || 0;
            const pct = (val / 10) * 100;

            return `
            <div class="glass-panel p-6 rounded-xl relative overflow-hidden group">
                <div class="flex justify-between items-start mb-4 relative z-10">
                    <div class="p-3 rounded-lg bg-white/5 text-white">
                        <i class="fas ${t.icon} text-lg"></i>
                    </div>
                    <div class="text-2xl font-bold font-display text-white">${val}<span class="text-sm text-gray-500 font-normal">/10h</span></div>
                </div>
                
                <h4 class="text-lg font-bold text-gray-200 mb-2 relative z-10">${t.name}</h4>
                
                <div class="h-2 bg-gray-800 rounded-full overflow-hidden relative z-10">
                    <div class="h-full bg-gradient-to-r ${t.color}" style="width: ${pct}%"></div>
                </div>

                <div class="absolute inset-0 bg-gradient-to-br ${t.color} opacity-0 group-hover:opacity-10 transition duration-500"></div>
            </div>
            `;
        }).join('');
    }

    // 3. METTRE À JOUR LE HERO HEADER
    const heroTotal = document.getElementById('hero-total');
    const heroBar = document.getElementById('hero-bar');
    const badge = document.getElementById('total-badge');

    if (heroTotal) heroTotal.innerText = `${totalHours} / 60h`;
    if (badge) badge.innerText = `Total Validé: ${totalHours}h`;
    if (heroBar) setTimeout(() => heroBar.style.width = `${(totalHours / 60) * 100}%`, 500);
}

// Lancer au chargement
document.addEventListener('DOMContentLoaded', initDashboard);