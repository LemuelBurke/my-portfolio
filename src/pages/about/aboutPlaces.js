// The places on Morgan's World, in the order they appear in the dock. Each place gathers the About
// Me entries that happened there (by tab and entry id from aboutContent.js, so the text lives in one
// place). Coordinates are latitude/longitude in degrees.
import { TABS } from "./aboutContent"
import travelCzechia from "../../assets/imgs/aboutMePage/travel1.png"
import travelJapan from "../../assets/imgs/aboutMePage/travel2.png"
import travelUsa from "../../assets/imgs/aboutMePage/travel3.png"
// Flags the Mii holds up at each place (flag-icons, MIT licence)
import flagWales from "flag-icons/flags/4x3/gb-wls.svg"
import flagCzechia from "flag-icons/flags/4x3/cz.svg"
import flagJapan from "flag-icons/flags/4x3/jp.svg"
import flagUsa from "flag-icons/flags/4x3/us.svg"
import flagAustralia from "flag-icons/flags/4x3/au.svg"

const entry = (tabId, id) => TABS.find((t) => t.id === tabId).tiles.find((t) => t.id === id)

const future = entry("about", "future")

export const HOME_ID = "wales"

export const PLACES = [
    {
        id: "wales",
        flag: flagWales,
        name: "South Wales",
        tagline: "Where I'm from",
        lat: 51.5,
        lon: -3.4,
        labelSide: "left", // Czechia's pin is close by, so the two labels go either side
        groups: [
            { title: "Growing up", items: [entry("about", "hello"), entry("education", "gcses"), entry("education", "a-levels")] },
            { title: "Cardiff University", items: [entry("education", "cardiff"), entry("work", "car"), entry("about", "autonomous")] },
            { title: "Work in the UK", items: [entry("work", "novomatic"), entry("work", "tesco"), entry("work", "home-bargains")] },
        ],
    },
    {
        id: "czechia",
        flag: flagCzechia,
        name: "Czech Republic",
        tagline: "Travelled",
        lat: 50.08,
        lon: 14.43,
        labelSide: "right",
        groups: [
            {
                items: [
                    {
                        id: "czechia-trip",
                        title: "Exploring Czechia",
                        text: [future.text[1]],
                        photos: [travelCzechia],
                        polaroid: true,
                    },
                ],
            },
        ],
    },
    {
        id: "japan",
        flag: flagJapan,
        name: "Hokkaido, Japan",
        tagline: "Volunteered & travelled",
        lat: 43.19,
        lon: 140.79,
        groups: [{ items: [entry("work", "yoichi"), { id: "japan-trip", title: "Travelling Japan", photos: [travelJapan], polaroid: true }] }],
    },
    {
        id: "florida",
        flag: flagUsa,
        name: "Florida, USA",
        tagline: "Spoke at IBM TechXchange",
        lat: 28.5,
        lon: -81.4,
        groups: [{ items: [entry("work", "ibm"), { id: "usa-trip", title: "Travelling the USA", photos: [travelUsa], polaroid: true }] }],
    },
    {
        id: "brisbane",
        flag: flagAustralia,
        name: "Brisbane, Australia",
        tagline: "Where I live now",
        lat: -27.47,
        lon: 153.03,
        // the future entry's own photos are the travel polaroids, which already sit on their places
        groups: [{ items: [entry("work", "cainan"), { ...future, photos: undefined, thumb: undefined, polaroid: false, icon: "plane" }] }],
    },
]

// Trips drawn as flight paths: everything starts from home, and the move to Brisbane is the big one
export const ROUTES = [
    { from: "wales", to: "czechia" },
    { from: "wales", to: "japan" },
    { from: "wales", to: "florida" },
    { from: "wales", to: "brisbane", main: true },
]

// Not places: what Morgan carries everywhere
export const SUITCASE = ["skills", "tools", "hobbies"].map((id) => TABS.find((t) => t.id === id))

export const START_ID = "brisbane"
