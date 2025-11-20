/* ========================================================================
   PORTFOLIO ENGINE - SAAD ZEBIRI (FULL MERGED VERSION)
   ======================================================================== */

const DATA = {
    // --- CONFIGURATION ---
    themes: [
        { id: 'network', name: 'Réseaux', color: '#3b82f6', type: 'tech' },
        { id: 'security', name: 'Cybersécurité', color: '#8b5cf6', type: 'tech' },
        { id: 'web', name: 'Web / MERN', color: '#06b6d4', type: 'tech' },
        { id: 'iot', name: 'IoT', color: '#10b981', type: 'tech' },
        { id: 'communication', name: 'Communication', color: '#f59e0b', type: 'soft' },
        { id: 'project', name: 'Gestion Projet', color: '#ef4444', type: 'soft' }
    ],
    types: {
        'hackathon': { label: 'Hackathon', emoji: '💻' },
        'training_online': { label: 'Formation en ligne', emoji: '🌐' },
        'training_onsite': { label: 'Formation présentiel', emoji: '🎓' },
        'conference': { label: 'Conférence', emoji: '🎤' },
        'visit': { label: 'Visite Entr.', emoji: '🏢' },
        'fair': { label: 'Salon / DevDay', emoji: '🎪' },
        'jobday': { label: 'IT Job Day', emoji: '💼' },
        'project': { label: 'Projet', emoji: '🚀' },
        'stage': { label: 'Stage', emoji: '👔' }
    },
    // --- VOS ACTIVITÉS ---
    activities: [
        { theme: 'network', title: 'Network Basics Project', type: 'project', hours: 15, date: '2024-05-10' },
        { theme: 'iot', title: 'Smart Mailbox "Boite-alerte"', type: 'hackathon', hours: 20, date: '2024-03-15' },
        { theme: 'security', title: 'Lhoist Security Onboarding', type: 'stage', hours: 8, date: '2025-02-01' },
        { theme: 'web', title: 'Portfolio Development', type: 'project', hours: 12, date: '2025-01-20' },
        { theme: 'soft', title: 'Presentation Skills', type: 'training_onsite', hours: 4, date: '2024-11-10' },
        { theme: 'soft', title: 'Communication Workshop', type: 'conference', hours: 8, date: '2024-12-05' }
    ]
};

/* ========================================================================
   1. ANIMATION FOND (PARTICULES)
   ======================================================================== */
const canvas = document.getElementById('canvas-container');
let ctx;
let particlesArray;

if (canvas) {
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let mouse = { x: null, y: null, radius: 150 };

    window.addEventListener('mousemove', (event) => {
        mouse.x = event.x;
        mouse.y = event.y;
    });

    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = '#64ffda';
            ctx.fill();
        }
        update() {
            if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
            if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx*dx + dy*dy);

            if (distance < mouse.radius + this.size) {
                if (mouse.x < this.x && this.x < canvas.width - this.size * 10) this.x += 2;
                if (mouse.x > this.x && this.x > this.size * 10) this.x -= 2;
                if (mouse.y < this.y && this.y < canvas.height - this.size * 10) this.y += 2;
                if (mouse.y > this.y && this.y > this.size * 10) this.y -= 2;
            }
            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    function initParticles() {
        particlesArray = [];
        let numberOfParticles = (canvas.height * canvas.width) / 9000;
        for (let i = 0; i < numberOfParticles; i++) {
            let size = (Math.random() * 2) + 1;
            let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
            let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
            let directionX = (Math.random() * 0.4) - 0.2;
            let directionY = (Math.random() * 0.4) - 0.2;
            particlesArray.push(new Particle(x, y, directionX, directionY, size, '#64ffda'));
        }
    }

    function connectParticles() {
        let opacityValue = 1;
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x))
                             + ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
                if (distance < (canvas.width/7) * (canvas.height/7)) {
                    opacityValue = 1 - (distance/20000);
                    ctx.strokeStyle = 'rgba(100, 255, 218,' + opacityValue + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animateParticles() {
        requestAnimationFrame(animateParticles);
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }
        connectParticles();
    }

    window.addEventListener('resize', () => {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
        initParticles();
    });
}

/* ========================================================================
   2. TYPING EFFECT (Écriture automatique)
   ======================================================================== */
const textsToType = ["Networks.", "Infrastructure.", "IoT Systems.", "the Future."];
let count = 0;
let index = 0;
let currentText = "";
let letter = "";

function typeEffect() {
    const element = document.getElementById('typing-text');
    if(!element) return;

    if (count === textsToType.length) count = 0;
    currentText = textsToType[count];
    letter = currentText.slice(0, ++index);
    
    element.textContent = letter;
    
    if (letter.length === currentText.length) {
        setTimeout(() => {
            index = 0;
            count++;
        }, 2000);
    }
    setTimeout(typeEffect, 100);
}

/* ========================================================================
   3. SCROLL REVEAL (Apparition au défilement - CRITIQUE POUR L'AFFICHAGE)
   ======================================================================== */
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));
}

/* ========================================================================
   4. EXPLORER & FILTER LOGIC
   ======================================================================== */
let currentFilter = 'all';

function initExplorer() {
    renderFilters();
    renderActivities();
    renderTableSummary(); // Ajout de la fonction pour le tableau du bas
}

function renderFilters() {
    const container = document.getElementById('filter-container');
    if (!container) return;

    const themeStats = {};
    DATA.themes.forEach(t => themeStats[t.id] = 0);

    DATA.activities.forEach(act => {
        const activityCounted = Math.min(act.hours, 10);
        if (themeStats[act.theme] !== undefined) {
            const spaceLeft = 10 - Math.min(themeStats[act.theme], 10);
            themeStats[act.theme] += Math.min(activityCounted, spaceLeft);
        }
    });

    let html = `
        <button onclick="setFilter('all')" 
            class="filter-btn ${currentFilter === 'all' ? 'active' : ''}"
            style="${currentFilter === 'all' ? 'border-color: white; background: rgba(255,255,255,0.1);' : ''}">
            <span>Tous</span>
        </button>
    `;

    DATA.themes.forEach(t => {
        const hours = Math.min(themeStats[t.id], 10);
        const isComplete = hours >= 10;
        const isActive = currentFilter === t.id;
        const activeStyle = isActive ? `border-color: ${t.color}; box-shadow: 0 0 15px ${t.color}40; color: white;` : '';

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

    let filteredActivities = DATA.activities;
    if (currentFilter !== 'all') {
        filteredActivities = DATA.activities.filter(a => a.theme === currentFilter);
    }

    if (filteredActivities.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    const themeAccumulator = {}; 
    DATA.themes.forEach(t => themeAccumulator[t.id] = 0);

    const cardsHTML = filteredActivities.map((act, index) => {
        const themeDef = DATA.themes.find(t => t.id === act.theme);
        const typeDef = DATA.types[act.type] || { label: act.type, emoji: '📌' };
        
        const hoursCappedByActivity = Math.min(act.hours, 10);
        const currentThemeTotal = themeAccumulator[act.theme] || 0;
        const spaceLeftInTheme = 10 - currentThemeTotal;
        const hoursEffectivelyCounted = Math.max(0, Math.min(hoursCappedByActivity, spaceLeftInTheme));
        
        themeAccumulator[act.theme] += hoursEffectivelyCounted;
        const isCounted = hoursEffectivelyCounted > 0;
        const opacityClass = isCounted ? '' : 'opacity-60 grayscale-[0.5]';

        return `
            <div class="activity-card group ${opacityClass}" style="animation-delay: ${index * 0.05}s">
                <div class="activity-border-left" style="background: ${themeDef.color}"></div>
                <div class="mb-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg text-white leading-tight group-hover:text-[${themeDef.color}] transition-colors">${act.title}</h3>
                    </div>
                    <div class="flex flex-wrap gap-2 mt-3">
                        <span class="card-badge" style="background: ${themeDef.color}20; color: ${themeDef.color}; border: 1px solid ${themeDef.color}40">${themeDef.name}</span>
                        <span class="card-badge bg-white/5 text-gray-300 border border-white/10">${typeDef.emoji} ${typeDef.label}</span>
                    </div>
                </div>
                <div class="pt-4 border-t border-white/5 flex justify-between items-end">
                    <div>
                        <div class="text-xs text-secondary mb-1">Heures validées</div>
                        <div class="font-mono-data text-sm">
                            <span class="text-white font-bold">${act.hours}h</span> réelles 
                            <span class="text-secondary mx-1">→</span> 
                            <span style="color: ${isCounted ? themeDef.color : '#666'}">${hoursEffectivelyCounted}h comptées</span>
                        </div>
                        ${!isCounted ? '<div class="text-[10px] text-red-400 mt-1"><i class="fas fa-info-circle"></i> Plafond thème atteint</div>' : ''}
                    </div>
                    <div class="text-xs font-mono-data text-secondary opacity-70">${formatDate(act.date)}</div>
                </div>
            </div>
        `;
    }).join('');
    grid.innerHTML = cardsHTML;
}

/* ========================================================================
   5. TABLE SUMMARY (Tableau du bas et Barres de progression)
   ======================================================================== */
function renderTableSummary() {
    const tbody = document.getElementById('activity-table-body');
    const progContainer = document.getElementById('theme-progress-container');
    const totalDisp = document.getElementById('total-hours-display');
    
    const stats = {};
    let total = 0;
    DATA.themes.forEach(t => stats[t.id] = 0);

    // Render Table Rows & Calc Stats
    if(tbody) {
        tbody.innerHTML = DATA.activities.map(act => {
            const current = stats[act.theme] || 0;
            const added = Math.min(act.hours, 10 - current);
            if(stats[act.theme] !== undefined) stats[act.theme] += added;
            total += added;

            const themeDef = DATA.themes.find(t => t.id === act.theme);
            return `
                <tr class="transition duration-300 hover:bg-white/5">
                    <td class="font-mono text-secondary text-xs p-4 border-b border-white/5">${formatDate(act.date)}</td>
                    <td class="font-bold text-white p-4 border-b border-white/5">${act.title}</td>
                    <td class="p-4 border-b border-white/5"><span class="tech-badge" style="color:${themeDef.color}; border-color:${themeDef.color}">${themeDef.name}</span></td>
                    <td class="font-mono text-secondary p-4 border-b border-white/5">${act.hours}h</td>
                </tr>
            `;
        }).join('');
    }

    // Update Total Display
    if(totalDisp) totalDisp.innerText = total;

    // Render Progress Bars
    if(progContainer) {
        progContainer.innerHTML = DATA.themes.map(t => {
            const val = stats[t.id];
            const pct = (val / 10) * 100;
            return `
                <div>
                    <div class="flex justify-between mb-2 font-tech text-sm">
                        <span class="text-white">${t.name}</span>
                        <span class="text-accent">${val}/10h</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${t.color}; box-shadow: 0 0 10px ${t.color}"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Helpers
function formatDate(dateString) {
    if(!dateString) return '';
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}/${y}`;
}

window.setFilter = function(filterId) {
    currentFilter = filterId;
    renderFilters();
    renderActivities();
};

/* ========================================================================
   INITIALISATION GLOBALE
   ======================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Lancer les particules (Fond)
    if(canvas) {
        initParticles();
        animateParticles();
    }

    // 2. Lancer l'effet d'écriture
    typeEffect();

    // 3. Lancer le système d'explorateur (Filtres + Cartes + Tableau + Totaux)
    initExplorer();

    // 4. Lancer le Scroll Reveal (CRITIQUE POUR AFFICHER LE CONTENU)
    initScrollReveal();
});