/*
  CONTENU DU PORTFOLIO
  ====================
  C'est le seul fichier à modifier pour faire vivre le site.
  Ajouter un projet, une certification, un événement ou une note de labo :
  copier un bloc existant, le coller en haut de sa liste, changer le texte.
  Pas besoin de toucher au HTML ni au CSS.

  Chemins : relatifs à index.html (ex. "img/photo.png", "Video/demo.mp4").
  Attention, GitHub Pages respecte les majuscules : "photo.JPG" et "photo.jpg"
  ne sont pas le même fichier.
*/

window.PORTFOLIO = {

  /* PARCOURS : du plus récent au plus ancien */
  experience: [
    {
      period: "Depuis 2026",
      title: "Master en architecture des systèmes informatiques",
      org: "Hénallux, Namur",
      text: "Master de 120 crédits, en codiplomation avec l’UNamur.",
      points: []
    },
    {
      period: "Février à mai 2026",
      title: "Security Analyst, stage",
      org: "Lhoist, Belgique",
      text: "Stage au sein de l’équipe sécurité d’un groupe industriel.",
      points: [
        "Pipeline de gestion des vulnérabilités entièrement automatisé : Defender for Endpoint, Azure Automation, PowerShell, SharePoint et Power BI.",
        "Playbooks de réponse à incident IT et OT : ransomware, automates et SCADA, mouvement latéral.",
        "Déploiement et suivi de l’antivirus sur les postes.",
        "Travail sur la convergence IT/OT et la sécurisation des systèmes industriels."
      ],
      link: { label: "Lire l’étude de cas", href: "#etude-de-cas" }
    },
    {
      period: "2023-2026",
      title: "Bachelier en Technologies de l’Informatique, réseaux et sécurité",
      org: "EPHEC, Bruxelles",
      text: "Labos réseau et sécurité : pfSense et VLAN, supervision LibreNMS et SNMP sur Proxmox, durcissement de switchs Cisco, montée en charge d’un cluster Docker Swarm testée avec Artillery.",
      points: []
    },
    {
      period: "2021-2023",
      title: "Sciences informatiques",
      org: "ULB, Bruxelles",
      text: "Deux ans de bases théoriques, avant de choisir une formation plus pratique.",
      points: []
    }
  ],

  /*
    PROJETS
    visual : "table" | "wave" | "cards" | "calendar" | "clock" (illustration dessinée en code)
    accent : "aqua" | "blue" | "lilac" | "coral" | "green" | "gold" (couleur de la carte)
    image  : chemin d'une capture pour remplacer l'illustration (optionnel)
    video  : { src, label } ouvre une vidéo dans la visionneuse (optionnel)
    links  : liens externes (optionnel)
  */
  projects: [
    {
      title: "ArtisanStack",
      year: "2025-2026",
      status: "En ligne",
      summary: "Un site de comparatifs de logiciels de gestion pour les artisans français et belges, financé par l’affiliation.",
      details: "Les pages sont générées à partir des données (SEO programmatique), avec balisage Schema.org, sitemap automatique et pages légales conformes au RGPD. Je l’ai conçu, développé et mis en ligne seul.",
      stack: ["Next.js", "TypeScript", "Tailwind CSS", "Vercel"],
      links: [{ label: "Voir le site", href: "https://www.artisanstack.pro" }],
      visual: "table",
      accent: "aqua"
    },
    {
      title: "Kit SaaS pour agents vocaux IA",
      year: "2025-2026",
      status: "Techniquement complet",
      summary: "Un starter kit pour lancer une agence ou un SaaS d’agents vocaux, vendu sous licence.",
      details: "Authentification, tableau de bord, création d’agents, historique et transcriptions des appels, paiement : tout est déjà branché. Côté sécurité, Row Level Security sur Supabase et vérification de signature sur chaque webhook. Livré avec environ 1 500 lignes de documentation.",
      stack: ["Next.js 15", "TypeScript", "Supabase", "Vapi.ai", "ElevenLabs", "Lemon Squeezy"],
      links: [],
      visual: "wave",
      accent: "lilac"
    },
    {
      title: "CyberDeck",
      year: "2026",
      status: "Appli perso",
      summary: "Une PWA pour apprendre chaque jour le vocabulaire anglais de la cybersécurité et de l’IT.",
      details: "Répétition espacée avec l’algorithme SM-2, paquets thématiques, XP, séries et badges pour tenir la cadence sur la durée.",
      stack: ["Next.js", "Tailwind CSS", "Supabase", "Framer Motion", "Vercel"],
      links: [],
      visual: "cards",
      accent: "blue"
    },
    {
      title: "Bloc Août",
      year: "2026",
      status: "Appli perso",
      summary: "Mon planning d’été sous forme de PWA, installée sur l’écran d’accueil de mon téléphone.",
      details: "Chaque séance envoie une notification à sa date. Je peux déplacer les séances directement depuis l’appli quand le programme change.",
      stack: ["PWA", "Notifications", "Vercel"],
      links: [],
      visual: "calendar",
      accent: "coral"
    },
    {
      title: "Hackathon Green IT",
      year: "2023",
      status: "EPHEC, 48 heures",
      summary: "Quarante-huit heures non-stop à cinq, sur le thème du numérique responsable.",
      details: "Un objet connecté piloté par une interface web. J’ai construit l’interface de l’application en binôme. On a fini bien classés.",
      stack: ["Front-end", "IoT", "Travail d’équipe"],
      links: [],
      video: { src: "Video/HackatonVideo.mp4", label: "Voir la vidéo" },
      visual: "clock",
      accent: "green"
    }
  ],

  /* Petite ligne sous les projets. Mettre [] pour la masquer. */
  experiments: [
    "Godot 4, avec un jeu en cours : Astro-Plouf! Les Bébés Étoiles",
    "Les bases d’Unity"
  ],

  /*
    COMPÉTENCES
    src : "stage" | "cours" | "projets" | "formation"
    Règle : n'ajouter que ce que je peux défendre en entretien.
  */
  skills: [
    {
      group: "Sécurité défensive",
      items: [
        { name: "Microsoft Defender for Endpoint", src: "stage" },
        { name: "Advanced Hunting API", src: "stage" },
        { name: "Gestion des vulnérabilités (TVM)", src: "stage" },
        { name: "Réponse à incident IT et OT", src: "stage" },
        { name: "Déploiement antivirus sur les postes", src: "stage" },
        { name: "Pare-feu pfSense", src: "cours" },
        { name: "Durcissement de switchs Cisco", src: "cours" },
        { name: "Fondamentaux de la cybersécurité", src: "formation" }
      ]
    },
    {
      group: "Cloud et automatisation",
      items: [
        { name: "Azure Automation (runbooks)", src: "stage" },
        { name: "PowerShell", src: "stage" },
        { name: "Power BI", src: "stage" },
        { name: "SharePoint", src: "stage" },
        { name: "Azure Functions, Static Web Apps", src: "projets" },
        { name: "Azure SQL, Blob Storage, Front Door", src: "projets" },
        { name: "Vercel", src: "projets" }
      ]
    },
    {
      group: "Réseaux et systèmes",
      items: [
        { name: "Cisco, VLAN et routage", src: "cours" },
        { name: "Supervision LibreNMS et SNMP", src: "cours" },
        { name: "Proxmox", src: "cours" },
        { name: "Docker et Docker Swarm", src: "cours" },
        { name: "Linux et Windows", src: "cours" },
        { name: "DNS, HTTP, HTTPS", src: "cours" }
      ]
    },
    {
      group: "Développement",
      items: [
        { name: "Python, Bash", src: "cours" },
        { name: "C, C++", src: "cours" },
        { name: "SQL", src: "cours" },
        { name: "Node.js, MongoDB", src: "cours" },
        { name: "JavaScript, TypeScript", src: "projets" },
        { name: "Next.js, React", src: "projets" },
        { name: "Supabase, PostgreSQL", src: "projets" },
        { name: "Git, GitHub", src: "projets" }
      ]
    }
  ],

  /* CERTIFICATIONS */
  certifications: {
    earned: [
      {
        title: "Introduction to Cybersecurity",
        issuer: "Cisco Networking Academy",
        year: "2026",
        text: "Premier cours du parcours Junior Cybersecurity Analyst : confidentialité des données, détection des menaces, vulnérabilités réseau, avec 7 labs pratiques.",
        proof: { src: "img/CyberIntro.png", label: "Voir le certificat" }
      }
    ],
    next: [
      {
        title: "SC-200",
        name: "Microsoft Security Operations Analyst",
        text: "La suite logique de mon stage sur Defender."
      },
      {
        title: "AZ-500",
        name: "Azure Security Engineer Associate",
        text: "Pour la partie Azure et automatisation."
      },
      {
        title: "TryHackMe, puis HackTheBox",
        name: "Entraînement pratique",
        text: "Pour muscler le côté offensif, qui me manque encore."
      }
    ]
  },

  /* SALONS, CONFÉRENCES, VISITES : du plus récent au plus ancien. photo optionnelle.
     Cybersec Europe : ajouter l’année. */
  events: [
    { year: "2026", title: "Salon SETT", place: "Namur", photo: "img/ConferenceNamur.jpeg" },
    { year: "", title: "Cybersec Europe", place: "Bruxelles" },
    { year: "2025", title: "Conférence Cloud with M365 and Azure Infrastructure, par Axentys", place: "", photo: "img/ConferenceCloudavecM365AzureInfrastructure.png" },
    { year: "2025", title: "Tech Career Night chez AXA", place: "Bruxelles", photo: "img/VisiteAxa.jpeg" },
    { year: "2025", title: "Visite des bureaux d’Odoo", place: "Corbais", photo: "img/VisiteEntrepriseOdooAvecEcole.png" },
    { year: "2023", title: "Odoo Experience", place: "Brussels Expo", photo: "img/OdooConference.PNG" }
  ],

  /*
    NOTES DE LABO (writeups TryHackMe, HackTheBox, retours de labo...)
    La section reste cachée tant que la liste est vide.
    Exemple à copier dans la liste :
    {
      date: "2026-10-12",
      title: "TryHackMe : Pre Security, ce que j’en retiens",
      tag: "TryHackMe",
      summary: "Deux phrases sur ce que j’ai appris.",
      href: "https://..."
    }
  */
  notes: []
};
