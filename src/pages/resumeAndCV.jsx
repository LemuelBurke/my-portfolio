import React, { useState, useEffect, useRef } from "react"
import "../styles/resumeAndCV.css"
import wiiShopMusic from "../assets/audio/wiiShopMusic.mp3"
import cvPdf from "../assets/Morgan Burke CV_compressed.pdf"
import ContactMe from "./components/contactMe"
import resumeTitle from "../assets/imgs/resumeandcv/title.png"

const ResumeAndCV = ({ onExit }) => {
  const [docType, setDocType] = useState("cv")
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef(null)
  const objectRef = useRef(null)

  useEffect(() => {
    const music = new Audio(wiiShopMusic)
    music.loop = true
    music.volume = 0.35
    audioRef.current = music
    music.play().catch(() => {})
    return () => {
      try { music.pause(); music.currentTime = 0 } catch (_) {}
    }
  }, [])

  // Reset loading when switching docs
  useEffect(() => {
    setIsLoading(docType === "cv")
  }, [docType])

  // Listen for PDF load event
  useEffect(() => {
    const obj = objectRef.current
    if (!obj) return

    const handleLoaded = () => setIsLoading(false)
    const handleError = () => setIsLoading(false)

    // Some browsers fire 'load' on <object>
    obj.addEventListener('load', handleLoaded)
    obj.addEventListener('error', handleError)

    // Safety timeout fallback in case events don't fire
    const timeoutId = setTimeout(() => setIsLoading(false), 1500)

    return () => {
      obj.removeEventListener('load', handleLoaded)
      obj.removeEventListener('error', handleError)
      clearTimeout(timeoutId)
    }
  }, [docType])

  const handleSave = () => {
    const url = docType === "cv" ? cvPdf : null
    if (!url) return
    const a = document.createElement("a")
    a.href = url
    a.download = docType === "cv" ? "Morgan Burke CV.pdf" : "document.pdf"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const openContact = () => setIsContactOpen(true)
  const closeContact = () => setIsContactOpen(false)

  return (
    <div className="resume-page">
      <div className="resume-header" role="banner">
        <img className="resume-title" src={resumeTitle} alt="Resume and CV" />
      </div>

      <div className="resume-layout">
        <aside className="resume-sidebar">
          <button
            className={`resume-side-btn ${docType === "cv" ? "active" : ""}`}
            onClick={() => setDocType("cv")}
            aria-label="View CV"
          >
            CV
          </button>
          <button
            className={`resume-side-btn ${docType === "resume" ? "active" : ""}`}
            onClick={() => setDocType("resume")}
            aria-label="View Resume"
          >
            Resume
          </button>
          <button className="resume-side-btn exit" onClick={onExit} aria-label="Exit" style={{background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '1.1rem', borderRadius: '12px', border: 'none', padding: '0.7rem 2.2rem', boxShadow: '0 2px 8px rgba(239,68,68,0.12)'}}>
            Exit
          </button>
        </aside>

        <main className="resume-content">
          <div id="pdf-container" className="pdf-container" aria-label="Document viewer">
            {docType === "cv" ? (
              <>
                {isLoading && (
                  <div className="pdf-placeholder"><p>Loading...</p></div>
                )}
                <object
                  ref={objectRef}
                  data={`${cvPdf}#toolbar=0&navpanes=0`}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  style={{ display: isLoading ? 'none' : 'block' }}
                >
                  <div className="pdf-placeholder">
                    <p>Unable to display PDF. <a href={cvPdf} target="_blank" rel="noreferrer">Open in new tab</a>.</p>
                  </div>
                </object>
              </>
            ) : (
              <div className="pdf-placeholder">
                <p>Resume coming soon...</p>
              </div>
            )}
          </div>

          <div className="resume-actions right-rail">
            <button className="resume-action-btn save" onClick={handleSave}>Save</button>
            <button className="resume-action-btn contact" onClick={openContact}>Contact Me</button>
          </div>
        </main>
      </div>

      <ContactMe isOpen={isContactOpen} onClose={closeContact} />
    </div>
  )
}

export default ResumeAndCV
