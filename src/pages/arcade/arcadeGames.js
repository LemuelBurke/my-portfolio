import bubblePop from "./bubblePop"
import skyStacker from "./skyStacker"
import discCatch from "./discCatch"
import bubblePopThumb from "../../assets/imgs/thumbnails/arcade-bubble-pop.webp"
import bubblePopFull from "../../assets/imgs/thumbnails/arcade-bubble-pop-full.webp"
import skyStackerThumb from "../../assets/imgs/thumbnails/arcade-sky-stacker.webp"
import skyStackerFull from "../../assets/imgs/thumbnails/arcade-sky-stacker-full.webp"
import discCatchThumb from "../../assets/imgs/thumbnails/arcade-disc-catch.webp"
import discCatchFull from "../../assets/imgs/thumbnails/arcade-disc-catch-full.webp"

// The arcade channels on the Wii menu, in menu order. Titles must match ARCADE_TITLES.
export const ARCADE_GAMES = [
    { ...bubblePop, thumbnail: bubblePopThumb, fullImage: bubblePopFull },
    { ...skyStacker, thumbnail: skyStackerThumb, fullImage: skyStackerFull },
    { ...discCatch, thumbnail: discCatchThumb, fullImage: discCatchFull },
]
