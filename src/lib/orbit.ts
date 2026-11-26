import {
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  gstime,
  propagate,
  twoline2satrec,
  type SatRec,
} from 'satellite.js'

export const EARTH_RADIUS_KM = 6371
const DEG = Math.PI / 180
const DAY_MS = 86_400_000

export interface Tle {
  name: string
  line1: string
  line2: string
}

export interface Satellite {
  /** NORAD catalogue number */
  id: string
  name: string
  satrec: SatRec
  epochMs: number
  inclinationDeg: number
  periodMin: number
}

export interface Station {
  id: string
  name: string
  lat: number
  lon: number
  altKm: number
}

export interface SatState {
  lat: number
  lon: number
  altKm: number
  speedKmS: number
  sunlit: boolean
}

export interface Pass {
  satId: string
  stationId: string
  /** acquisition of signal, ms since Unix epoch */
  aos: number
  /** loss of signal */
  los: number
  /** time of closest approach (highest elevation) */
  tca: number
  maxElDeg: number
}

export type LonLat = [lon: number, lat: number]

/** Parses three-line element sets (name line followed by lines 1 and 2). */
export function parseTleText(text: string): Tle[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
  const out: Tle[] = []
  let i = 0
  while (i + 2 < lines.length) {
    if (lines[i + 1].startsWith('1 ') && lines[i + 2].startsWith('2 ')) {
      out.push({ name: lines[i].trim(), line1: lines[i + 1], line2: lines[i + 2] })
      i += 3
    } else {
      i += 1
    }
  }
  return out
}

function tleEpochMs(line1: string): number {
  const yy = Number(line1.slice(18, 20))
  const dayOfYear = Number(line1.slice(20, 32))
  const year = yy < 57 ? 2000 + yy : 1900 + yy
  return Date.UTC(year, 0, 1) + (dayOfYear - 1) * DAY_MS
}

export function toSatellite(tle: Tle): Satellite {
  const satrec = twoline2satrec(tle.line1, tle.line2)
  return {
    id: tle.line1.slice(2, 7).trim(),
    name: tle.name,
    satrec,
    epochMs: tleEpochMs(tle.line1),
    inclinationDeg: satrec.inclo / DEG,
    // Revolutions per day as published in line 2 (satrec.no holds SGP4's adjusted value instead).
    periodMin: 1440 / Number(tle.line2.slice(52, 63)),
  }
}

/** Unit vector from Earth's centre to the Sun in the inertial frame (low-precision almanac). */
export function sunDirection(date: Date): { x: number; y: number; z: number } {
  const d = date.getTime() / DAY_MS + 2440587.5 - 2451545.0
  const g = (357.529 + 0.98560028 * d) * DEG
  const q = 280.459 + 0.98564736 * d
  const lambda = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG
  const eps = (23.439 - 0.00000036 * d) * DEG
  return {
    x: Math.cos(lambda),
    y: Math.cos(eps) * Math.sin(lambda),
    z: Math.sin(eps) * Math.sin(lambda),
  }
}

export function wrapLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180
}

/** The point on the ground where the Sun is directly overhead. */
export function subsolarPoint(date: Date): LonLat {
  const s = sunDirection(date)
  const lat = Math.asin(s.z) / DEG
  const rightAscension = Math.atan2(s.y, s.x)
  return [wrapLon((rightAscension - gstime(date)) / DEG), lat]
}

export function stateAt(sat: Satellite, date: Date): SatState | null {
  const pv = propagate(sat.satrec, date)
  if (!pv || !pv.position || !pv.velocity) return null
  const { position: r, velocity: v } = pv
  const geo = eciToGeodetic(r, gstime(date))

  // Cylindrical shadow model: in eclipse when behind the Earth and inside its shadow tube.
  const s = sunDirection(date)
  const along = r.x * s.x + r.y * s.y + r.z * s.z
  const rSq = r.x * r.x + r.y * r.y + r.z * r.z
  const sunlit = along > 0 || Math.sqrt(Math.max(0, rSq - along * along)) > EARTH_RADIUS_KM

  return {
    lat: geo.latitude / DEG,
    lon: wrapLon(geo.longitude / DEG),
    altKm: geo.height,
    speedKmS: Math.hypot(v.x, v.y, v.z),
    sunlit,
  }
}

/** Sub-satellite points between two instants (both included), for drawing a ground track. */
export function groundTrack(sat: Satellite, startMs: number, endMs: number, stepS = 30): LonLat[] {
  const pts: LonLat[] = []
  const add = (t: number) => {
    const s = stateAt(sat, new Date(t))
    if (s) pts.push([s.lon, s.lat])
  }
  let t = startMs
  for (; t < endMs; t += stepS * 1000) add(t)
  if (endMs >= startMs) add(endMs)
  return pts
}

/**
 * One trip around the Earth. By convention an orbit starts when the satellite crosses the
 * equator heading north (the ascending node), so that is where one orbit hands over to the next.
 */
export interface Revolution {
  satId: string
  /** start of the current orbit */
  start: number
  /** end of the current orbit, which is the start of the upcoming one */
  end: number
  /** end of the upcoming orbit */
  nextEnd: number
}

const NODE_SCAN_MS = 60_000

function latitudeAt(sat: Satellite, ms: number): number {
  return stateAt(sat, new Date(ms))?.lat ?? Number.NaN
}

/** Narrows a bracket whose low end is south of the equator and high end is north of it. */
function refineNode(sat: Satellite, lo: number, hi: number): number {
  while (hi - lo > 500) {
    const mid = (lo + hi) / 2
    if (latitudeAt(sat, mid) >= 0) hi = mid
    else lo = mid
  }
  return Math.round(hi)
}

/** First northbound equator crossing after `fromMs`, searching up to `spanMs` ahead. */
function ascendingNodeAfter(sat: Satellite, fromMs: number, spanMs: number): number | null {
  for (let t = fromMs + NODE_SCAN_MS; t <= fromMs + spanMs; t += NODE_SCAN_MS) {
    if (latitudeAt(sat, t - NODE_SCAN_MS) < 0 && latitudeAt(sat, t) >= 0) {
      return refineNode(sat, t - NODE_SCAN_MS, t)
    }
  }
  return null
}

/** The orbit the satellite is flying at `ms`, and the one after it. */
export function revolutionAt(sat: Satellite, ms: number): Revolution | null {
  const periodMs = sat.periodMin * 60_000
  let start: number | null = null
  for (let t = ms; t > ms - 1.1 * periodMs; t -= NODE_SCAN_MS) {
    if (latitudeAt(sat, t - NODE_SCAN_MS) < 0 && latitudeAt(sat, t) >= 0) {
      start = refineNode(sat, t - NODE_SCAN_MS, t)
      break
    }
  }
  if (start === null) return null
  const end = ascendingNodeAfter(sat, start + 0.9 * periodMs, 0.2 * periodMs)
  if (end === null) return null
  const nextEnd = ascendingNodeAfter(sat, end + 0.9 * periodMs, 0.2 * periodMs)
  if (nextEnd === null) return null
  return { satId: sat.id, start, end, nextEnd }
}

/** Elevation of the satellite above the station's horizon, in degrees. */
export function elevationDeg(sat: Satellite, station: Station, date: Date): number {
  const pv = propagate(sat.satrec, date)
  if (!pv || !pv.position) return -90
  const ecf = eciToEcf(pv.position, gstime(date))
  const look = ecfToLookAngles(
    { longitude: station.lon * DEG, latitude: station.lat * DEG, height: station.altKm },
    ecf,
  )
  return look.elevation / DEG
}

/**
 * Angular radius (degrees of arc) of the ground area from which a satellite at this altitude
 * appears at least `minElDeg` above the horizon. A higher minimum gives a smaller footprint.
 */
export function footprintRadiusDeg(altKm: number, minElDeg = 0): number {
  const el = minElDeg * DEG
  return (Math.acos((EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altKm)) * Math.cos(el)) - el) / DEG
}

/**
 * Finds every contact between a satellite and a station in a time window.
 * Samples elevation on a coarse step, then bisects each horizon crossing to one second.
 */
export function findPasses(
  sat: Satellite,
  station: Station,
  startMs: number,
  endMs: number,
  minElDeg = 5,
  stepS = 30,
): Pass[] {
  const above = (ms: number) => elevationDeg(sat, station, new Date(ms)) - minElDeg
  const crossing = (lo: number, hi: number) => {
    const loUp = above(lo) > 0
    while (hi - lo > 1000) {
      const mid = (lo + hi) / 2
      if (above(mid) > 0 === loUp) lo = mid
      else hi = mid
    }
    return Math.round(hi)
  }

  const passes: Pass[] = []
  const step = stepS * 1000
  let prevT = startMs
  let prevV = above(startMs)
  let aos: number | null = prevV > 0 ? startMs : null
  let peak = prevV
  let tca = startMs

  for (let t = startMs + step; t <= endMs; t += step) {
    const v = above(t)
    if (aos === null && v > 0) {
      aos = crossing(prevT, t)
      peak = v
      tca = t
    } else if (aos !== null && v > 0) {
      if (v > peak) {
        peak = v
        tca = t
      }
    } else if (aos !== null) {
      passes.push({
        satId: sat.id,
        stationId: station.id,
        aos,
        los: crossing(prevT, t),
        tca,
        maxElDeg: peak + minElDeg,
      })
      aos = null
    }
    prevT = t
    prevV = v
  }
  if (aos !== null) {
    passes.push({ satId: sat.id, stationId: station.id, aos, los: endMs, tca, maxElDeg: peak + minElDeg })
  }
  return passes
}
