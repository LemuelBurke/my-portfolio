import meSpeaking from "../assets/imgs/aboutMePage/me speaking.png";
import ibmSign from "../assets/imgs/aboutMePage/meIBMSign.png";
import studentPanel from "../assets/imgs/aboutMePage/IBMStudentTeamPhoto.webp";

const IbmTechXchange = () => (
  <div>
    <h1>IBM TechXChange 2025</h1>
    <p className="badges-row">
      <img src="https://img.shields.io/badge/Role-Invited%20Guest%20Speaker-1f70c1" alt="Role: Invited guest speaker" draggable={false} />
      <img src="https://img.shields.io/badge/Attendees-8%2C000%2B-black" alt="Attendees: 8,000+" draggable={false} />
      <img src="https://img.shields.io/badge/Location-Orlando%2C%20FL-blue" alt="Location: Orlando, Florida" draggable={false} />
    </p>
    <p><em>October 6-9, 2025 · Orlando, Florida</em></p>
    <img src={meSpeaking} alt="Morgan presenting Cardiff Autonomous Racing on stage at IBM TechXChange 2025" draggable={false} />
    <hr />
    <h2>Overview</h2>
    <p>
      I was invited by IBM to speak at <strong>IBM TechXChange 2025</strong>, IBM's flagship technology conference,
      with more than <strong>8,000 attendees</strong>. I presented the story of Cardiff Autonomous Racing, the
      student team I founded and lead as Team Principal, to an audience of engineers, developers and industry
      professionals.
    </p>
    <hr />
    <h2>The Talk</h2>
    <h3>Autonomous vehicles in the United Kingdom</h3>
    <p>
      I opened with the bigger picture: where autonomous vehicles stand in the UK, how the landscape is changing,
      and why it matters to have a pipeline of engineers who've built these systems for real.
    </p>
    <h3>The work we're doing</h3>
    <p>
      Then I covered Cardiff Autonomous Racing itself: building a team from scratch to compete in IMechE's
      Formula Student AI at Silverstone, where we design and integrate our own autonomous system to drive the
      ADS-DV race car, and what it takes to run a student team of around 20 people to deliver it.
    </p>
    <h3>How IBM got involved</h3>
    <p>
      Finally, I talked about our partnership with IBM and the difference it made to the team:
    </p>
    <ul>
      <li><strong>Sponsorship:</strong> funding that helped the team compete.</li>
      <li><strong>IBM Granite:</strong> used across the project, from development support to competition logistics, expense estimates and preparing business and funding presentations.</li>
      <li><strong>IBM SkillsBuild:</strong> free learning that helped team members build skills and get up to speed.</li>
    </ul>
    <blockquote>
      "It's almost like an advisory role. It doesn't replace us as engineers, but it points out something
      we've done wrong or gives us a suggestion, which is really valuable."
    </blockquote>
    <hr />
    <h2>At the event</h2>
    <img src={ibmSign} alt="Morgan at IBM TechXChange 2025" draggable={false} />
    <img src={studentPanel} alt="Morgan with other students at IBM TechXChange 2025" draggable={false} />
    <hr />
    <p>
      Read more:{" "}
      <a href="https://skillsbuild.org/spotlights/morgan-burke" target="_blank" rel="noopener noreferrer">
        IBM SkillsBuild spotlight - Meet Morgan Burke
      </a>
    </p>
  </div>
);

export default IbmTechXchange;
