import { useState, type KeyboardEvent, type MouseEvent } from 'react'
import { duration, utcDayMonth, utcHourMinute, utcTime } from '../lib/format'
import type { Pass, Satellite } from '../lib/orbit'

const W = 1000
const GUTTER = 86
const AXIS_H = 24
const ROW_H = 28
const HOUR_MS = 3_600_000

interface Props {
  satellites: Satellite[]
  passes: Pass[]
  stationName: string
  startMs: number
  endMs: number
  now: number
  selectedId: string
  onSelectSatellite: (id: string) => void
  onJump: (ms: number) => void
}

export function ContactTimeline({
  satellites,
  passes,
  stationName,
  startMs,
  endMs,
  now,
  selectedId,
  onSelectSatellite,
  onJump,
}: Props) {
  const [focused, setFocused] = useState<Pass | null>(null)
  const height = AXIS_H + satellites.length * ROW_H + 4
  const x = (ms: number) => GUTTER + ((ms - startMs) / (endMs - startMs)) * (W - GUTTER)

  const ticks: number[] = []
  for (let t = Math.ceil(startMs / (3 * HOUR_MS)) * 3 * HOUR_MS; t <= endMs; t += 3 * HOUR_MS) ticks.push(t)

  const scrub = (e: MouseEvent<SVGRectElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const fraction = (e.clientX - box.left) / box.width
    onJump(startMs + fraction * (endMs - startMs))
  }

  const openPass = (p: Pass) => {
    onSelectSatellite(p.satId)
    onJump(p.aos)
  }

  const nameOf = (id: string) => satellites.find((s) => s.id === id)?.name ?? id

  return (
    <div className="timeline">
      <div className="timeline-scroll">
        <svg viewBox={`0 0 ${W} ${height}`} role="group" aria-label={`Contacts with ${stationName}, next 24 hours`}>
          {ticks.map((t) => (
            <g key={t} className="tick">
              <line x1={x(t)} x2={x(t)} y1={AXIS_H - 6} y2={height} />
              <text x={x(t) + 4} y={14}>
                {utcHourMinute(t)}
                {new Date(t).getUTCHours() === 0 ? ` ${utcDayMonth(t)}` : ''}
              </text>
            </g>
          ))}

          {satellites.map((sat, row) => {
            const y = AXIS_H + row * ROW_H
            return (
              <g key={sat.id} className={sat.id === selectedId ? 'row is-active' : 'row'}>
                <line className="row-rule" x1={0} x2={W} y1={y + ROW_H} y2={y + ROW_H} />
                <text x={0} y={y + 19}>
                  {sat.name}
                </text>
              </g>
            )
          })}

          {/* Click empty track to move the clock there. Keyboard users jump via the contact bars. */}
          <rect
            className="scrub"
            x={GUTTER}
            y={AXIS_H}
            width={W - GUTTER}
            height={height - AXIS_H}
            onClick={scrub}
          />

          {passes.map((p) => {
            const row = satellites.findIndex((s) => s.id === p.satId)
            if (row < 0) return null
            // Taller bar means a higher pass, which means a longer, stronger link.
            const h = 6 + (Math.min(p.maxElDeg, 90) / 90) * 18
            const y = AXIS_H + row * ROW_H + ROW_H - 2 - h
            const label = `${nameOf(p.satId)} over ${stationName}, ${utcTime(p.aos)} to ${utcTime(p.los)} UTC, highest ${Math.round(p.maxElDeg)} degrees`
            const cls = ['pass', p.satId === selectedId ? 'is-active' : '', p.los < now ? 'is-past' : ''].join(' ')
            return (
              <rect
                key={`${p.satId}-${p.aos}`}
                className={cls}
                x={x(p.aos)}
                y={y}
                width={Math.max(3, x(p.los) - x(p.aos))}
                height={h}
                role="button"
                tabIndex={0}
                aria-label={label}
                onClick={() => openPass(p)}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openPass(p)
                  }
                }}
                onMouseEnter={() => setFocused(p)}
                onMouseLeave={() => setFocused(null)}
                onFocus={() => setFocused(p)}
                onBlur={() => setFocused(null)}
              />
            )
          })}

          {now >= startMs && now <= endMs && (
            <line className="now-line" x1={x(now)} x2={x(now)} y1={AXIS_H - 8} y2={height} />
          )}
        </svg>
      </div>
      <p className="timeline-readout" aria-live="polite">
        {focused
          ? `${nameOf(focused.satId)} over ${stationName}: ${utcTime(focused.aos)} to ${utcTime(focused.los)} UTC, ${duration(focused.los - focused.aos)} long, highest ${Math.round(focused.maxElDeg)}°`
          : 'Bar height shows how high the pass climbs. Choose a bar to jump to the start of that contact, or click the track to move the clock.'}
      </p>
    </div>
  )
}
