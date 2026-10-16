import React from 'react'
import { motion } from 'framer-motion'
import '../../styles/pauseOverlay.css'
import darkenImg from '../../assets/imgs/pauseOverlay/darken.png'
import footerImg from '../../assets/imgs/pauseOverlay/footer.png'
import headerImg from '../../assets/imgs/pauseOverlay/header.png'

const PauseOverlay = ({ onClose, onWiiMenu }) => {
  const goHome = (e) => {
    e.stopPropagation()
    // If parent provided a handler, call it to navigate within the app without reload
    if (typeof onWiiMenu === 'function') {
      onWiiMenu()
      return
    }
    // Fallback: navigate to root (may reload)
    window.location.href = '/'
  }

  const doRestart = (e) => {
    e.stopPropagation()
    window.location.reload()
  }

  const controlsVariants = {
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0 } },
    hidden: { transition: { staggerChildren: 0.06, staggerDirection: -1 } }
  }

  const buttonVariants = {
    visible: { y: 0, opacity: 1, scale: 1 },
    hidden: { y: 20, opacity: 0, scale: 0.95 }
  }

  return (
    <div
      className="pause-overlay"
      onClick={onClose}
      onContextMenu={(e) => { e.preventDefault(); if (onClose) onClose() }}
      aria-label="Pause"
    >
      <motion.img
        src={darkenImg}
        alt="Darken background"
        className="pause-overlay-darken"
        draggable={false}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />
      <motion.img
        src={headerImg}
        alt="Pause header"
        className="pause-overlay-header"
        draggable={false}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />

      {/* Buttons centered above footer */}
      <motion.div
        className="pause-overlay-controls"
        onClick={(e) => e.stopPropagation()}
        variants={controlsVariants}
        initial="visible"
        animate="visible"
        exit="hidden"
      >
        <motion.button
          className="pause-btn wii-btn"
          onClick={goHome}
          variants={buttonVariants}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          whileHover={{ translateY: -4 }}
          whileTap={{ translateY: 0 }}
        >
          Wii Menu
        </motion.button>

        <motion.button
          className="pause-btn wii-btn"
          onClick={doRestart}
          variants={buttonVariants}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          whileHover={{ translateY: -4 }}
          whileTap={{ translateY: 0 }}
        >
          Restart
        </motion.button>
      </motion.div>

      {/* Flashing tip */}
      <div className="pause-tip">Click anywhere to unpause</div>

      <motion.img
        src={footerImg}
        alt="Pause footer"
        className="pause-overlay-footer"
        draggable={false}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
    </div>
  )
}

export default PauseOverlay
