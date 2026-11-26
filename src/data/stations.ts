import type { Station } from '../lib/orbit'

/**
 * Example ground station sites, chosen to cover high and low latitudes.
 * They are illustrative and do not describe any operator's real network.
 */
export const STATIONS: Station[] = [
  { id: 'tokyo', name: 'Tokyo', lat: 35.68, lon: 139.77, altKm: 0.04 },
  { id: 'svalbard', name: 'Svalbard', lat: 78.23, lon: 15.39, altKm: 0.45 },
  { id: 'inuvik', name: 'Inuvik', lat: 68.32, lon: -133.55, altKm: 0.05 },
  { id: 'hartebeesthoek', name: 'Hartebeesthoek', lat: -25.89, lon: 27.69, altKm: 1.4 },
  { id: 'awarua', name: 'Awarua', lat: -46.53, lon: 168.38, altKm: 0.01 },
  { id: 'punta-arenas', name: 'Punta Arenas', lat: -53.0, lon: -70.85, altKm: 0.03 },
]
