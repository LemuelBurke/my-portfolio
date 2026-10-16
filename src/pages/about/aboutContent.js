// Content for the About Me (Mii Maker) channel. Each tab is a category; each tile is an option
// is shown as an entry: `photos[0]` (or `thumb`) beside the text, otherwise a tile with `icon`
// (or the `thumbFit: "contain"` logo). `polaroid` photos are shown whole, never cropped.
import pol1 from "../../assets/imgs/aboutMePage/pol1.png"
import pol2 from "../../assets/imgs/aboutMePage/pol2.png"
import pol3 from "../../assets/imgs/aboutMePage/pol3.png"
import carPol from "../../assets/imgs/aboutMePage/CARPol.png"
import travel1 from "../../assets/imgs/aboutMePage/travel1.png"
import travel2 from "../../assets/imgs/aboutMePage/travel2.png"
import travel3 from "../../assets/imgs/aboutMePage/travel3.png"
import meIBMSign from "../../assets/imgs/aboutMePage/meIBMSign.png"
import meSpeakingIBM from "../../assets/imgs/aboutMePage/me speaking.png"
import ibmStudentPanel from "../../assets/imgs/aboutMePage/IBMStudentTeamPhoto.webp"
import jap1 from "../../assets/imgs/aboutMePage/japan1.webp"
import jap2 from "../../assets/imgs/aboutMePage/japan2.webp"
import jap3 from "../../assets/imgs/aboutMePage/japan3.webp"
import team1 from "../../assets/imgs/aboutMePage/team1.png"
import team2 from "../../assets/imgs/aboutMePage/team2.webp"
import team3 from "../../assets/imgs/aboutMePage/team3.webp"
import team4 from "../../assets/imgs/aboutMePage/team4.webp"
import team5 from "../../assets/imgs/aboutMePage/team5.webp"
import cainanLogo from "../../assets/imgs/projects/cainan/cainan-logo.png"

// The fun fields on the Mii data card. Favourite colour matches the Mii's shirt, as on the Wii.
export const PROFILE_FIELDS = [
    { label: "From", value: "South Wales" },
    { label: "Lives in", value: "Brisbane, Australia" },
    { label: "Studied", value: "BSc Software Eng. (First)" },
    { label: "Fav colour", value: "Purple", swatch: "#7b3fbf" },
    { label: "Likes", value: "Motorcycles, surfing, Warhammer" },
]

export const TABS = [
    {
        id: "about",
        label: "About",
        icon: "person",
        tiles: [
            {
                id: "hello",
                polaroid: true, // already framed with a caption: show whole, never crop
                label: "Hello!",
                thumb: pol1,
                title: "Hi there, I'm Morgan!",
                text: [
                    "I'm a software engineer and a First Class Honours graduate in BSc Applied Software Engineering from Cardiff University in South Wales, now based in Brisbane, Australia.",
                    "I've been studying computing since I was 13, starting my studies in Comprehensive School, and have since gained a genuine passion for software development, web interfaces, and all things \"tech\".",
                ],
                photos: [pol1, pol2, pol3],
            },
            {
                id: "autonomous",
                polaroid: true, // already framed with a caption: show whole, never crop
                label: "Autonomous racing",
                thumb: carPol,
                title: "Autonomous systems & AI",
                text: [
                    "I've developed a strong interest in Autonomous Systems and AI, particularly autonomous vehicles. I explored this fascination through extracurricular work as Team Principal of Cardiff Autonomous Racing, which I founded in 2024. (More about that in the Work tab!)",
                ],
                photos: [carPol],
            },
            {
                id: "future",
                polaroid: true, // already framed with a caption: show whole, never crop
                label: "Travel & the future",
                thumb: travel1,
                title: "Looking to the future",
                text: [
                    "I really want to spend a few years gaining industry experience and building funds, then go on to explore the world as a digital nomad (working remotely, travelling, and building software along the way!)",
                    "Having already visited the United States, Czech Republic and Japan independently, and now living in Australia, I can't wait to see more of the world!",
                ],
                photos: [travel1, travel2, travel3],
            },
        ],
    },
    {
        id: "work",
        label: "Work",
        icon: "briefcase",
        tiles: [
            {
                id: "cainan",
                label: "Cainan",
                thumb: cainanLogo,
                thumbFit: "contain",
                title: "Freelance Software Engineer · Cainan",
                meta: "Jul 2026 – Present",
                text: [
                    "I founded Cainan, my own freelance software development studio, taking on website development, software solutions and contract software engineering work.",
                    "So far I've designed, developed and deployed carylcomedy.com, cainan.studio and gwib.co.uk.",
                ],
            },
            {
                id: "ibm",
                label: "IBM TechXChange",
                thumb: meIBMSign,
                title: "Invited Guest Speaker · IBM TechXChange 2025",
                meta: "Oct 2025 · Florida, USA",
                text: [
                    "Presented a Tech Talk on the development of Cardiff Autonomous Racing's autonomous system at IBM TechXChange 2025 in Florida, with 8,000+ attendees from all across the technical sector. I showed our system, how our team operates and how we integrate IBM technologies into our everyday workflow.",
                ],
                photos: [meIBMSign, meSpeakingIBM, ibmStudentPanel],
            },
            {
                id: "car",
                label: "Autonomous Racing",
                thumb: team1,
                title: "Team Principal · Cardiff Autonomous Racing",
                meta: "Sep 2024 – Jul 2026",
                text: [
                    "I founded and led Cardiff Autonomous Racing, an autonomous systems team competing in international student motorsport. In this role I built partnerships with organisations including IBM, secured sponsorship funding, and guided a multidisciplinary group of students through the design, development and integration of an autonomous racing platform.",
                    "We competed at IMechE's Formula Student competition against other student teams at Silverstone, home of the Formula 1 British Grand Prix.",
                    "Alongside technical contributions, I was responsible for team coordination, planning, logistics, outreach, and representing the team at events. In my final year I focused on long-term sustainability by mentoring successors and establishing processes to support the project beyond my graduation.",
                ],
                photos: [team1, team2, team3, team4, team5],
            },
            {
                id: "tesco",
                label: "Tesco",
                icon: "van",
                title: "Customer Delivery Driver · Tesco",
                meta: "May 2024 – Present",
                text: ["Part-time delivery role involving customer interaction and responsibility for vehicle operation and customer service."],
            },
            {
                id: "yoichi",
                label: "Volunteering in Japan",
                thumb: jap1,
                title: "Volunteer · Yoichi Eco Village, Hokkaido, Japan",
                meta: "Aug – Sep 2024",
                text: [
                    "I spent two months volunteering in Japan, working on sustainable farming and eco-technology initiatives. I learned about environmentally responsible agriculture, supported renewable energy projects, and took part in cultural exchange within the local community.",
                    "This experience deepened my interest in sustainable technology and global collaboration, an area I hope to explore further throughout my career. It was genuinely one of the most rewarding experiences of my life!",
                ],
                photos: [jap1, jap2, jap3],
            },
            {
                id: "novomatic",
                label: "NOVOMATIC",
                icon: "bug",
                title: "Test Administrator · NOVOMATIC Gaming UK",
                meta: "Jul – Sep 2023, Jun – Aug 2024 (contract)",
                text: [
                    "Worked across two summer placements supporting software and hardware test operations within a regulated gaming environment. Responsibilities included manual and system testing, defect reporting, and data-driven evaluation of gaming products.",
                ],
            },
            {
                id: "home-bargains",
                label: "Home Bargains",
                icon: "bag",
                title: "Sales Assistant · Home Bargains",
                meta: "Aug 2021 – Mar 2023",
                text: [
                    "Early retail experience providing customer service, operating tills, and ensuring smooth store operation. This role helped develop confidence working with customers and working effectively within a team.",
                ],
            },
        ],
    },
    {
        id: "skills",
        label: "Skills",
        icon: "star",
        tiles: [
            {
                id: "technical",
                label: "Technical",
                icon: "chip",
                title: "Technical skills",
                chips: ["Full-stack web development", "Autonomous Systems", "Software Development", "Manual & System Testing", "Data Analysis", "Robotics & AI Concepts", "Autonomous Vehicle Technology"],
            },
            {
                id: "professional",
                label: "Professional",
                icon: "people",
                title: "Professional skills",
                chips: ["Team Leadership", "Project Coordination", "Sponsorship & Partnerships", "Public Speaking & Representation", "Stakeholder Communication", "Event & Competition Planning"],
            },
            {
                id: "personal",
                label: "Personal",
                icon: "heart",
                title: "Personal skills",
                chips: ["Adaptability", "Customer Service", "Cultural awareness", "Remote collaboration"],
            },
        ],
    },
    {
        id: "tools",
        label: "Tools",
        icon: "wrench",
        tiles: [
            { id: "languages", label: "Languages", icon: "code", title: "Programming & development", chips: ["TypeScript", "JavaScript", "Python", "Java", "Kotlin", "C++", "HTML5 / CSS3"] },
            { id: "frameworks", label: "Frameworks", icon: "layers", title: "Frameworks & libraries", chips: ["React", "Node.js", "Express.js", "Vite", "Spring Boot"] },
            { id: "databases", label: "Databases", icon: "database", title: "Databases & backend", chips: ["MongoDB", "MySQL", "MariaDB", "SQL"] },
            {
                id: "devops",
                label: "DevOps & cloud",
                icon: "cloud",
                title: "DevOps & cloud",
                chips: ["Git, GitHub & GitLab", "CI/CD pipelines (Jenkins, GitHub Actions)", "Docker", "Linux", "Infrastructure-as-Code (Terraform)", "Microsoft Azure & Entra ID"],
            },
            { id: "testing", label: "Testing", icon: "bug", title: "Testing", chips: ["Jest", "JUnit", "Test plans", "Manual & system testing"] },
            {
                id: "hobby-tools",
                label: "Hobby level",
                icon: "brush",
                title: "Hobby level skills",
                chips: ["Digital Art (Affinity Designer, Photoshop)", "3D Modelling (Blender, limited)", "Video Editing (Premiere Pro, After Effects, DaVinci Resolve)"],
                text: ["And much more on the way!"],
            },
        ],
    },
    {
        id: "education",
        label: "Education",
        icon: "cap",
        tiles: [
            {
                id: "cardiff",
                label: "Cardiff University",
                icon: "cap",
                title: "Cardiff University / Prifysgol Caerdydd",
                meta: "BSc Applied Software Engineering (2023 – 2026) · First Class Honours",
                text: [
                    "Studied Applied Software Engineering with a focus on modern software development practices, web-based app development and practical industry projects, developing skills in Java, Python, JavaScript, web development and software engineering methodologies while working on collaborative, real-world applications in teams.",
                    "In my third year, I took an additional module in Foundational Japanese Language.",
                ],
            },
            {
                id: "a-levels",
                label: "A-Levels",
                icon: "book",
                title: "Bryntirion Comprehensive School",
                meta: "A-Levels (2021 – 2023)",
                text: ["Awarded 3 B's in Welsh Baccalaureate, History and Computer Science, building early foundations in programming and software development."],
            },
            {
                id: "gcses",
                label: "GCSEs",
                icon: "pencil",
                title: "Bryntirion Comprehensive School",
                meta: "GCSEs (2016 – 2021)",
                text: ["Achieved GCSE qualifications A*–C including Computing and core subjects, forming the initial foundation of my interest in technology and programming."],
            },
        ],
    },
    {
        id: "hobbies",
        label: "Hobbies",
        icon: "gamepad",
        tiles: [
            {
                id: "gaming",
                label: "Gaming & tabletop",
                icon: "gamepad",
                title: "Gaming & tabletop",
                text: [
                    "Outside of software and tech, which can become very overwhelming, I'm a big fan of creative and technical hobbies. I love playing video games, and I'm into tabletop gaming, with Warhammer 40,000 and Star Wars: Legion being the current favourites.",
                ],
            },
            {
                id: "outdoors",
                label: "Outdoors",
                icon: "mountain",
                title: "Getting outdoors",
                text: [
                    "I'm really active outdoors. I love hiking, trail walking, travelling, riding my motorcycle (probably a bit too much), and surfing whenever I get the chance, which wasn't very often living in South Wales!",
                ],
            },
            {
                id: "sport",
                label: "Football & rugby",
                icon: "ball",
                title: "American Football & rugby",
                text: [
                    "In my first and second years of University, I played American Football as a Linebacker for the Cardiff Cobras, before an injury took me off the field (would've gone pro by now if it wasn't for that I reckon... I was never a starter), and before that I grew up playing rugby.",
                    "I love both sports as a spectator and participant, being a massive supporter of the Minnesota Vikings in the NFL and the Welsh National Rugby team.",
                ],
            },
            {
                id: "creative",
                label: "Creative",
                icon: "brush",
                title: "Creative hobbies",
                text: [
                    "I love video editing and practising my creative skills, from digital art to a bit of 3D modelling.",
                    "Overall, I enjoy hobbies that mix strategy, creativity, or even a little bit of adrenaline, whether that's going from my 9-5 laptop to my 5-9 laptop to play video games, a surfboard, my motorcycle or a lengthy hike.",
                ],
            },
        ],
    },
]
