import { duration, latitude, longitude, utcDayMonth, utcTime } from '../lib/format'
import type { Pass, SatState, Satellite } from '../lib/orbit'

interface Props {
  sat: Satellite
  state: SatState | null
  stationName: string
  /** contacts for this satellite and station, in time order */
  passes: Pass[]
  /** when the current orbit ends and the upcoming one begins */
  nextOrbitAt: number | null
  now: number
  onJump: (ms: number) => void
}

const DAY_MS = 86_400_000

export function SatellitePanel({ sat, state, stationName, passes, nextOrbitAt, now, onJump }: Props) {
  const current = passes.find((p) => p.aos <= now && now <= p.los)
  const upcoming = passes.filter((p) => p.aos > now)
  const ageDays = (now - sat.epochMs) / DAY_MS

  return (
    <section className="panel" aria-labelledby="sat-heading">
      <h2 id="sat-heading">{sat.name}</h2>
      <p className={current ? 'contact-status is-live' : 'contact-status'}>
        {current
          ? `In contact with ${stationName}, ${duration(current.los - now)} left`
          : upcoming[0]
            ? `Next contact with ${stationName} in ${duration(upcoming[0].aos - now)}`
            : `No contact with ${stationName} in this window`}
      </p>

      {nextOrbitAt !== null && (
        <p className="orbit-status">
          Upcoming orbit starts in {duration(nextOrbitAt - now)}.{' '}
          <button type="button" className="link" onClick={() => onJump(nextOrbitAt - 10_000)}>
            Jump to 10 seconds before
          </button>
        </p>
      )}

      {state ? (
        <dl className="readouts">
          <div>
            <dt>Latitude</dt>
            <dd>{latitude(state.lat)}</dd>
          </div>
          <div>
            <dt>Longitude</dt>
            <dd>{longitude(state.lon)}</dd>
          </div>
          <div>
            <dt>Altitude</dt>
            <dd>{state.altKm.toFixed(1)} km</dd>
          </div>
          <div>
            <dt>Speed</dt>
            <dd>{state.speedKmS.toFixed(3)} km/s</dd>
          </div>
          <div>
            <dt>Sunlight</dt>
            <dd>{state.sunlit ? 'Sunlit' : 'In eclipse'}</dd>
          </div>
          <div>
            <dt>Period</dt>
            <dd>{sat.periodMin.toFixed(2)} min</dd>
          </div>
          <div>
            <dt>Inclination</dt>
            <dd>{sat.inclinationDeg.toFixed(2)}°</dd>
          </div>
          <div>
            <dt>Orbit data age</dt>
            <dd className={Math.abs(ageDays) > 7 ? 'is-stale' : undefined}>
              {Math.abs(ageDays).toFixed(1)} days{ageDays < 0 ? ' ahead' : ''}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="empty">
          This satellite's position can't be computed at this time. Its orbit data may be too old for this epoch; sync to current UTC.
        </p>
      )}

      <h3>Upcoming contacts with {stationName}</h3>
      {upcoming.length === 0 ? (
        <p className="empty">None in this window. Pick another station on the map.</p>
      ) : (
        <table className="passes">
          <thead>
            <tr>
              <th scope="col">Starts (UTC)</th>
              <th scope="col">Length</th>
              <th scope="col">Highest</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.slice(0, 6).map((p) => (
              <tr key={p.aos}>
                <td>
                  <button type="button" className="link" onClick={() => onJump(p.aos)}>
                    {utcDayMonth(p.aos)} {utcTime(p.aos)}
                  </button>
                </td>
                <td>{duration(p.los - p.aos)}</td>
                <td>{Math.round(p.maxElDeg)}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
