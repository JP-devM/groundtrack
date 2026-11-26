import type { SatState, Satellite } from '../lib/orbit'

export interface FleetRow {
  sat: Satellite
  state: SatState | null
  inContact: boolean
}

interface Props {
  rows: FleetRow[]
  selectedId: string
  onSelect: (id: string) => void
  /** whether every satellite is drawn on the map and timeline, or only the selected one */
  showFleet: boolean
  onShowFleet: (show: boolean) => void
}

function orbitKind(sat: Satellite): string {
  return sat.inclinationDeg > 90 ? 'Sun-synchronous' : `Inclined ${Math.round(sat.inclinationDeg)}°`
}

function status(row: FleetRow): string {
  if (!row.state) return 'No position'
  if (row.inContact) return 'In contact'
  return row.state.sunlit ? 'Sunlit' : 'Eclipse'
}

export function FleetList({ rows, selectedId, onSelect, showFleet, onShowFleet }: Props) {
  return (
    <section className="panel" aria-labelledby="fleet-heading">
      <div className="panel-head">
        <h2 id="fleet-heading">Fleet</h2>
        <button type="button" className="toggle" aria-pressed={showFleet} onClick={() => onShowFleet(!showFleet)}>
          Whole fleet
        </button>
      </div>
      <p className="fleet-note">
        {showFleet
          ? 'All satellites are on the map and timeline.'
          : 'Only the selected satellite is on the map and timeline.'}
      </p>
      <ul className="fleet">
        {rows.map((row) => (
          <li key={row.sat.id}>
            <button
              type="button"
              className={row.sat.id === selectedId ? 'fleet-row is-active' : 'fleet-row'}
              aria-pressed={row.sat.id === selectedId}
              onClick={() => onSelect(row.sat.id)}
            >
              <span className="fleet-name">{row.sat.name}</span>
              <span className="fleet-kind">{orbitKind(row.sat)}</span>
              <span
                className={[
                  'fleet-status',
                  row.inContact ? 'is-contact' : '',
                  row.state && !row.state.sunlit ? 'is-eclipsed' : '',
                ].join(' ')}
              >
                {status(row)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
