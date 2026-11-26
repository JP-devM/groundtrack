import { describe, expect, it } from 'vitest'
import { simulatedPerSecond, timeSpan } from '../lib/format'
import { MAX_RATE, SPEED_STEPS, rateFromSlider, sliderFromRate } from './useSimClock'

describe('speed slider', () => {
  const last = SPEED_STEPS.length - 1

  it('runs from 1× at one end to 600× at the other', () => {
    expect(rateFromSlider(0)).toBe(1)
    expect(rateFromSlider(last)).toBe(MAX_RATE)
  })

  it('gets faster with every step, so the handle can never stick', () => {
    for (let p = 1; p <= last; p++) expect(rateFromSlider(p)).toBeGreaterThan(rateFromSlider(p - 1))
  })

  it('gives slow speeds as much room as fast ones', () => {
    // halfway along is about 40×, not 300×
    expect(rateFromSlider(Math.round(last / 2))).toBeLessThan(60)
  })

  it('puts the handle back where a speed came from', () => {
    for (let p = 0; p <= last; p++) expect(sliderFromRate(rateFromSlider(p))).toBe(p)
  })

  it('stays within the ends if pushed past them', () => {
    expect(rateFromSlider(-3)).toBe(1)
    expect(rateFromSlider(999)).toBe(MAX_RATE)
  })
})

describe('clock wording', () => {
  it('gives the simulated time covered by one wall-clock second', () => {
    expect(simulatedPerSecond(1)).toBe('1 s')
    expect(simulatedPerSecond(30)).toBe('30 s')
    expect(simulatedPerSecond(60)).toBe('1 min')
    expect(simulatedPerSecond(90)).toBe('1.5 min')
    expect(simulatedPerSecond(600)).toBe('10 min')
  })

  it('describes a gap in time whichever direction it runs', () => {
    expect(timeSpan(45_000)).toBe('45 s')
    expect(timeSpan(-12 * 60_000)).toBe('12 min')
    expect(timeSpan(3 * 3_600_000 + 5 * 60_000)).toBe('3 h 05 min')
    expect(timeSpan(52 * 3_600_000)).toBe('2 days 4 h')
  })
})
