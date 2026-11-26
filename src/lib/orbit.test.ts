import { describe, expect, it } from 'vitest'
import { STATIONS } from '../data/stations'
import { SNAPSHOT } from '../data/tle'
import {
  findPasses,
  footprintRadiusDeg,
  groundTrack,
  parseTleText,
  revolutionAt,
  stateAt,
  subsolarPoint,
  toSatellite,
  wrapLon,
} from './orbit'

const strix1 = toSatellite(SNAPSHOT.tles.find((t) => t.name === 'STRIX-1')!)
const strix4 = toSatellite(SNAPSHOT.tles.find((t) => t.name === 'STRIX-4')!)
const svalbard = STATIONS.find((s) => s.id === 'svalbard')!
const DAY_MS = 86_400_000

describe('parseTleText', () => {
  it('reads every satellite in the saved set', () => {
    expect(SNAPSHOT.tles).toHaveLength(8)
  })

  it('skips stray lines between element sets', () => {
    const text = `junk\nSAT-A\n${SNAPSHOT.tles[0].line1}\n${SNAPSHOT.tles[0].line2}\n\ntrailing`
    expect(parseTleText(text)).toEqual([{ ...SNAPSHOT.tles[0], name: 'SAT-A' }])
  })
})

describe('toSatellite', () => {
  it('derives catalogue number, epoch and orbit shape from the elements', () => {
    expect(strix1.id).toBe('53815')
    expect(new Date(strix1.epochMs).toISOString().slice(0, 10)).toBe('2026-11-25')
    expect(strix1.inclinationDeg).toBeCloseTo(97.4294, 3)
    expect(strix1.periodMin).toBeCloseTo(1440 / 15.47436849, 2)
  })
})

describe('stateAt', () => {
  it('places a low Earth orbit satellite at a plausible height and speed', () => {
    const s = stateAt(strix1, new Date(strix1.epochMs))!
    expect(s.altKm).toBeGreaterThan(350)
    expect(s.altKm).toBeLessThan(650)
    expect(s.speedKmS).toBeGreaterThan(7.4)
    expect(s.speedKmS).toBeLessThan(7.8)
  })
})

describe('groundTrack', () => {
  it('never goes further from the equator than the inclination allows', () => {
    const track = groundTrack(strix4, strix4.epochMs, strix4.epochMs + DAY_MS / 4, 60)
    const maxLat = Math.max(...track.map(([, lat]) => Math.abs(lat)))
    expect(maxLat).toBeLessThan(strix4.inclinationDeg + 0.3)
    expect(maxLat).toBeGreaterThan(strix4.inclinationDeg - 1)
  })
})

describe('revolutionAt', () => {
  const at = strix1.epochMs + 20 * 60_000
  const rev = revolutionAt(strix1, at)!
  const periodMs = strix1.periodMin * 60_000

  it('brackets the given time with the current orbit and follows it with the upcoming one', () => {
    expect(rev.start).toBeLessThanOrEqual(at)
    expect(rev.end).toBeGreaterThan(at)
    expect(rev.nextEnd).toBeGreaterThan(rev.end)
  })

  it('makes each orbit one period long, to within a few seconds', () => {
    expect(Math.abs(rev.end - rev.start - periodMs)).toBeLessThan(10_000)
    expect(Math.abs(rev.nextEnd - rev.end - periodMs)).toBeLessThan(10_000)
  })

  it('starts each orbit on the equator, heading north', () => {
    for (const node of [rev.start, rev.end, rev.nextEnd]) {
      expect(Math.abs(stateAt(strix1, new Date(node))!.lat)).toBeLessThan(0.1)
      expect(stateAt(strix1, new Date(node + 60_000))!.lat).toBeGreaterThan(1)
    }
  })

  it('hands over cleanly: just after the end, the upcoming orbit is the current one', () => {
    const after = revolutionAt(strix1, rev.end + 2000)!
    expect(Math.abs(after.start - rev.end)).toBeLessThan(2000)
    expect(Math.abs(after.end - rev.nextEnd)).toBeLessThan(2000)
  })

  it('draws the two orbits as one unbroken line', () => {
    const current = groundTrack(strix1, rev.start, rev.end)
    const upcoming = groundTrack(strix1, rev.end, rev.nextEnd)
    expect(upcoming[0]).toEqual(current[current.length - 1])
  })
})

describe('findPasses', () => {
  const start = strix1.epochMs
  const passes = findPasses(strix1, svalbard, start, start + DAY_MS)

  it('finds a polar satellite over a polar station on most orbits', () => {
    expect(passes.length).toBeGreaterThanOrEqual(8)
  })

  it('returns ordered, non-overlapping contacts that peak above the mask', () => {
    passes.forEach((p, i) => {
      expect(p.los).toBeGreaterThan(p.aos)
      expect(p.tca).toBeGreaterThanOrEqual(p.aos)
      expect(p.tca).toBeLessThanOrEqual(p.los)
      expect(p.maxElDeg).toBeGreaterThan(5)
      expect(p.los - p.aos).toBeLessThan(15 * 60_000)
      if (i > 0) expect(p.aos).toBeGreaterThan(passes[i - 1].los)
    })
  })

  it('finds none for a 43° orbit that never rises over Svalbard', () => {
    expect(findPasses(strix4, svalbard, start, start + DAY_MS)).toEqual([])
  })
})

describe('subsolarPoint', () => {
  it('sits on the equator at the March equinox', () => {
    const [, lat] = subsolarPoint(new Date('2026-03-20T14:46:00Z'))
    expect(Math.abs(lat)).toBeLessThan(0.2)
  })

  it('reaches the Tropic of Cancer at the June solstice', () => {
    const [, lat] = subsolarPoint(new Date('2026-06-21T08:25:00Z'))
    expect(lat).toBeCloseTo(23.44, 1)
  })

  it('is near the Greenwich meridian at noon UTC', () => {
    const [lon] = subsolarPoint(new Date('2026-06-21T12:00:00Z'))
    expect(Math.abs(lon)).toBeLessThan(5)
  })
})

describe('helpers', () => {
  it('wraps longitudes into -180..180', () => {
    expect(wrapLon(190)).toBe(-170)
    expect(wrapLon(-190)).toBe(170)
    expect(wrapLon(45)).toBe(45)
  })

  it('gives a wider footprint to a higher satellite', () => {
    expect(footprintRadiusDeg(550)).toBeCloseTo(23, 0)
    expect(footprintRadiusDeg(800)).toBeGreaterThan(footprintRadiusDeg(550))
  })

  it('shrinks the footprint as the minimum elevation rises, to nothing at straight overhead', () => {
    // acos(6371 / 6921 × cos 5°) − 5° = 23.50° − 5°
    expect(footprintRadiusDeg(550, 5)).toBeCloseTo(18.5, 1)
    expect(footprintRadiusDeg(550, 10)).toBeLessThan(footprintRadiusDeg(550, 5))
    expect(footprintRadiusDeg(550, 90)).toBeCloseTo(0, 6)
  })
})
