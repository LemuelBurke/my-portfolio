import "../../styles/nextArrow.css";
import wiiArrowImg from "../../assets/imgs/wiiArrow.svg";

const NextArrow = () => {
    const handleClick = () => {
        console.log('Next arrow clicked');
        
        const menuGrid = document.querySelector(".menu-grid");
        const pages = [...document.querySelectorAll(".menu-page")];
        
        if (!menuGrid || pages.length === 0) {
            console.error('No menu grid or pages found');
            return;
        }

        console.log(`found ${pages.length} pages`);

        // Get current scroll position of the menu grid (horizontal)
        const currentScroll = menuGrid.scrollLeft;
        const containerWidth = menuGrid.clientWidth;
        
        console.log(`Current scroll: ${currentScroll}, Container width: ${containerWidth}`);

        // Find the next page to the right
        let nextPageIndex = -1;
        for (let i = 0; i < pages.length; i++) {
            const pageLeft = pages[i].offsetLeft;
            console.log(`Page ${i} left: ${pageLeft}`);
            
            // Find first page that's significantly to the right of current scroll
            if (pageLeft > currentScroll + 50) {
                nextPageIndex = i;
                break;
            }
        }

        if (nextPageIndex !== -1) {
            console.log(`scrolling to page ${nextPageIndex}`);
            pages[nextPageIndex].scrollIntoView({ 
                behavior: "smooth", 
                inline: "start", // horizontal alignment
                block: "nearest"  // don't change vertical position
            });
        } else {
            console.log(' at the last page');
        }
    };

    return (
        <img
            src={wiiArrowImg}
            onClick={handleClick}
            className={`next-arrow`}
            alt="Next page"
        />
    );
};

export default NextArrow;
