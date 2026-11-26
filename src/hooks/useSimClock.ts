import { useCallback, useEffect, useRef, useState } from 'react'

export const MIN_RATE = 1
export const MAX_RATE = 600

export interface SimClock {
  /** the simulation epoch: the instant the display is computed for, ms since the Unix epoch (UTC) */
  now: number
  /** simulation epoch minus current UTC, in ms (positive = ahead) */
  offsetMs: number
  /** simulated seconds per wall-clock second, from 1 to 600 */
  rate: number
  paused: boolean
  /** true while the epoch tracks current UTC from the system clock */
  live: boolean
  setRate: (rate: number) => void
  setPaused: (paused: boolean) => void
  jumpTo: (ms: number) => void
  goLive: () => void
}

const TICK_MS = 100

/**
 * The clock behind the whole display. It starts "live": the epoch is current UTC, read from the
 * system clock (Date.now()). Changing the rate, pausing, or jumping to another instant detaches it; from
 * then on it advances on its own at the chosen rate until it is returned to now.
 */
export function useSimClock(): SimClock {
  const [time, setTime] = useState(() => ({ now: Date.now(), real: Date.now() }))
  const [rate, setRateState] = useState(MIN_RATE)
  const [paused, setPausedState] = useState(false)
  const [live, setLive] = useState(true)
  const lastTick = useRef(0)

  useEffect(() => {
    lastTick.current = performance.now()
    const id = setInterval(() => {
      const t = performance.now()
      const elapsed = t - lastTick.current
      lastTick.current = t
      const real = Date.now()
      setTime((prev) => ({ now: live ? real : paused ? prev.now : prev.now + elapsed * rate, real }))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [live, rate, paused])

  const setRate = useCallback((next: number) => {
    const clamped = Math.min(MAX_RATE, Math.max(MIN_RATE, Math.round(next)))
    setRateState(clamped)
    // Live already advances at 1×, so choosing 1× while live changes nothing.
    if (clamped !== MIN_RATE) setLive(false)
  }, [])

  const setPaused = useCallback((next: boolean) => {
    setPausedState(next)
    if (next) setLive(false)
  }, [])

  const jumpTo = useCallback((ms: number) => {
    setTime({ now: ms, real: Date.now() })
    setLive(false)
  }, [])

  const goLive = useCallback(() => {
    setRateState(MIN_RATE)
    setPausedState(false)
    setLive(true)
    setTime({ now: Date.now(), real: Date.now() })
  }, [])

  return { now: time.now, offsetMs: live ? 0 : time.now - time.real, rate, paused, live, setRate, setPaused, jumpTo, goLive }
}

/**
 * The speeds the slider steps through. They grow by roughly the same proportion each step, so
 * slow speeds get as much room as fast ones, and every step lands on a round, distinct number.
 */
export const SPEED_STEPS = [
  1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 75, 90, 120, 150, 180, 240, 300, 360, 450, 600,
]

export function rateFromSlider(position: number): number {
  return SPEED_STEPS[Math.min(SPEED_STEPS.length - 1, Math.max(0, Math.round(position)))]
}

/** The slider position whose speed is closest to `rate`. */
export function sliderFromRate(rate: number): number {
  let best = 0
  SPEED_STEPS.forEach((step, i) => {
    if (Math.abs(step - rate) < Math.abs(SPEED_STEPS[best] - rate)) best = i
  })
  return best
}
