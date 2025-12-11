import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import "../../styles/menuCard.css"
import { useIsMobile } from "../../hooks/useIsMobile"

const MenuCard = ({ title, thumbnail, onClick }) => {
    const [showTooltip, setShowTooltip] = useState(false)
    const [tooltipStyle, setTooltipStyle] = useState({ left: 0, top: 0, width: 0 })
    const isMobile = useIsMobile()

    const updateTooltipPosition = (el) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const left = rect.left + window.pageXOffset + rect.width / 2
        const top = rect.bottom + window.pageYOffset
        const width = rect.width * 0.9
        setTooltipStyle({ left, top, width })
    }

    useEffect(() => {
        const cardEl = document.querySelector('[data-card-hover="true"]')
        if (!showTooltip || !cardEl) return
        const handler = () => updateTooltipPosition(cardEl)
        window.addEventListener('scroll', handler, true)
        window.addEventListener('resize', handler)
        handler()
        return () => {
            window.removeEventListener('scroll', handler, true)
            window.removeEventListener('resize', handler)
        }
    }, [showTooltip])

    const handleMouseEnter = (e) => {
        if (!title || isMobile) return // Don't show tooltips on mobile
        e.currentTarget.setAttribute('data-card-hover', 'true')
        updateTooltipPosition(e.currentTarget)
        setShowTooltip(true)
    }

    const handleMouseLeave = (e) => {
        if (isMobile) return // Don't handle tooltip events on mobile
        e.currentTarget.removeAttribute('data-card-hover')
        setShowTooltip(false)
    }

    return (
        <div 
            className="wii-card-wrap" 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div 
                className="wii-card" 
                onClick={onClick}
            >
                <div className="wii-card-inner">
                    {thumbnail && (
                        <img src={thumbnail} alt={title || ""} style={{ width: "120%" }} draggable={false} />
                    )}
                </div>
            </div>

            {showTooltip && title && typeof document !== 'undefined' && document.body && createPortal(
                <div className="wii-card-tooltip-fixed" style={{ left: tooltipStyle.left, top: tooltipStyle.top, width: tooltipStyle.width }}>
                    {title}
                </div>,
                document.body
            )}
        </div>
    )
}

export default MenuCard
