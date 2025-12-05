import { motion, AnimatePresence } from "framer-motion"
import "../styles/homePage.css"
import MenuCard from "./components/menuCard"
import Img from "../assets/imgs/placeholderCardImg.png"
import NextArrow from "./components/nextPage"

const HomePage = ({ isVisible = true }) => {
    return (
        <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="menu-viewport">
                <NextArrow
                    targetId="page-2"
                />

                <div className="menu-grid">

                    {/* PAGE 1 */}
                    <div className="menu-page" id="page-1">
                        {[...Array(12)].map((_, i) => (
                            <MenuCard key={i} title="" onClick={() => console.log("Clicked!")}>
                                <img src={Img} style={{ width: "120%" }} />
                            </MenuCard>
                        ))}
                    </div>

                    {/* PAGE 2 */}
                    <div className="menu-page" id="page-2">
                        {[...Array(12)].map((_, i) => (
                            <MenuCard key={i} title="" onClick={() => console.log("Clicked!")}>
                                <img src={Img} style={{ width: "120%" }} />
                            </MenuCard>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default HomePage
