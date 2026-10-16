// Morgan's CV as data for the CV channel. Keep in step with src/assets/Morgan Burke CV.pdf.

export const PROFILE = {
    name: "Morgan Burke",
    headline: "Full-stack Software Engineer",
    highlights: ["First Class BSc Software Engineering, Cardiff University", "Based in Brisbane, Australia"],
    summary:
        "Recent graduate with First Class Honours in Software Engineering from Cardiff University, now based in Brisbane on a Working Holiday visa (eligible for two further years without the 88 days of specified work). A full-stack web developer working mainly in React, TypeScript, Node.js and Python, with experience building AI-driven web applications and leading a 30+ member autonomous racing team sponsored by IBM. Looking for a full-time or contract role with meaningful engineering work, experienced teams to learn from and room to keep growing as an engineer.",
    links: [
        { label: "morganburke.dev", href: "https://morganburke.dev" },
        { label: "GitHub", href: "https://github.com/LemuelBurke?tab=repositories" },
        { label: "LinkedIn", href: "https://www.linkedin.com/in/morgan--burke/" },
    ],
}

// kind sets the colour-coded stamp: "work", "achievement" or "volunteering";
// short is the big label on the front of the envelope
export const EXPERIENCE = [
    {
        kind: "work",
        title: "Freelance Software Engineer",
        org: "Cainan",
        when: "Jul 2026 – Present",
        short: "2026",
        points: [
            "Founded Cainan, my freelance software development company.",
            "Website development, software solutions and contract software engineering work.",
        ],
        links: [
            { label: "carylcomedy.com", href: "https://carylcomedy.com" },
            { label: "cainan.studio", href: "https://cainan.studio" },
            { label: "gwib.co.uk", href: "https://gwib.co.uk" },
        ],
    },
    {
        kind: "achievement",
        title: "Invited Guest Speaker",
        org: "IBM TechXChange 2025",
        when: "Oct 2025 · Orlando, Florida",
        short: "Oct 2025",
        points: [
            "Invited to speak at IBM TechXChange 2025, an event with 8,000+ attendees.",
            "Presented the work of Cardiff Autonomous Racing, our progress with support from IBM and other industry partners, and how the team develops students' technical and professional skills.",
        ],
    },
    {
        kind: "achievement",
        title: "Team Principal & Founder",
        org: "Cardiff Autonomous Racing",
        when: "Sep 2024 – Jul 2026",
        short: "2024 – 26",
        points: [
            "Founded and led a 30+ student team within Cardiff University's School of Computer Science and Informatics.",
            "Secured funding and partnerships with major industry sponsors, including IBM, Delaware UK&I and BIOS IT.",
            "Directed project planning, budgeting and technical development of an autonomous racing system.",
            "Mentored team members and fostered interdisciplinary communication across the team.",
            "Featured in articles by IBM, Cardiff University and Delaware UK.",
        ],
    },
    {
        kind: "work",
        title: "Customer Delivery Driver",
        org: "Tesco DotCom",
        when: "May 2024 – Present",
        short: "2024",
        points: [],
    },
    {
        kind: "volunteering",
        title: "Volunteer",
        org: "Yoichi Eco Village, Hokkaido",
        when: "Aug – Sep 2024 · Japan",
        short: "Aug 2024",
        points: [
            "Supported a community-led environmental and sustainability project.",
            "Worked with an international team, building cross-cultural communication skills and taking part in cultural exchange.",
            "Took on hands-on farm work, showing adaptability and initiative in a new environment.",
        ],
    },
    {
        kind: "work",
        title: "Test Administrator",
        org: "Novomatic Gaming UK",
        when: "Jul – Sep 2023 & Jun – Aug 2024 · Contract",
        short: "2023 – 24",
        points: [
            "Carried out extensive manual software testing and quality assurance on gaming systems for the gambling industry.",
            "Documented and reported test results, ensuring compliance with internal standards.",
            "Worked with developers to identify and troubleshoot system issues.",
        ],
    },
]

export const PROJECTS = [
    {
        title: "AI Triaging System",
        role: "Software Engineering dissertation",
        short: "Dissertation",
        tech: ["React", "TypeScript", "Python", "Node.js", "Express.js", "MongoDB", "Vite", "Jest", "JWT", "spaCy NER"],
        points: [
            "Full-stack web app with integrated microservices that triages patients to specialist clinicians from free-text symptom descriptions.",
            "Built a Python FastAPI microservice and an orchestrator layer to process user input.",
            "Designed, trained and implemented a bespoke Named Entity Recognition model with a normalisation pipeline to extract symptoms from free text.",
            "Implemented role-based access and session management with Microsoft Azure, MSAL and Entra ID, plus a validated patient intake form.",
        ],
    },
    {
        title: "Cardiff Autonomous Racing System",
        role: "Team Principal",
        short: "Self-driving",
        tech: ["Python", "C++", "YOLOv8", "Docker"],
        points: [
            "Led development of an autonomous racing software stack integrating perception, planning and control.",
            "Led computer vision pipelines using YOLOv8 to detect cones and draw bounding boxes in real time.",
            "Worked with industry sponsors including IBM and Delaware UK, presenting technical progress at IBM TechXChange 2025.",
        ],
    },
    {
        title: "NFL Fan Android App",
        role: "Independent project",
        short: "Android",
        tech: ["Kotlin", "Android Studio", "REST APIs"],
        points: [
            "Native Android app with NFL statistics, team data and player stats from a public API.",
            "Intuitive UI with data caching and custom theming, following MVVM with ViewModels for maintainable, testable code.",
        ],
    },
    {
        title: "Wii Portfolio Site",
        role: "Independent project (this site!)",
        short: "Web",
        tech: ["HTML", "CSS", "JavaScript", "QuickTime", "GitHub Pages"],
        points: [
            "Personal portfolio inspired by the Nintendo Wii interface, with interactive menus, transitions and embedded media.",
            "Built to be fun and intuitive while staying responsive and accessible.",
        ],
    },
]

export const SKILLS = [
    { group: "Languages", items: ["TypeScript", "JavaScript", "Python", "HTML", "CSS", "C++", "Kotlin"] },
    { group: "Frameworks", items: ["React", "Node.js", "Express.js", "Spring"] },
    { group: "DevOps & tools", items: ["Git", "GitHub", "GitLab", "Docker", "Linux", "Jenkins", "CI/CD", "GitHub Actions"] },
    { group: "Testing", items: ["JUnit", "Jest", "Test plans"] },
    { group: "Databases", items: ["MySQL", "MariaDB", "MongoDB", "SQL"] },
    { group: "Concepts", items: ["REST APIs", "OOP", "Agile", "Waterfall", "Code reviews", "Pair programming"] },
]

export const EDUCATION = [
    {
        title: "BSc Applied Software Engineering",
        org: "Cardiff University",
        when: "2023 – 2026",
        short: "First Class",
        points: ["First Class Honours.", "School of Computer Science and Informatics.", "Additional module: Beginners Japanese (A1)."],
    },
    {
        title: "A-Levels",
        org: "Bryntirion Comprehensive School, Bridgend",
        when: "2016 – 2023",
        short: "2023",
        points: ["Computer Science B, History B, Welsh Baccalaureate B."],
    },
]

// Sticky memos for the "More about me" section
export const MEMOS = [
    { id: "languages", title: "Languages", color: "#c9f0ff", items: ["English (native)", "Welsh (beginner)", "Japanese (beginner)"] },
    {
        id: "interests",
        title: "Interests",
        color: "#ffd6e8",
        items: ["American Football", "Rugby Union", "Video games", "Tabletop gaming", "Surfing", "Motorcycles", "Medieval & modern history", "Alternative music"],
    },
    { id: "societies", title: "Societies", color: "#fff4a8", items: ["Cardiff University American Football", "Alternative Music Society"] },
    { id: "about", title: "Good to know", color: "#d8f5cf", items: ["British & Irish citizen", "Full UK driving licence (clean)", "Working Holiday visa, Australia"] },
]
