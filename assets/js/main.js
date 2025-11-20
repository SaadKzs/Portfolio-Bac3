/* ========================================================================
   INTERACTIVE PORTFOLIO CORE
   ======================================================================== */

// --- 1. DATA CONFIGURATION (TES INFOS) ---
const DATA = {
    activities: [
        { theme: 'network', title: 'Network Basics Project', date: '2024', hours: 15 },
        { theme: 'iot', title: 'Projet Boite-alerte (Team)', date: '2024', hours: 20 },
        { theme: 'security', title: 'Lhoist Security Stage', date: '2025', hours: 10 },
        { theme: 'web', title: 'Portfolio Dev', date: '2025', hours: 10 },
        { theme: 'soft', title: 'Gestion Projet IT', date: '2024', hours: 5 }
    ],
    themes: [
        { id: 'network', name: 'Réseaux' },
        { id: 'security', name: 'Cybersécurité' },
        { id: 'web', name: 'Web Dev' },
        { id: 'iot', name: 'IoT / Hardware' },
        { id: 'soft', name: 'Soft Skills' },
        { id: 'project', name: 'Gestion Projet' }
    ]
};

// --- 2. PARTICLE NETWORK ANIMATION (LE FOND INTERACTIF) ---
const canvas = document.getElementById('canvas-container');
const ctx = canvas.getContext('2d');
let particlesArray;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Gestion souris
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
        ctx.fillStyle = '#64ffda'; // Couleur des points
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;

        // Interaction souris (les points fuient un peu ou s'activent)
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
        let directionX = (Math.random() * 0.4) - 0.2; // Vitesse lente
        let directionY = (Math.random() * 0.4) - 0.2;
        let color = '#64ffda';

        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
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
                ctx.strokeStyle = 'rgba(100, 255, 218,' + opacityValue + ')'; // Lignes Cyan
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


// --- 3. TYPING EFFECT ---
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
            // Simple reset for infinite loop effect without backspace complexity for now
            index = 0;
            count++;
        }, 2000);
    }
    setTimeout(typeEffect, 100);
}

// --- 4. PORTFOLIO LOGIC ---
function renderPortfolio() {
    const stats = {};
    let total = 0;
    DATA.themes.forEach(t => stats[t.id] = 0);

    // Table Rows
    const tbody = document.getElementById('activity-table-body');
    if(tbody) {
        tbody.innerHTML = DATA.activities.map(act => {
            // Calc logic
            const current = stats[act.theme] || 0;
            const added = Math.min(act.hours, 10 - current); // Max 10h rule simplified
            if(stats[act.theme] !== undefined) stats[act.theme] += added;
            total += added;

            return `
                <tr class="transition duration-300">
                    <td class="font-mono text-accent text-xs">${act.date}</td>
                    <td class="font-bold text-white">${act.title}</td>
                    <td><span class="tech-badge">${DATA.themes.find(t=>t.id===act.theme)?.name}</span></td>
                    <td class="font-mono text-secondary">${act.hours}h</td>
                </tr>
            `;
        }).join('');
    }

    // Total Display
    const totalDisp = document.getElementById('total-hours-display');
    if(totalDisp) totalDisp.innerText = total;

    // Progress Bars
    const progContainer = document.getElementById('theme-progress-container');
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
                        <div class="progress-bar-fill" style="width: ${pct}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// --- 5. SCROLL REVEAL ---
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

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    animateParticles();
    typeEffect();
    renderPortfolio();
    initScrollReveal();
});