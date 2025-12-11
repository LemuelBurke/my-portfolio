import { useState, useEffect } from 'react'

/**
 * Custom hook to detect if the user is on a mobile device
 * Checks for touch capability and screen width
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Safety check - ensure we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return
    }

    const checkMobile = () => {
      try {
        // Check screen width first (simplest check)
        const isSmallScreen = window.innerWidth < 768
        
        // Check if device has touch capability
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        
        // Check user agent for mobile devices
        const userAgent = navigator.userAgent || navigator.vendor || ''
        const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
        
        // Consider it mobile if: small screen OR (touch enabled AND mobile user agent)
        const mobile = isSmallScreen || (hasTouchScreen && isMobileUserAgent)
        setIsMobile(mobile)
      } catch (error) {
        // If any error occurs, default to false (not mobile) to prevent blocking
        console.warn('Error detecting mobile device:', error)
        setIsMobile(false)
      }
    }

    // Check on mount with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(checkMobile, 0)

    // Update on resize
    window.addEventListener('resize', checkMobile)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return isMobile
}
