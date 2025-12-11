import "../../styles/nextArrow.css";
import wiiArrowImg from "../../assets/imgs/wiiArrow.svg";
import userCursor from "../../assets/imgs/user-cursor-med.png";

const NextArrow = ({ onNext, disabled }) => {
    return (
        <img
            src={wiiArrowImg}
            onClick={disabled ? null : onNext}
            className={`next-arrow ${disabled ? 'disabled' : ''}`}
            alt="Next page"
            style={{
                opacity: disabled ? 0.3 : 1,
                cursor: disabled ? 'default' : `url('${userCursor}'), auto`
            }}
            draggable={false}
        />
    );
};
export default NextArrow;