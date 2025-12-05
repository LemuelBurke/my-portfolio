import "../../styles/nextArrow.css";
import wiiArrowImg from "../../assets/imgs/wiiArrow.svg";

const NextArrow = ({ onNext, disabled }) => {
    return (
        <img
            src={wiiArrowImg}
            onClick={disabled ? null : onNext}
            className={`next-arrow ${disabled ? 'disabled' : ''}`} // FIXED: Use curly braces, not backticks!
            alt="Next page"
            style={{
                opacity: disabled ? 0.3 : 1,
                cursor: disabled ? 'default' : 'pointer'
            }}
        />
    );
};
export default NextArrow;