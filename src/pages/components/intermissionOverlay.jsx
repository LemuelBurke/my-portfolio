import React from 'react'
import { motion } from 'framer-motion'
import '../../styles/intermission.css'
import intermissionImg from '../../assets/imgs/intermission screen.png'

const IntermissionOverlay = ({ onClose }) => {
  return (
    <div
      className="intermission-overlay"
      aria-label="Intermission"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault()
        if (onClose) onClose()
      }}
    >
      <motion.img
        src={intermissionImg}
        alt="Wii safety strap warning"
        className="intermission-image"
        draggable={false}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
    </div>
  )
}

export default IntermissionOverlay
