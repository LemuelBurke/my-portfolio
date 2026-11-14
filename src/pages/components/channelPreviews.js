import miiMusic from "../../assets/audio/mii-channel-music.mp3"
import partyMusic from "../../assets/audio/wiiParty.mp3"
import shopMusic from "../../assets/audio/wiiShopMusic.mp3"
import sportsMusic from "../../assets/audio/wiiSports.mp3"

// The snatch of music the channel select screen plays for each channel
export const PREVIEWS = {
    "About Me": { music: miiMusic },
    "My Projects": { music: partyMusic },
    "Resume and CV": { music: shopMusic },
    "Message Me": { music: miiMusic },
    LinkedIn: {},
    GitHub: {},
    Forecast: { music: shopMusic },
    "Bubble Pop": { music: sportsMusic },
    "Sky Stacker": { music: sportsMusic },
    "Disc Catch": { music: sportsMusic },
}

export const STARS_PREVIEW = {}
