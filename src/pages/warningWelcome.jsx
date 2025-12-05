import "../styles/warningWelcome.css";
import warningImg from "../assets/imgs/wii_warning.png";

const warningWelcome = () => {

    //const [showLanding, setShowLanding] = useState(true)

    //const handleDismiss = () => setShowLanding(false)

	return (
        <div>
            <div
                className="landing-overlay"
                role="dialog"
                aria-labelledby="landing-title">


                <div className="landing-inner">
                    <h1 id="landing-title" className="warning-title">
                        <img src={warningImg} alt="Wii warning icon" className="warning-icon" />
                        WARNING-ENTERING PORTFOLIO
                    </h1>

                    <div className="warning-body">
                        <p>WHILST EXPLORING, PLEASE REVIEW THE CONTENTS OF THIS SITE <br/> FOR INFORMATION ABOUT
                        <span className="morgan"> MORGAN BURKE </span> 
                         <br/>TO LEARN MORE ABOUT HIM.</p>
                    </div>

                    <p className="warning-small">
                        More info at <br/>
                        <a href="https://www.linkedin.com/in/morgan--burke/" target="_blank" rel="noreferrer">www.linkedin.com/morgan--burke</a>

                    </p>



                </div>
            </div>

        </div>
	)

}

export default warningWelcome