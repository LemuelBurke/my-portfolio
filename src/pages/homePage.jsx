import { motion } from "framer-motion"
import "../styles/homePage.css"
import MenuCard from "./components/menuCard"
import Img from "../assets/imgs/placeholderCardImg.png"

const HomePage = () => {
    return (
        <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="menu-viewport">
                <div className="menu-grid">

                    {/* ---------- PAGE 1 (12 cards) ---------- */}
                    <div className="menu-page">
                        {[...Array(12)].map((_, i) => (
                            <MenuCard key={i} title="" onClick={() => console.log("Clicked!")}>
                                <img src={Img} style={{ width: "120%" }} />
                            </MenuCard>
                        ))}
                    </div>

                    {/* ---------- PAGE 2 (remaining card(s)) ---------- */}
                    <div className="menu-page">
                        <MenuCard title="" onClick={() => console.log("Clicked!")}>
                            <img src={Img} style={{ width: "120%" }} />
                        </MenuCard>
                    </div>

                </div>
            </div>
        </motion.div>
    )
}

export default HomePage
