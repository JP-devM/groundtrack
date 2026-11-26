/**
 * Lowest elevation above the horizon at which each radio link is treated as usable.
 * These are typical planning values, not any operator's real figures: commanding works close to
 * the horizon, while high-rate data needs a clearer, shorter path through the atmosphere.
 */
export const UPLINK_MIN_ELEVATION_DEG = 5
export const DOWNLINK_MIN_ELEVATION_DEG = 10
