// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SNAPSHOT } from '../data/tle'
import { toSatellite, type Pass } from '../lib/orbit'
import { ContactTimeline } from './ContactTimeline'

const satellites = SNAPSHOT.tles.slice(0, 2).map(toSatellite)
const start = Date.UTC(2026, 10, 26, 0, 0, 0)
const passes: Pass[] = [
  { satId: satellites[0].id, stationId: 'tokyo', aos: start + 3_600_000, los: start + 4_200_000, tca: start + 3_900_000, maxElDeg: 62 },
  { satId: satellites[1].id, stationId: 'tokyo', aos: start + 7_200_000, los: start + 7_500_000, tca: start + 7_350_000, maxElDeg: 14 },
]

function setup() {
  const onJump = vi.fn()
  const onSelectSatellite = vi.fn()
  render(
    <ContactTimeline
      satellites={satellites}
      passes={passes}
      stationName="Tokyo"
      startMs={start}
      endMs={start + 86_400_000}
      now={start + 1000}
      selectedId={satellites[0].id}
      onSelectSatellite={onSelectSatellite}
      onJump={onJump}
    />,
  )
  return { onJump, onSelectSatellite }
}

afterEach(cleanup)

describe('ContactTimeline', () => {
  it('draws one labelled bar per contact', () => {
    setup()
    const bars = screen.getAllByRole('button')
    expect(bars).toHaveLength(2)
    expect(bars[0].getAttribute('aria-label')).toBe(
      `${satellites[0].name} over Tokyo, 01:00:00 to 01:10:00 UTC, highest 62 degrees`,
    )
  })

  it('draws a higher pass as a taller bar', () => {
    setup()
    const [high, low] = screen.getAllByRole('button')
    expect(Number(high.getAttribute('height'))).toBeGreaterThan(Number(low.getAttribute('height')))
  })

  it('selects the satellite and jumps to the contact start when a bar is chosen', () => {
    const { onJump, onSelectSatellite } = setup()
    fireEvent.click(screen.getAllByRole('button')[1])
    expect(onSelectSatellite).toHaveBeenCalledWith(satellites[1].id)
    expect(onJump).toHaveBeenCalledWith(passes[1].aos)
  })

  it('works from the keyboard', () => {
    const { onJump } = setup()
    fireEvent.keyDown(screen.getAllByRole('button')[0], { key: 'Enter' })
    expect(onJump).toHaveBeenCalledWith(passes[0].aos)
  })

  it('describes the focused contact in the readout', () => {
    setup()
    fireEvent.focus(screen.getAllByRole('button')[0])
    expect(screen.getByText(/10:00 long, highest 62°/)).toBeTruthy()
  })
})
