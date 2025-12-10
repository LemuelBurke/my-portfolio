import welcomeScreen from "../assets/imgs/wiiPage/warningWelcome.png";
import homePage from "../assets/imgs/wiiPage/HomePage.png";
import gameSelect from "../assets/imgs/wiiPage/GameSelect.png";
import aboutMeMii from "../assets/imgs/wiiPage/AboutMeMii.png";
import projectPage from "../assets/imgs/wiiPage/ProjectPage.png";
import pauseScreen from "../assets/imgs/wiiPage/PauseScreen.png";
import contactForm from "../assets/imgs/wiiPage/ContactForm.png";

const WiiPortfolio = ({ title, thumb }) => (
  <div>
    <h1>{title}</h1>
    <p className="badges-row">
      <img src="https://img.shields.io/badge/Framework-React-blue" alt="React" draggable={false} />
      <img src="https://img.shields.io/badge/Build%20Tool-Vite-purple" alt="Vite" draggable={false} />
      <img src="https://img.shields.io/badge/Animation-Framer%20Motion-pink" alt="Framer Motion" draggable={false} />
      <img src="https://img.shields.io/badge/License-Personal-green" alt="License" draggable={false} />
    </p>
    <p><strong>Live Site:</strong> <a href="https://morganburke.dev" target="_blank" rel="noopener noreferrer">morganburke.dev</a></p>
    <hr />
    <h2>Overview</h2>
    <p>
      A nostalgic, interactive portfolio website inspired by the Nintendo Wii menu system. Navigate through my projects, experience, and information using a fully recreated Wii interface complete with authentic sounds, animations, and transitions.
    </p>
    <hr />
    <h2>Features</h2>
    
    <h3>Main Menu (Wii Channel Menu)</h3>
    <ul>
      <li><strong>Authentic Wii Menu Recreation:</strong> Navigate through channels just like the original Wii console</li>
      <li><strong>Multi-page Grid Layout:</strong> Browse through multiple pages of channel cards</li>
      <li><strong>Interactive Menu Cards:</strong> Hover effects and smooth animations</li>
      <li><strong>Real-time Clock & Date:</strong> Live updating time and date display in the footer</li>
      <li><strong>Custom Cursor:</strong> Wii-style pointer cursor throughout the experience</li>
      <li><strong>Background Music:</strong> Looping Wii menu music with startup sound sequence</li>
    </ul>

    <h3>Channels</h3>
    <h4>About Me (Mii Channel Style)</h4>
    <ul>
      <li><strong>Mii Channel Interface:</strong> Recreated Mii Channel experience</li>
      <li><strong>Interactive Navigation:</strong> Browse through different sections: About Me, Work Experience, Skills, Tools, Education, Hobbies</li>
      <li><strong>Rich Media Content:</strong> Photos, polaroids, and visual storytelling</li>
      <li><strong>Mii Channel Music:</strong> Authentic background audio</li>
    </ul>

    <h4>My Projects (Wii Sports Resort Style)</h4>
    <ul>
      <li><strong>Wii Sports Resort Theme:</strong> Beautiful resort-style interface</li>
      <li><strong>Project Gallery:</strong> Grid layout showcasing portfolio projects</li>
      <li><strong>Filter System:</strong> Filter projects by tags (personal, academic, etc.)</li>
      <li><strong>Project Details Panel:</strong> Slide-out panel with detailed project information</li>
      <li><strong>Featured Projects:</strong> NFL Superfan mobile app, Wii Themed Portfolio Site (this project!)</li>
      <li><strong>Background Music:</strong> Wii Sports Resort soundtrack</li>
    </ul>

    <h4>Resume and CV</h4>
    <ul>
      <li><strong>PDF Viewer:</strong> View and download resume/CV</li>
      <li><strong>Professional Presentation:</strong> Clean, accessible format</li>
    </ul>

    <h4>External Links</h4>
    <ul>
      <li><strong>LinkedIn Integration:</strong> Direct link to LinkedIn profile</li>
      <li><strong>GitHub Integration:</strong> Direct link to GitHub repositories</li>
    </ul>

    <h3>Interactive Features</h3>
    <ul>
      <li><strong>Welcome Screen:</strong> Wii startup warning screen with animation</li>
      <li><strong>Intermission Overlays:</strong> Transition screens between channels (like loading screens)</li>
      <li><strong>Pause Menu:</strong> Right-click anywhere to open pause overlay (press Escape to close)</li>
      <li><strong>Contact Form:</strong> Email integration via EmailJS</li>
      <li><strong>Smooth Animations:</strong> Framer Motion powered transitions throughout</li>
      <li><strong>Audio Feedback:</strong> Click sounds and contextual music for each section</li>
      <li><strong>Responsive Design:</strong> Optimized for desktop and tablet experiences</li>
    </ul>

    <hr />
    <h2>Tech Stack</h2>
    <ul>
      <li><strong>React 19.2.1</strong> - UI framework</li>
      <li><strong>Vite 5.0.0</strong> - Build tool and dev server</li>
      <li><strong>Framer Motion 12.23.25</strong> - Animation library</li>
      <li><strong>React Router DOM 7.10.1</strong> - Client-side routing</li>
      <li><strong>EmailJS</strong> - Contact form email service</li>
      <li><strong>CSS3</strong> - Custom styling with Wii-inspired design</li>
    </ul>

    <hr />
    <h2>Usage</h2>
    
    <h3>Navigation</h3>
    <ul>
      <li><strong>Click</strong> on channel cards to open them</li>
      <li><strong>Right-click</strong> anywhere to open the pause menu</li>
      <li><strong>Press Escape</strong> to close the pause menu</li>
      <li>Use <strong>arrow buttons</strong> to navigate between menu pages</li>
      <li>Click the <strong>Exit</strong> button or press <strong>B</strong> (in some sections) to return to the main menu</li>
    </ul>

    <h3>Channels</h3>
    <ul>
      <li><strong>About Me:</strong> Click through different sections using the navigation buttons</li>
      <li><strong>My Projects:</strong> Click on project cards to view details, use filters to narrow down projects</li>
      <li><strong>Resume and CV:</strong> View and download the PDF</li>
      <li><strong>LinkedIn/GitHub:</strong> Opens in a new tab</li>
    </ul>

    <h3>Contact</h3>
    <ul>
      <li>Click the <strong>email icon</strong> in the footer to open the contact form</li>
      <li>Fill out the form and submit to send an email</li>
    </ul>

    <hr />
    <h2>Application at a glance</h2>
    <h3>Welcome Screen</h3>
    <p>When users first visit the site, they are greeted with a nostalgic Wii startup warning screen that sets the tone for the entire experience.</p>
    <img src={welcomeScreen} alt="Welcome Screen" draggable={false} />
    <h3>Main Menu</h3>
    <p>The main Wii channel menu displays all available channels in a grid layout, complete with authentic styling, hover effects, and background music.</p>
    <img src={homePage} alt="Main Menu" draggable={false} />
    <h3>Game Select Screen</h3>
    <p>Clicking on a channel card opens a full-screen preview with the channel's title and image, allowing users to start the channel or navigate to adjacent channels.</p>
    <img src={gameSelect} alt="Game Select Screen" draggable={false} />
    <h3>About Me Channel</h3>
    <p>The About Me section recreates the Mii Channel experience, allowing users to navigate through different sections including work experience, skills, education, and hobbies.</p>
    <img src={aboutMeMii} alt="About Me Channel" draggable={false} />
    <h3>Projects Page</h3>
    <p>The projects gallery features a Wii Sports Resort-themed interface with a filterable grid of project cards and a slide-out detail panel.</p>
    <img src={projectPage} alt="Projects Page" draggable={false} />
    <h3>Pause Menu</h3>
    <p>Right-clicking anywhere on the site opens a pause overlay menu, allowing users to return to the main menu or adjust settings.</p>
    <img src={pauseScreen} alt="Pause Menu" draggable={false} />
    <h3>Contact Form</h3>
    <p>Users can reach out through the integrated contact form, which uses EmailJS to send messages directly from the website.</p>
    <img src={contactForm} alt="Contact Form" draggable={false} />

    <hr />
    <h2>Key Features in Detail</h2>
    
    <h3>Audio System</h3>
    <ul>
      <li><strong>Startup Sound:</strong> Plays when the site first loads</li>
      <li><strong>Menu Music:</strong> Loops continuously on the main menu</li>
      <li><strong>Contextual Music:</strong> Different tracks for different sections (Mii Channel, Wii Sports Resort)</li>
      <li><strong>Click Sounds:</strong> Audio feedback for user interactions</li>
      <li><strong>Smart Audio Management:</strong> Music pauses when navigating to channels, resumes when returning</li>
    </ul>

    <h3>Animation System</h3>
    <ul>
      <li><strong>Page Transitions:</strong> Smooth fade and slide animations</li>
      <li><strong>Card Animations:</strong> Staggered entrance animations for menu cards</li>
      <li><strong>Hover Effects:</strong> Scale and glow effects on interactive elements</li>
      <li><strong>Intermission Screens:</strong> Loading-style transitions between major sections</li>
    </ul>

    <h3>Responsive Design</h3>
    <ul>
      <li><strong>Desktop Optimized:</strong> Best experience on desktop/tablet</li>
      <li><strong>Touch Support:</strong> Works with touch devices</li>
      <li><strong>Adaptive Layout:</strong> Adjusts to different screen sizes</li>
    </ul>

    <hr />
    <h2>Future Enhancements</h2>
    <ul>
      <li>Additional project showcases</li>
      <li>Further Styling to match the Wii System</li>
      <li>Interactive mini-games or experiences</li>
      <li>Blog section</li>
      <li>Dark/light mode toggle</li>
      <li>Accessibility improvements</li>
      <li>Performance optimizations</li>
      <li>User Settings</li>
    </ul>

    <hr />
    <h2>Copyright, Trademark and General Notice</h2>
    <p>
      This portfolio is a personal project created for showcasing my work and skills. The Wii theme is used for nostalgic and creative purposes, paying homage to a beloved gaming console. In no way is the site endorsed, acknowledge or in collaboration with Nintendo. All rights remain with their respective owners.
    </p>
    <p>
      The <strong>Nintendo Wii</strong> console, its interface design, and associated trademarks are the property of <strong>Nintendo Co., Ltd.</strong> This project is not affiliated with, endorsed by, or associated with Nintendo in any way.
    </p>
    <p>
      All rights to Nintendo's intellectual property, including but not limited to the Wii console design, menu interface, sounds, and visual elements, remain with Nintendo. Their use in this project is for <strong>educational and non-commercial purposes only</strong>.
    </p>
    <p>
      &copy; 2025 Morgan Burke. All rights reserved where applicable.
      This project is free to view and use for <strong>educational purposes only</strong>. Commercial use and distribution without credit is <strong>strictly prohibited</strong>.
    </p>
  </div>
);

export default WiiPortfolio;

