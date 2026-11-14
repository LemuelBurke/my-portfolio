import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.jsx'

// Clickjacking guard: GitHub Pages can't send X-Frame-Options / frame-ancestors headers,
// so refuse to render inside someone else's frame and try to break out of it.
const framed = (() => {
  try {
    return window.top !== window.self
  } catch {
    return true
  }
})()

if (framed) {
  try {
    window.top.location.replace(window.location.href)
  } catch {
    // cross-origin sandboxed frame: just stay blank
  }
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
