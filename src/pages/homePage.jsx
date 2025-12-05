import { motion } from "framer-motion"
import "../styles/homePage.css"
import MenuCard from "./components/menuCard"
import newsImg from "../assets/imgs/bruh-meme-2.jpg"

const HomePage = () => {
    return (
        <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}>

            <div className="menu-grid">
                <MenuCard title="News Channel" onClick={() => console.log("Clicked!")}>
                    <img src={newsImg} style={{ width: "120%" }} />
                </MenuCard>
            </div>
        </motion.div>
    )
}
export default HomePage
