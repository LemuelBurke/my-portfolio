import "../../styles/menuCard.css"

const MenuCard = ({ title, children, onClick }) => {
    return (
        <div className="wii-card" onClick={onClick}>
            <div className="wii-card-inner">
                {children}
            </div>

            {title && <div className="wii-card-title">{title}</div>}
        </div>
    )
}

export default MenuCard
