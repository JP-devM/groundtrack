import { useEffect, useMemo, useRef, useState } from 'react'
import { ContactTimeline } from './components/ContactTimeline'
import { FleetList } from './components/FleetList'
import { SatellitePanel } from './components/SatellitePanel'
import { WorldMap, type MapSatellite, type OrbitView } from './components/WorldMap'
import { GALLERY, type GalleryEntry } from './data/gallery'
import { DOWNLINK_MIN_ELEVATION_DEG, UPLINK_MIN_ELEVATION_DEG } from './data/links'
import { STATIONS } from './data/stations'
import { SNAPSHOT, loadLiveTles, type TleSet } from './data/tle'
import { MAX_RATE, SPEED_STEPS, rateFromSlider, sliderFromRate, useSimClock } from './hooks/useSimClock'
import { localTime, simulatedPerSecond, timeSpan, utcDate, utcTime } from './lib/format'
import {
  elevationDeg,
  findPasses,
  groundTrack,
  revolutionAt,
  stateAt,
  subsolarPoint,
  toSatellite,
} from './lib/orbit'

const HOUR_MS = 3_600_000
/** A contact starts once commanding is possible, so it uses the uplink limit. */
const MIN_ELEVATION_DEG = UPLINK_MIN_ELEVATION_DEG
const SHORT_LEAD_MS = 15 * 60_000
const NO_GALLERY: GalleryEntry[] = []
/** Matches the length of the handover animation in index.css. */
const HANDOVER_FLICKER_MS = 700

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { numeric: true })

export default function App() {
  const [tleSet, setTleSet] = useState<TleSet>(SNAPSHOT)
  useEffect(() => {
    let alive = true
    loadLiveTles().then((set) => {
      if (alive && set) setTleSet(set)
    })
    return () => {
      alive = false
    }
  }, [])

  const satellites = useMemo(() => tleSet.tles.map(toSatellite).sort(byName), [tleSet])
  const clock = useSimClock()
  const { now } = clock

  const [selectedId, setSelectedId] = useState(satellites[0].id)
  const [stationId, setStationId] = useState(STATIONS[0].id)
  const [showGallery, setShowGallery] = useState(true)
  const selected = satellites.find((s) => s.id === selectedId) ?? satellites[0]
  // By default the map and timeline show only the selected satellite; the fleet list always
  // shows all of them so another can be chosen.
  const [showFleet, setShowFleet] = useState(false)
  const shown = useMemo(() => (showFleet ? satellites : [selected]), [showFleet, satellites, selected])
  const station = STATIONS.find((s) => s.id === stationId) ?? STATIONS[0]

  // The planning window starts on the hour before now and slides forward hourly.
  const windowStart = Math.floor(now / HOUR_MS) * HOUR_MS - HOUR_MS
  const windowEnd = windowStart + 25 * HOUR_MS
  const passes = useMemo(
    () => shown.flatMap((sat) => findPasses(sat, station, windowStart, windowEnd, MIN_ELEVATION_DEG)),
    [shown, station, windowStart, windowEnd],
  )

  // Tracks change slowly, so redraw them every ten simulated seconds rather than every tick.
  const trackTime = Math.floor(now / 10_000) * 10_000
  const leads = useMemo(
    () =>
      new Map(
        satellites.map((sat) => [
          sat.id,
          sat.id === selected.id ? [] : groundTrack(sat, trackTime, trackTime + SHORT_LEAD_MS),
        ]),
      ),
    [satellites, selected.id, trackTime],
  )

  // The selected satellite's current orbit and the one after it, checked every simulated second
  // so the handover from one orbit to the next is caught promptly.
  const second = Math.floor(now / 1000) * 1000
  const revolution = useMemo(() => revolutionAt(selected, second), [selected, second])
  const revStart = revolution?.start
  const revEnd = revolution?.end
  const revNextEnd = revolution?.nextEnd
  const orbitTracks = useMemo(() => {
    if (revStart === undefined || revEnd === undefined || revNextEnd === undefined) return null
    const split = Math.min(Math.max(trackTime, revStart), revEnd)
    const upcoming = groundTrack(selected, revEnd, revNextEnd)
    return {
      travelled: groundTrack(selected, revStart, split),
      remaining: groundTrack(selected, split, revEnd),
      upcoming,
      upcomingHead: upcoming[0],
    }
  }, [selected, revStart, revEnd, revNextEnd, trackTime])

  // When the upcoming orbit becomes the current one, it briefly flickers into place.
  const previousRevolution = useRef(revolution)
  const [handoverAt, setHandoverAt] = useState<number | null>(null)
  useEffect(() => {
    const prev = previousRevolution.current
    previousRevolution.current = revolution
    // A real handover: the new orbit starts where the old one ended. Clock jumps don't count.
    if (prev && revolution && prev.satId === revolution.satId && Math.abs(revolution.start - prev.end) < 5000) {
      setHandoverAt(revolution.start)
    }
  }, [revolution])
  useEffect(() => {
    if (handoverAt === null) return
    const id = setTimeout(() => setHandoverAt(null), HANDOVER_FLICKER_MS)
    return () => clearTimeout(id)
  }, [handoverAt])

  const date = new Date(now)
  const rows = satellites.map((sat) => ({
    sat,
    state: stateAt(sat, date),
    inContact: elevationDeg(sat, station, date) >= MIN_ELEVATION_DEG,
  }))
  const mapSatellites: MapSatellite[] = rows.flatMap((row) =>
    row.state && shown.includes(row.sat) ? [{ ...row, state: row.state, ahead: leads.get(row.sat.id) ?? [] }] : [],
  )
  const orbit: OrbitView | null =
    orbitTracks && orbitTracks.upcomingHead ? { ...orbitTracks, handover: handoverAt !== null } : null
  const selectedRow = rows.find((r) => r.sat.id === selected.id)

  return (
    <div className="app">
      <header className="masthead">
        <div className="brand">
          <h1>Groundtrack</h1>
          <p>Contact planning for the StriX radar satellites</p>
        </div>

        <div className="clock">
          <div className="clock-main" aria-label="Displayed time, UTC">
            <span className="clock-time">{utcTime(now)}</span>
            <span className="clock-date">{utcDate(now)} UTC</span>
          </div>
          <p className={clock.live ? 'clock-status is-live' : 'clock-status'}>
            {clock.live
              ? 'Live: epoch is current UTC, read from the system clock.'
              : `${clock.paused ? 'Paused' : 'Simulated'} epoch: ${
                  Math.abs(clock.offsetMs) < 1000
                    ? 'equal to current UTC'
                    : `current UTC ${clock.offsetMs > 0 ? '+' : '−'} ${timeSpan(clock.offsetMs)}`
                }.`}{' '}
            Local time at this epoch: {localTime(now)}.
          </p>
        </div>

        <div className="controls">
          <button type="button" className="toggle" aria-pressed={clock.paused} onClick={() => clock.setPaused(!clock.paused)}>
            {clock.paused ? 'Resume' : 'Pause'}
          </button>
          <label className="speed">
            <span>
              Speed {clock.rate}×
              <small>1 s wall clock = {simulatedPerSecond(clock.rate)} simulated</small>
            </span>
            <input
              type="range"
              min={0}
              max={SPEED_STEPS.length - 1}
              step={1}
              value={sliderFromRate(clock.rate)}
              aria-valuetext={`${clock.rate} times wall-clock rate`}
              onChange={(e) => clock.setRate(rateFromSlider(Number(e.target.value)))}
            />
            <span className="speed-ends" aria-hidden="true">
              <span>1×</span>
              <span>{MAX_RATE}×</span>
            </span>
          </label>
          <button type="button" className="primary" disabled={clock.live} onClick={clock.goLive}>
            Sync to current UTC
          </button>
        </div>
      </header>

      <main className="layout">
        <div className="stage">
          <figure className="map-figure">
            <WorldMap
              satellites={mapSatellites}
              selectedId={selected.id}
              onSelectSatellite={setSelectedId}
              orbit={orbit}
              gallery={showGallery ? GALLERY : NO_GALLERY}
              stations={STATIONS}
              stationId={station.id}
              onSelectStation={setStationId}
              sun={subsolarPoint(date)}
            />
            <figcaption className="legend">
              <label className="legend-item">
                <input type="checkbox" checked={showGallery} onChange={(e) => setShowGallery(e.target.checked)} />
                <svg className="swatch swatch-spot" viewBox="0 0 14 14" aria-hidden="true">
                  <g className="image-spot" transform="translate(7 7)">
                    <rect x={-3.5} y={-3.5} width={7} height={7} transform="rotate(45)" />
                  </g>
                </svg>
                Published StriX images ({GALLERY.length})
              </label>
              <span className="legend-item">
                <svg className="swatch" viewBox="0 0 28 14" aria-hidden="true">
                  <line className="orbit-current" x1="1" y1="7" x2="27" y2="7" />
                </svg>
                Current orbit
              </span>
              <span className="legend-item">
                <svg className="swatch" viewBox="0 0 28 14" aria-hidden="true">
                  <line className="orbit-upcoming" x1="1" y1="7" x2="27" y2="7" />
                </svg>
                Upcoming orbit
              </span>
              <span className="legend-item">
                <svg className="swatch" viewBox="0 0 28 14" aria-hidden="true">
                  <rect className="footprint footprint-uplink" x="1" y="1" width="26" height="12" rx="6" />
                </svg>
                Uplink footprint: {selected.name} is {UPLINK_MIN_ELEVATION_DEG}° or more above the horizon
              </span>
              <span className="legend-item">
                <svg className="swatch" viewBox="0 0 28 14" aria-hidden="true">
                  <rect className="footprint footprint-downlink" x="1" y="1" width="26" height="12" rx="6" />
                </svg>
                Downlink footprint: {DOWNLINK_MIN_ELEVATION_DEG}° or more
              </span>
            </figcaption>
          </figure>

          <section className="panel timeline-panel" aria-labelledby="timeline-heading">
            <div className="panel-head">
              <h2 id="timeline-heading">Contacts with {station.name}</h2>
              <label className="station-picker">
                Ground station
                <select value={station.id} onChange={(e) => setStationId(e.target.value)}>
                  {STATIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <ContactTimeline
              satellites={shown}
              passes={passes}
              stationName={station.name}
              startMs={windowStart}
              endMs={windowEnd}
              now={now}
              selectedId={selected.id}
              onSelectSatellite={setSelectedId}
              onJump={clock.jumpTo}
            />
          </section>
        </div>

        <aside className="side">
          <FleetList
            rows={rows}
            selectedId={selected.id}
            onSelect={setSelectedId}
            showFleet={showFleet}
            onShowFleet={setShowFleet}
          />
          <SatellitePanel
            sat={selected}
            state={selectedRow?.state ?? null}
            stationName={station.name}
            passes={passes.filter((p) => p.satId === selected.id)}
            nextOrbitAt={revolution?.end ?? null}
            now={now}
            onJump={clock.jumpTo}
          />
        </aside>
      </main>

      <footer className="colophon">
        <p>
          Orbit data: CelesTrak public elements,{' '}
          {tleSet.source === 'live'
            ? `fetched ${utcDate(tleSet.fetchedAt)} ${utcTime(tleSet.fetchedAt)} UTC`
            : `saved copy from ${utcDate(tleSet.fetchedAt)}`}
          . Positions use the SGP4 model; contacts count from {MIN_ELEVATION_DEG}° above the horizon. Ground stations
          are example sites. An independent project, not affiliated with Synspective.
        </p>
      </footer>
    </div>
  )
}
