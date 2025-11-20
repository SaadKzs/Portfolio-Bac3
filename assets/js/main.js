/* ========================================================================
   PORTFOLIO LOGIC - SAAD ZEBIRI
   ======================================================================== */

const DATA = {
    // 📊 LES DONNÉES RÉELLES
    activities: [
        // Activités exemples (à compléter avec tes vraies heures)
        { 
            theme: 'network', 
            title: 'Network Basics Project', 
            kind: 'Projet', 
            hours: 15, 
            date: '2023-2025' 
        },
        { 
            theme: 'iot', 
            title: 'Smart Mailbox "Boite-alerte"', 
            kind: 'Projet Group', 
            hours: 20, 
            date: '2024' 
        },
        { 
            theme: 'security', 
            title: 'Lhoist Security Onboarding', 
            kind: 'Stage', 
            hours: 10, 
            date: '2025' 
        },
        { 
            theme: 'web', 
            title: 'Portfolio Development', 
            kind: 'Projet Perso', 
            hours: 10, 
            date: '2025' 
        },
        { 
            theme: 'soft', 
            title: 'Group IT Project Management', 
            kind: 'Gestion Projet', 
            hours: 5, 
            date: '2024' 
        }
    ],
    
    // Configuration des thèmes EPHEC
    themes: [
        { id: 'network', name: 'Réseaux', color: '#2997FF', icon: 'fa-network-wired' },      // Tech
        { id: 'security', name: 'Cybersécurité', color: '#BF5AF2', icon: 'fa-shield-alt' },  // Tech
        { id: 'web', name: 'Web / MERN', color: '#30D158', icon: 'fa-code' },                // Tech
        { id: 'iot', name: 'IoT / Hardware', color: '#FFD60A', icon: 'fa-microchip' },       // Tech
        { id: 'soft', name: 'Communication', color: '#FF9F0A', icon: 'fa-comments' },        // Soft
        { id: 'project', name: 'Gestion Projet', color: '#FF453A', icon: 'fa-tasks' }        // Soft
    ]
};

function renderDashboard() {
    const stats = {};
    let globalTotal = 0;
    
    // Init stats
    DATA.themes.forEach(t => stats[t.id] = 0);

    // Calcul (Règle: Max 10h par thème comptabilisé pour le total portfolio)
    const rowsHTML = DATA.activities.map(act => {
        let mapTheme = act.theme;
        
        // Mapping simplifié pour les thèmes soft/tech si besoin
        // Ici on utilise les IDs directs définis dans DATA.themes
        
        let counted = act.hours;
        // Plafonnement intelligent (juste pour l'affichage du total validé)
        const current = stats[mapTheme] || 0;
        const space = 10 - current;
        const added = Math.min(counted, Math.max(0, space));
        
        if(stats[mapTheme] !== undefined) {
            stats[mapTheme] += added;
            globalTotal += added;
        }

        return `
            <tr class="transition-colors hover:bg-white/5">
                <td><span class="badge">${DATA.themes.find(t=>t.id===mapTheme)?.name || mapTheme}</span></td>
                <td class="font-medium text-white">${act.title}</td>
                <td class="text-[#86868B] text-sm">${act.kind}</td>
                <td class="text-right font-mono font-bold text-white">${added}h <span class="text-[#86868B] text-xs font-normal">/ ${act.hours}h</span></td>
            </tr>
        `;
    }).join('');

    // Render Table
    const tableEl = document.getElementById('activity-rows');
    if(tableEl) tableEl.innerHTML = rowsHTML;

    // Render Total
    const totalEl = document.getElementById('total-hours');
    if(totalEl) totalEl.innerText = `${globalTotal}h`;

    // Render Theme Cards
    const gridEl = document.getElementById('themes-container');
    if(gridEl) {
        gridEl.innerHTML = DATA.themes.map(t => {
            const val = stats[t.id];
            const pct = (val / 10) * 100;
            const isDone = val >= 10;
            
            return `
                <div class="bento-card p-5 flex flex-col justify-between">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background: ${t.color}20; color: ${t.color}">
                            <i class="fas ${t.icon}"></i>
                        </div>
                        <div class="text-lg font-bold font-mono text-white">${val}<span class="text-xs text-[#86868B]">/10</span></div>
                    </div>
                    <div>
                        <h4 class="font-medium text-sm mb-2 text-gray-300">${t.name}</h4>
                        <div class="w-full h-2 bg-[#333] rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-1000" style="width: ${pct}%; background: ${t.color}"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Mouse move effect for cards
    document.querySelectorAll('.bento-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

document.addEventListener('DOMContentLoaded', renderDashboard);