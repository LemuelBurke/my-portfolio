import carylHero from "../assets/imgs/projects/cainan/caryl-hero.webp";
import carylAbout from "../assets/imgs/projects/cainan/caryl-about.webp";
import carylGigs from "../assets/imgs/projects/cainan/caryl-gigs.webp";

const Cainan = ({ title }) => (
  <div>
    <h1>{title}</h1>
    <p className="badges-row">
      <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue" alt="Frontend: React and Vite" draggable={false} />
      <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green" alt="Backend: Node.js and Express" draggable={false} />
      <img src="https://img.shields.io/badge/Database-MySQL-orange" alt="Database: MySQL" draggable={false} />
      <img src="https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2A3550" alt="CI/CD: GitHub Actions" draggable={false} />
    </p>
    <p><strong>Live Site:</strong> <a href="https://cainan.studio" target="_blank" rel="noopener noreferrer">cainan.studio</a></p>
    <hr />
    <h2>Overview</h2>
    <p>
      <strong>Cainan</strong> is my freelance software studio, and <strong>cainan.studio</strong> is the platform I
      designed and built to run it. It's both the studio's shop window and a small full-stack product:
      a fast, search-friendly marketing site, a content system with its own admin dashboard, and an automated
      test-and-deploy pipeline, all built from scratch.
    </p>
    <p>
      Cainan is a Welsh family name with a deep history and heritage, and a name I want to live on through my work.
    </p>
    <hr />
    <h2>Key Features</h2>
    <ul>
      <li><strong>Service pages:</strong> websites, custom software and contract engineering, each with its own page and fixed-price approach.</li>
      <li><strong>Case studies:</strong> client work written up from a single data file, each with its own page.</li>
      <li><strong>Articles with an admin dashboard:</strong> a password-protected dashboard to write, edit and delete articles in Markdown. Publishing triggers a rebuild, so new articles go live as static pages.</li>
      <li><strong>Secure admin accounts:</strong> hashed passwords, token-based sessions in cookies, rate-limited login, and a full forgot/reset-password flow by email.</li>
      <li><strong>Contact form:</strong> enquiries are emailed straight to the studio from the server.</li>
      <li><strong>Privacy and analytics:</strong> cookie banner, privacy, cookie and terms pages, and analytics.</li>
    </ul>
    <hr />
    <h2>Built to be found</h2>
    <p>
      A studio site is only useful if people can find it, so search visibility was a core requirement rather than an
      afterthought:
    </p>
    <ul>
      <li><strong>Pre-rendered pages:</strong> a server-side rendering build renders every route to static HTML, so search engines and AI crawlers that don't run JavaScript still see real content and per-page metadata.</li>
      <li><strong>Self-maintaining sitemap:</strong> sitemap.xml is generated from the same route list as the pages, so it can never drift out of sync.</li>
      <li><strong>Structured data:</strong> organisation and article schema markup for richer search results.</li>
    </ul>
    <hr />
    <h2>Testing and Deployment</h2>
    <p>
      Every pull request and push to main runs through a <strong>GitHub Actions</strong> pipeline: it installs
      dependencies, runs the database migrations, then runs the backend test suite (<strong>Jest</strong> and
      <strong>Supertest</strong>) covering authentication, login rate limiting, password resets, the admin API and
      the contact form. Changes on main only deploy to the server over SSH once the tests pass.
    </p>
    <hr />
    <h2>Tech Stack</h2>
    <ul>
      <li><strong>Frontend:</strong> React, React Router, Vite, Tailwind CSS</li>
      <li><strong>Rendering:</strong> Vite SSR build with a pre-render script</li>
      <li><strong>Backend:</strong> Node.js, Express, Nodemailer</li>
      <li><strong>Data:</strong> MySQL with migration scripts; articles written in Markdown</li>
      <li><strong>Security:</strong> bcrypt password hashing, JWT sessions, express-rate-limit</li>
      <li><strong>Testing and CI/CD:</strong> Jest, Supertest, GitHub Actions</li>
    </ul>
    <hr />
    <h2>Client Work: Caryl Comedy</h2>
    <p>
      The studio's first case study, <a href="https://carylcomedy.com" target="_blank" rel="noopener noreferrer">carylcomedy.com</a>,
      is a site for Welsh stand-up comedian Caryl Burke. It works as a press pack for bookers and promoters, lists
      upcoming gigs, showcases video highlights and lets people get in touch directly.
    </p>
    <img src={carylHero} alt="Caryl Comedy homepage" draggable={false} />
    <ul>
      <li><strong>Built to invite bookings:</strong> every section is ordered around the promoter deciding whether to book her.</li>
      <li><strong>Bilingual from day one:</strong> Welsh and English treated as equally first-class.</li>
      <li><strong>Gig management dashboard:</strong> a password-protected admin and analytics dashboard so Caryl updates her own gig listings, with no developer needed.</li>
      <li><strong>Contact form:</strong> messages go straight to her own domain email.</li>
    </ul>
    <p><strong>Stack:</strong> React, Vite, Tailwind CSS, Node.js, SMTP</p>
    <h3>Application at a glance</h3>
    <img src={carylAbout} alt="Caryl Comedy about page" draggable={false} />
    <img src={carylGigs} alt="Caryl Comedy gig listings" draggable={false} />
  </div>
);

export default Cainan;
