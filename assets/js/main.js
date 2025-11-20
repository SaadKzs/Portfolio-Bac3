/* ========================================================================
   PORTFOLIO LOGIC - SAAD ZEBIRI (UPDATED)
   ======================================================================== */

const DATA = {
    // 1. DÉFINITION DES THÈMES (Couleurs & IDs)
    themes: [
        { id: 'network', name: 'Réseaux', color: '#3b82f6', type: 'tech' },
        { id: 'security', name: 'Cybersécurité', color: '#8b5cf6', type: 'tech' },
        { id: 'web', name: 'Web / MERN', color: '#06b6d4', type: 'tech' },
        { id: 'iot', name: 'IoT', color: '#10b981', type: 'tech' },
        { id: 'communication', name: 'Communication', color: '#f59e0b', type: 'soft' },
        { id: 'project', name: 'Gestion Projet', color: '#ef4444', type: 'soft' }
    ],

    // 2. DÉFINITION DES TYPES D'ACTIVITÉS (Emojis & Labels)
    types: {
        'hackathon': { label: 'Hackathon', emoji: '💻' },
        'training_online': { label: 'Formation en ligne', emoji: '🌐' },
        'training_onsite': { label: 'Formation présentiel', emoji: '🎓' },
        'conference': { label: 'Conférence', emoji: '🎤' },
        'visit': { label: 'Visite Entr.', emoji: '🏢' },
        'fair': { label: 'Salon / DevDay', emoji: '🎪' },
        'jobday': { label: 'IT Job Day', emoji: '💼' },
        'project': { label: 'Projet', emoji: '🚀' }, // Type générique si besoin
        'stage': { label: 'Stage', emoji: '👔' }     // Type générique si besoin
    },

    // 3. LISTE DES ACTIVITÉS (Ajoute tes vraies données ici)
    activities: [
        { 
            theme: 'network', 
            title: 'Network Basics Project', 
            type: 'project', 
            hours: 15, // 15h réelles -> comptera pour 10h max
            date: '2024-05-10' 
        },
        { 
            theme: 'iot', 
            title: 'Smart Mailbox "Boite-alerte"', 
            type: 'hackathon', 
            hours: 20, // 20h réelles -> comptera pour 10h max
            date: '2024-03-15' 
        },
        { 
            theme: 'security', 
            title: 'Lhoist Security Onboarding', 
            type: 'stage', 
            hours: 8, 
            date: '2025-02-01' 
        },
        { 
            theme: 'web', 
            title: 'Portfolio Development', 
            type: 'project', 
            hours: 12, 
            date: '2025-01-20' 
        },
        { 
            theme: 'soft', 
            title: 'Presentation Skills', 
            type: 'training_onsite', 
            hours: 4, 
            date: '2024-11-10' 
        },
        { 
            theme: 'soft', 
            title: 'Communication Workshop', 
            type: 'conference', 
            hours: 8, 
            date: '2024-12-05' 
        }
    ]
};

// --- LOGIQUE DE CALCUL ET RENDU ---

let currentFilter = 'all';

function initExplorer() {
    renderFilters();
    renderActivities();
}

function renderFilters() {
    const container = document.getElementById('filter-container');
    if (!container) return;

    // Calculer les totaux par thème pour les badges des boutons
    const themeStats = {};
    DATA.themes.forEach(t => themeStats[t.id] = 0);

    DATA.activities.forEach(act => {
        // Règle 1 : Une activité compte max 10h
        const activityCounted = Math.min(act.hours, 10);
        
        // Règle 2 : Le thème compte max 10h au total
        // On ajoute temporairement tout pour savoir si c'est complet, on plafonnera à l'affichage
        if (themeStats[act.theme] !== undefined) {
            // On ajoute seulement ce qui manque pour atteindre 10h
            const spaceLeft = 10 - Math.min(themeStats[act.theme], 10);
            themeStats[act.theme] += Math.min(activityCounted, spaceLeft);
        }
    });

    // Création du bouton "TOUS"
    let html = `
        <button onclick="setFilter('all')" 
            class="filter-btn ${currentFilter === 'all' ? 'active' : ''}"
            style="${currentFilter === 'all' ? 'border-color: white; background: rgba(255,255,255,0.1);' : ''}">
            <span>Tous</span>
        </button>
    `;

    // Création des boutons THÈMES
    DATA.themes.forEach(t => {
        const hours = Math.min(themeStats[t.id], 10); // Plafond visuel à 10
        const isComplete = hours >= 10;
        const isActive = currentFilter === t.id;
        
        // Style dynamique si actif
        const activeStyle = isActive 
            ? `border-color: ${t.color}; box-shadow: 0 0 15px ${t.color}40; color: white;` 
            : '';

        html += `
            <button onclick="setFilter('${t.id}')" 
                class="filter-btn ${isActive ? 'active' : ''}"
                style="${activeStyle}">
                <span style="color: ${isActive ? 'white' : t.color}">●</span>
                <span>${t.name}</span>
                <span class="font-mono text-xs opacity-60 ml-1">${hours}/10h</span>
                ${isComplete ? '<i class="fas fa-check-circle text-xs ml-1" style="color:#10b981"></i>' : ''}
            </button>
        `;
    });

    container.innerHTML = html;
}

function renderActivities() {
    const grid = document.getElementById('activities-grid');
    const emptyState = document.getElementById('empty-state');
    if (!grid) return;

    // 1. Filtrer les activités
    let filteredActivities = DATA.activities;
    if (currentFilter !== 'all') {
        filteredActivities = DATA.activities.filter(a => a.theme === currentFilter);
    }

    // 2. Gérer l'état vide
    if (filteredActivities.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    // 3. Calculer les cumuls pour savoir si une activité "compte" ou si le thème est déjà plein
    // On doit le faire chronologiquement ou par ordre de liste pour être juste
    const themeAccumulator = {}; 
    DATA.themes.forEach(t => themeAccumulator[t.id] = 0);

    const cardsHTML = filteredActivities.map((act, index) => {
        const themeDef = DATA.themes.find(t => t.id === act.theme);
        const typeDef = DATA.types[act.type] || { label: act.type, emoji: '📌' };
        
        // Logique de calcul précise pour cette carte
        const hoursCappedByActivity = Math.min(act.hours, 10); // Max 10h/activité
        const currentThemeTotal = themeAccumulator[act.theme] || 0;
        const spaceLeftInTheme = 10 - currentThemeTotal;
        
        // Combien d'heures cette activité ajoute-t-elle réellement au total du thème ?
        const hoursEffectivelyCounted = Math.max(0, Math.min(hoursCappedByActivity, spaceLeftInTheme));
        
        // Mettre à jour l'accumulateur pour la prochaine itération
        themeAccumulator[act.theme] += hoursEffectivelyCounted;

        // Est-ce que cette activité compte ?
        const isCounted = hoursEffectivelyCounted > 0;
        const opacityClass = isCounted ? '' : 'opacity-60 grayscale-[0.5]'; // Griser légèrement si ne compte plus

        return `
            <div class="activity-card group ${opacityClass}" style="animation-delay: ${index * 0.05}s">
                <div class="activity-border-left" style="background: ${themeDef.color}"></div>
                
                <div class="mb-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg text-white leading-tight group-hover:text-[${themeDef.color}] transition-colors">
                            ${act.title}
                        </h3>
                    </div>
                    
                    <div class="flex flex-wrap gap-2 mt-3">
                        <span class="card-badge" style="background: ${themeDef.color}20; color: ${themeDef.color}; border: 1px solid ${themeDef.color}40">
                            ${themeDef.name}
                        </span>
                        <span class="card-badge bg-white/5 text-gray-300 border border-white/10">
                            ${typeDef.emoji} ${typeDef.label}
                        </span>
                    </div>
                </div>

                <div class="pt-4 border-t border-white/5 flex justify-between items-end">
                    <div>
                        <div class="text-xs text-secondary mb-1">Heures validées</div>
                        <div class="font-mono-data text-sm">
                            <span class="text-white font-bold">${act.hours}h</span> réelles 
                            <span class="text-secondary mx-1">→</span> 
                            <span style="color: ${isCounted ? themeDef.color : '#666'}">
                                ${hoursEffectivelyCounted}h comptées
                            </span>
                        </div>
                        ${!isCounted ? '<div class="text-[10px] text-red-400 mt-1"><i class="fas fa-info-circle"></i> Plafond thème atteint</div>' : ''}
                    </div>
                    <div class="text-xs font-mono-data text-secondary opacity-70">
                        ${formatDate(act.date)}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    grid.innerHTML = cardsHTML;
}

// Helper: Format date Belge
function formatDate(dateString) {
    if(!dateString) return '';
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
}

// Fonction appelée par les boutons
window.setFilter = function(filterId) {
    currentFilter = filterId;
    renderFilters(); // Pour mettre à jour l'état actif des boutons
    renderActivities();
};

// Init au chargement
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les autres fonctions existantes (Particules, etc...)
    if(typeof initParticles === 'function') initParticles();
    if(typeof renderPortfolio === 'function') renderPortfolio(); // L'ancien tableau
    
    // Lancer l'explorateur
    initExplorer();
});