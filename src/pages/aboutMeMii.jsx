import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import "../styles/aboutMeMii.css"
import nameTitleImg from "../assets/imgs/aboutMePage/nameTitle.png"
import abtmeImg from "../assets/imgs/aboutMePage/abtme.png"
import abtmeSelectedImg from "../assets/imgs/aboutMePage/abtmeSelected.png"
import workExpImg from "../assets/imgs/aboutMePage/wrkExp.png"
import workExpSelectedImg from "../assets/imgs/aboutMePage/wrkExpSelected.png"
import skillsImg from "../assets/imgs/aboutMePage/skill.png"
import skillsSelectedImg from "../assets/imgs/aboutMePage/skillSelected.png"
import toolsImg from "../assets/imgs/aboutMePage/tool.png"
import toolsSelectedImg from "../assets/imgs/aboutMePage/toolSelected.png"
import eduImg from "../assets/imgs/aboutMePage/edu.png"
import eduSelectedImg from "../assets/imgs/aboutMePage/eduSelected.png"
import hobImg from "../assets/imgs/aboutMePage/hob.png"
import hobSelectedImg from "../assets/imgs/aboutMePage/hobSelected.png"
import miiChannelMusic from "../assets/audio/mii-channel-music.mp3"
import mePolaroids from "../assets/imgs/aboutMePage/MePolaroids.png"
import pol1 from "../assets/imgs/aboutMePage/pol1.png"
import pol2 from "../assets/imgs/aboutMePage/pol2.png"
import pol3 from "../assets/imgs/aboutMePage/pol3.png"
import meIBMSign from "../assets/imgs/aboutMePage/meIBMSign.png"
import meSpeakingIBM from "../assets/imgs/aboutMePage/me Speaking.png"
import IBMStudentPanel from "../assets/imgs/aboutMePage/IBMStudentTeamPhoto.png"
import jap1 from "../assets/imgs/aboutMePage/japan1.png"
import jap2 from "../assets/imgs/aboutMePage/japan2.png"
import jap3 from "../assets/imgs/aboutMePage/japan3.png"
import team1 from "../assets/imgs/aboutMePage/team1.png"
import team2 from "../assets/imgs/aboutMePage/team2.png"
import team3 from "../assets/imgs/aboutMePage/team3.png"
import team4 from "../assets/imgs/aboutMePage/team4.png"
import team5 from "../assets/imgs/aboutMePage/team5.png"
import CARPol from "../assets/imgs/aboutMePage/CARPol.png"
import miiman from "../assets/imgs/aboutMePage/miiman.gif"

const contentByKey = {
    abtme: (
        <>
            <h2>About Me</h2>

            <p>
                Hi there! I'm Morgan, a BSc Applied Software Engineering student at Cardiff University in South Wales.
                I'm set to graduate in July 2026, currently on track for a First-Class Honours degree.
            </p>

            <p>
                I've been studying computing since I was 13, starting my studies in Comprehensive School, and have since gained a genuine passion for
                software development, web interfaces, and all things "tech".
            </p>

            <div className="mii-polaroids">
                <img src={pol1} alt="Polaroid 1" className="mii-polaroid tilt-right" draggable={false} />
                <img src={pol2} alt="Polaroid 2" className="mii-polaroid tilt-left" draggable={false} />
                <img src={pol3} alt="Polaroid 3" className="mii-polaroid tilt-right" draggable={false} />
            </div>

            <p>
                Recently, I've developed a strong interest in Autonomous Systems and AI,
                particularly autonomous vehicles. I've been exploring this new fascination through extracurricular
                work as Team Principal of Cardiff Autonomous Racing, which I founded two years ago.
                (More about that in the Work Experience section!)
                
            </p>
            <div className="mii-polaroids">
                <img src={CARPol} alt="CAR Polaroid" className="mii-polaroid tilt-right mii-car-polaroid" draggable={false} />
            </div>

            <p>
                Looking to the future, I really want to spend a few years gaining industry experience
                and build funds, I then plan to go on to explore the world as a digital nomad (working remotely,
                travelling, and building software along the way!)
                Having already visited the United States, Czech Republic and Japan independantly, I can't wait to see more of the world!
            </p>

            <p>
                I highly encourage you to check out the rest of this Mii creator inspired section to learn more about me -
                by clicking the menu icons at the top of this page -
                as well as further explore the rest of my portfolio site!
            </p>
        </>
    ),

  work: (
      <>

          <h2>Work Experience</h2>

          <h3>Invited Guest Speaker - IBM TechXChange 2025, Florida, U.S.A</h3>
          <p><em>Oct 2025</em></p>
          <p>
              Presented a Tech Talk on the development of Cardiff Autonomous Racing's autonomous system, at IBM TechXChange 2025 in Florida, with 8,000+ attendees from all across the technical sector,
              I displayed our system, how our team operates and how we integrate IBM technologies in our everyday work flow.
              <div className="mii-inline-carousel" aria-label="IBM photos carousel">
                <div className="mii-inline-track">
                  <img src={meIBMSign} alt="Me at IBM TechXChange 2025" className="mii-inline-img" draggable={false} />
                  <img src={meSpeakingIBM} alt="Me speaking at IBM TechXChange 2025" className="mii-inline-img" draggable={false} />
                  <img src={IBMStudentPanel} alt="IBM Student Speakers at TechXChange 2025" className="mii-inline-img" draggable={false} />
                  {/* duplicate for seamless infinite scroll */}
                  <img src={meIBMSign} alt="Me at IBM TechXChange 2025" className="mii-inline-img" draggable={false} />
                  <img src={meSpeakingIBM} alt="Me speaking at IBM TechXChange 2025" className="mii-inline-img" draggable={false} />
                  <img src={IBMStudentPanel} alt="IBM Student Speakers at TechXChange 2025" className="mii-inline-img" draggable={false} />
                </div>
              </div>
          </p>

          <h3>Team Principal - Cardiff Autonomous Racing</h3>
          <p><em>Jul 2024 - Present</em></p>

          <p>
              I founded and currently lead Cardiff Autonomous Racing, an autonomous systems
              team competing in international student motorsport. In this role I've built
              partnerships with organisations including IBM, secured sponsorship funding,
              and guided a multidisciplinary group of students through the design,
              development, and integration of an autonomous racing platform.
          </p>
          <p>
              Every year we attend IMechE's Formula Student competition, where we compete against other student teams at Silverstone Race circuit, home of the Formula 1 British Grand Prix.
          </p>
          <p>
              Alongside technical contributions, I'm responsible for team coordination,
              planning, logistics, outreach, and representing the team at events. More
              recently I've focused on long-term sustainability by mentoring successors and
              establishing processes to support the project beyond my graduation.
          </p>

          <div className="mii-inline-carousel" aria-label="IBM photos carousel">
              <div className="mii-inline-track">
                  <img src={team1} alt="" className="mii-inline-img" draggable={false} />
                  <img src={team2} alt="" className="mii-inline-img" draggable={false} />
                  <img src={team3} alt="" className="mii-inline-img" draggable={false} />
                  <img src={team4} alt="" className="mii-inline-img" draggable={false} />
                  <img src={team5} alt="" className="mii-inline-img" draggable={false} />
                  {/* duplicate for seamless infinite scroll */}
                  <img src={team1} alt="" className="mii-inline-img" draggable={false} />
                  <img src={team2} alt="" className="mii-inline-img" draggable={false} />
                  <img src={team3} alt="" className="mii-inline-img" draggable={false} />
                  <img src={team4} alt="" className="mii-inline-img" draggable={false} />
                  <img src={team5} alt="" className="mii-inline-img" draggable={false} />
              </div>
          </div>


          <h3>Customer Delivery Driver - Tesco</h3>
          <p><em>May 2024 - Present</em></p>
          <p>
              Part-time delivery role involving customer interaction and
              responsibility for vehicle operation and customer service.
          </p>


          <h3>Volunteer - Yoichi Eco Village, Hokkaido, Japan</h3>
          <p><em>Aug 2024 - Sep 2024</em></p>

          <p>
              I spent two months volunteering in Japan, working on sustainable farming and
              eco-technology initiatives. I learned about environmentally responsible
              agriculture, supported renewable energy projects, and participated in
              cultural exchange within the local community.
          </p>

          <p>
              This experience deepened my interest in sustainable technology and global
              collaboration, an area I hope to explore further throughout my career. This was genuninely one of the most rewarding experiences of my life!
          </p>

          <div className="mii-inline-carousel" aria-label="IBM photos carousel">
              <div className="mii-inline-track">
                  <img src={jap1} alt="Me at IBM TechXChange 2025" className="mii-inline-img" draggable={false} />
                  <img src={jap2} alt="Me speaking at IBM TechXChange 2025" className="mii-inline-img" draggable={false} />
                  <img src={jap3} alt="IBM Student Speakers at TechXChange 2025" className="mii-inline-img" draggable={false} />
                  {/* duplicate for seamless infinite scroll */}
                  <img src={jap1} alt="Sapporo City" className="mii-inline-img" draggable={false} />
                  <img src={jap2} alt="Creating a vegetable bed" className="mii-inline-img" draggable={false} />
                  <img src={jap3} alt="Winery" className="mii-inline-img" draggable={false} />
              </div>
          </div>


          <h3>Test Administrator - NOVOMATIC Gaming UK</h3>
          <p><em>Jun 2023 - Aug 2024 (multiple contracts)</em></p>

          <p>
              Worked across two summer placements supporting software and hardware test
              operations within a regulated gaming environment. Responsibilities included
              manual and system testing, defect reporting, and data-driven evaluation of
              gaming products.
          </p>


          <h3>Sales Assistant - Home Bargains</h3>
          <p><em>Aug 2021 - Mar 2023</em></p>

          <p>
              Early retail experience providing customer service, operating tills, and
              ensuring smooth store operation. This role helped develop confidence working
              with customers and working effectively within a team.
          </p>

      </>

  ),
  skills: (
      <>
          <h2>Skills</h2>

          <h3>Technical</h3>
          <ul>
              <li>Autonomous Systems</li>
              <li>Software Development</li>
              <li>Manual & System Testing</li>
              <li>Data Analysis</li>
              <li>Robotics & AI Concepts</li>
              <li>Autonomous Vehicle Technology</li>
          </ul>

          <h3>Professional</h3>
          <ul>
              <li>Team Leadership</li>
              <li>Project Coordination</li>
              <li>Sponsorship & Partnerships</li>
              <li>Public Speaking & Representation</li>
              <li>Stakeholder Communication</li>
              <li>Event & Competition Planning</li>
          </ul>

          <h3>Personal</h3>
          <ul>
              <li>Adaptability</li>
              <li>Customer Service</li>
              <li>Cultural awareness</li>
              <li>Remote collaboration</li>
          </ul>
      </>

  ),
  tools: (
      <>
          <h2>Skills</h2>

          <h3>Programming & Development</h3>
          <ul>
              <li>JavaScript</li>
              <li>Java</li>
              <li>Python</li>
              <li>HTML5 / CSS3</li>
          </ul>

          <h3>Frameworks & Libraries</h3>
          <ul>
              <li>React</li>
              <li>Vite</li>
              <li>Spring Boot</li>
          </ul>

          <h3>Databases & Backend</h3>
          <ul>
              <li>MongoDB</li>
              <li>MySQL</li>
              <li>MariaDB</li>
          </ul>
          <h3>DevOps & Cloud</h3>
          <ul>
              <li>CI/CD Pipelines (Git, Jenkins)</li>
              <li>Infrastructure-as-Code (Terraform)</li>
          </ul>
          <h3>Autonomous & Technical</h3>
          <ul>
              <li>Autonomous Systems</li>
              <li>Robotics & AI concepts</li>
              <li>Manual & System Testing</li>
              <li>Data Analysis</li>
          </ul>

          <h3>Professional & Interpersonal</h3>
          <ul>
              <li>Team Leadership</li>
              <li>Project Coordination</li>
              <li>Sponsorship & Partnerships</li>
              <li>Public Speaking</li>
              <li>Communication</li>
          </ul>

          <h3> Hobby Level Skills </h3>
          <ul>
              <li>Digital Art (Affinity Design, Photoshop)</li>
              <li>Limited 3D Modelling (Blender)</li>
              <li>Video Editing (Premiere Pro, After Effects, DaVinci Resolve)</li>
          </ul>

          <p> And much more on the way! </p>
      </>

  ),
  edu: (
      <>
          <h2>Education</h2>

          <h3>Cardiff University / Prifysgol Caerdydd</h3>
          <p><em>BSc Applied Software Engineering (2023 - 2026)</em></p>
          <p>
              Currently studying Applied Software Engineering with a focus on modern
              software development practices, web-based app development, and practical industry
              projects. Developing skills in Java, Python, JavaScript, web development and
              software engineering methodologies while working on collaborative,
              real-world applications in teams.
          </p>

          <p>In my third year, I took an additional module in Foundational Japanese Language.</p>

          <h3>Bryntirion Comprehensive School</h3>
          <p><em>A-Levels (2021 - 2023)</em></p>
          <p>
              Awarded 3 B's in; Welsh Baccalaureate, Histroy and Computer Science, building early foundations in
              programming and software development.
          </p>

          <h3>Bryntirion Comprehensive School</h3>
          <p><em>GCSEs (2016 - 2021)</em></p>
          <p>
              Achieved GCSE qualifications A*-C including Computing and core subjects, forming
              the initial foundation of my interest in technology and programming.
          </p>
      </>

  ),
  hob: (
      <>
          <h2>Hobbies</h2>

          <p>
              Outside of software and tech, which can become very overwhelming! <br/> I'm a big fan of creative and
              technical hobbies. I love video editing and playing video games, and I'm
              into tabletop gaming, with Warhammer 40,000 and Star Wars: Legion being the
              current favourites.
          </p>

          <p>
              I'm really active outdoors, I love Hiking, trail walking, travelling, riding my motorcycle
              (probably a bit too much), and surfing whenever I get the chance, which isn't very often living in South Wales!
          </p>
          <p>In my first and second years of University, I played American Football as a Linebacker in the Cardiff Cobras, before an injury took me off the field (would've gone pro by now if it wasn't for that I reckon (I was never a starter on the field))
              , and before that I grew up playing rugby. I love both sports as a spectator and participant, being a massive supporter of the Minnesota Vikings in the NFL and the Welsh National Rugby team.
          </p>

          <p>
              Overall, I enjoy hobbies that mix strategy, creativity, or even a little bit of
              adrenaline - whether that's going from my 9-5 laptop to my 5-9 laptop to play video games or pracitce my creative skills, a surfboard, riding my motorbike or going on a lengthy hike.
          </p>
      </>

  ),
}

const AboutMeMii = ({ onExit }) => {
  const [selected, setSelected] = useState("abtme") // default selected on load
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef(null)
  const rightPanelRef = useRef(null)

  useEffect(() => {
    const music = new Audio(miiChannelMusic)
    music.loop = true
    music.volume = 0.35
    audioRef.current = music
    music.play().catch(() => {})
    return () => {
      try { music.pause(); music.currentTime = 0 } catch (_) {}
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = isMuted
  }, [isMuted])

  // When tab changes, force the right panel scroll to top
  useEffect(() => {
    const el = rightPanelRef.current
    if (!el) return
    // instant jump to top
    el.scrollTop = 0
    // some browsers prefer scrollTo; behavior 'instant' is non-standard, fallback to auto
    try { el.scrollTo({ top: 0, behavior: 'auto' }) } catch (_) {}
  }, [selected])

  const toggleMute = () => {
    setIsMuted((m) => !m)
  }

  const icon = (key, normal, selectedImg, label, i) => (
    <motion.div
      className="mii-item"
      onClick={() => setSelected(key)}
      role="button"
      aria-label={label}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 + i * 0.06 }}
    >
      <img
        className="mii-item-img"
        src={selected === key ? selectedImg : normal}
        alt={label}
        draggable={false}
      />
      <div className="mii-tooltip">{label}</div>
    </motion.div>
  )

  return (
    <motion.div className="mii-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
      <motion.div className="mii-header-row" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
        <img className="mii-logo mii-logo-inline" src={nameTitleImg} alt="Name Title" draggable={false} />
        <motion.header className="mii-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
          <motion.div
            className="mii-header-inner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <nav className="mii-header-items">
              {icon("abtme", abtmeImg, abtmeSelectedImg, "About Me", 0)}
              {icon("work", workExpImg, workExpSelectedImg, "Work Experience", 1)}
              {icon("skills", skillsImg, skillsSelectedImg, "Skills", 2)}
              {icon("tools", toolsImg, toolsSelectedImg, "Tools", 3)}
              {icon("edu", eduImg, eduSelectedImg, "Education", 4)}
              {icon("hob", hobImg, hobSelectedImg, "Hobbies", 5)}
            </nav>
          </motion.div>
        </motion.header>
      </motion.div>

      <div className="mii-top-controls">
        <img className="mii-logo mii-logo-mobile" src={nameTitleImg} alt="Name Title" draggable={false} />
      </div>

      <main className="mii-content">
        <motion.div
          className="mii-content-layout"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
        >
          <motion.section
            className="mii-panel mii-panel-left"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
          >
                      <div className="mii-gif-placeholder"><img src={miiman} draggable="false" /></div>
            <motion.button
              className="mii-exit-btn"
              onClick={onExit}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              Exit
            </motion.button>
            <motion.button
              className="mii-audio-toggle"
              onClick={toggleMute}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? "Unmute" : "Mute"}
            </motion.button>
          </motion.section>
          <motion.section
            className="mii-panel mii-panel-right"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            ref={rightPanelRef}
          >
            <motion.div className="mii-section-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              {contentByKey[selected]}
            </motion.div>
          </motion.section>
        </motion.div>
      </main>
    </motion.div>
  )
}

export default AboutMeMii
