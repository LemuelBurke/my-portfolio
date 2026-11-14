// WMO weather codes (as Open-Meteo reports them) -> a short description and a Wii-style icon
const KINDS = [
    [[0], "clear", "Clear skies"],
    [[1], "mostly-clear", "Mostly clear"],
    [[2], "part-cloud", "Partly cloudy"],
    [[3], "cloud", "Overcast"],
    [[45, 48], "fog", "Foggy"],
    [[51, 53, 55, 56, 57], "drizzle", "Drizzle"],
    [[61, 63, 65, 66, 67, 80, 81, 82], "rain", "Rain"],
    [[71, 73, 75, 77, 85, 86], "snow", "Snow"],
    [[95, 96, 99], "storm", "Thunderstorms"],
]

export const kindOf = (code) => KINDS.find(([codes]) => codes.includes(code)) ?? KINDS[3]

export const describe = (code) => kindOf(code)[2]
