import silverstoneTeam from "../assets/imgs/aboutMePage/team1.png";
import carPolaroid from "../assets/imgs/aboutMePage/CARPol.png";
import teamCoding from "../assets/imgs/aboutMePage/team2.webp";
import teamReview from "../assets/imgs/aboutMePage/team3.webp";
import teamWorking from "../assets/imgs/aboutMePage/team4.webp";
import teamGarage from "../assets/imgs/aboutMePage/team5.webp";

const CardiffAutonomousRacing = () => (
  <div>
    <h1>Cardiff Autonomous Racing</h1>
    <p className="badges-row">
      <img src="https://img.shields.io/badge/Role-Founder%20%26%20Team%20Principal-black" alt="Role: Founder and Team Principal" draggable={false} />
      <img src="https://img.shields.io/badge/Team-~20%20core%20members-darkred" alt="Team: around 20 core members" draggable={false} />
      <img src="https://img.shields.io/badge/Delivery-Agile%20sprints-blue" alt="Delivery: Agile sprints" draggable={false} />
      <img src="https://img.shields.io/badge/Competition-Formula%20Student%20AI-red" alt="Competition: Formula Student AI" draggable={false} />
    </p>
    <p><em>Jul 2024 - Present · Founder &amp; Team Principal</em></p>
    <img src={silverstoneTeam} alt="The Cardiff Autonomous Racing team with the ADS-DV at Silverstone" draggable={false} />
    <hr />
    <h2>Overview</h2>
    <p>
      <strong>Cardiff Autonomous Racing</strong> is a team I started from nothing, and as <strong>Team Principal</strong>
      my job is to make it work: setting the direction, building and organising the team, managing the budget and
      sponsors, and getting an autonomous race car to IMechE's <strong>Formula Student AI</strong> at Silverstone on time.
    </p>
    <p>
      In the Dynamic Driving Task class, teams are given the ADS-DV, a vehicle supplied "autonomous systems ready",
      and must design and integrate their own system to drive it. Delivering that with a team of around 20 students,
      alongside their degrees, against fixed competition deadlines, is above all a project management challenge.
    </p>
    <hr />
    <h2>Key Outcomes</h2>
    <ul>
      <li><strong>Founded and funded:</strong> pitched the project to the School of Computer Science and secured funding to start the team.</li>
      <li><strong>Built the team:</strong> recruited around 30 members, with roughly 20 becoming dedicated core members.</li>
      <li><strong>Two Formula Student UK campaigns:</strong> competed at Silverstone in both 2025 and 2026.</li>
      <li><strong>Passed static inspection in 2026:</strong> our control systems interfaced directly with the car.</li>
      <li><strong>Industry partnership:</strong> secured sponsorship from IBM, which led to an invitation to speak at IBM TechXChange 2025.</li>
    </ul>
    <hr />
    <h2>Leading the Team</h2>
    <h3>Team structure</h3>
    <p>
      I organised the team into sub-teams for perception, path planning, control and risk assessment, each with
      its own lead. That let work run in parallel with clear ownership, while I coordinated across the sub-teams
      and kept the overall system integrated.
    </p>
    <h3>Planning and delivery</h3>
    <p>
      We worked in Agile sprints with tracked tasks, planned backwards from competition dates. This kept a
      part-time student team moving, surfaced blockers early and made progress visible to everyone.
    </p>
    <h3>Budget and sponsorship</h3>
    <p>
      I own the budget, write sponsorship proposals and manage sponsor relationships, including our partnership
      with IBM, which brought sponsorship funding along with access to IBM Granite and IBM SkillsBuild.
    </p>
    <h3>Stakeholders</h3>
    <p>
      I'm the team's point of contact with the university, sponsors and the competition organisers, and I lead
      the business plan and design presentations judged at the static events.
    </p>
    <h3>Recruitment and training</h3>
    <p>
      I recruited the team and ran onboarding and training, so new members could start contributing quickly.
    </p>
    <h3>Planning for succession</h3>
    <p>
      With graduation approaching, I've focused on the team outliving me: mentoring successors and putting
      processes in place so it keeps competing after I leave.
    </p>
    <img src={teamWorking} alt="Team members working on the autonomous system" draggable={false} />
    <hr />
    <h2>The Competition</h2>
    <p>Formula Student AI judges teams on both engineering and the business behind it:</p>
    <ul>
      <li><strong>Static events:</strong> design and business plan presentations, defending the system's design and its commercial case to judges.</li>
      <li><strong>Inspection:</strong> the car and the team's autonomous system must pass scrutineering before they're allowed on track.</li>
      <li><strong>Dynamic events:</strong> autonomous missions including acceleration, skid pad and track drive.</li>
    </ul>
    <hr />
    <h2>Technical Involvement</h2>
    <p>
      Alongside running the team, I stayed hands-on in perception, working with a <strong>ZED 2 stereo camera</strong>
      to detect the cones that mark out the track. Understanding the system first-hand made it easier to plan
      the work, spot integration risks and make technical calls across sub-teams.
    </p>
    <hr />
    <h2>Timeline</h2>
    <ul>
      <li><strong>Jul 2024:</strong> founded the team and secured funding</li>
      <li><strong>2025:</strong> first Formula Student UK at Silverstone, competing in the static events and learning the competition first-hand</li>
      <li><strong>Oct 2025:</strong> invited guest speaker at IBM TechXChange 2025, Orlando</li>
      <li><strong>2026:</strong> second Formula Student UK, passing static inspection with our control systems interfacing directly with the car</li>
    </ul>
    <hr />
    <h2>Project at a glance</h2>
    <h3>Formula Student 2025</h3>
    <img src={carPolaroid} alt="Polaroid of the team at Formula Student 2025" draggable={false} />
    <h3>In the garage</h3>
    <img src={teamGarage} alt="The team in the garage at the Formula Student competition" draggable={false} />
    <h3>Development</h3>
    <img src={teamCoding} alt="Team members developing the autonomous software" draggable={false} />
    <img src={teamReview} alt="Team members reviewing code together" draggable={false} />
  </div>
);

export default CardiffAutonomousRacing;
