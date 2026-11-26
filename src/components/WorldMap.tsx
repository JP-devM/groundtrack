import { geoCircle, geoEquirectangular, geoGraticule10, geoPath } from 'd3-geo'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { feature } from 'topojson-client'
import landTopology from 'world-atlas/land-110m.json'
import type { GalleryEntry } from '../data/gallery'
import { DOWNLINK_MIN_ELEVATION_DEG, UPLINK_MIN_ELEVATION_DEG } from '../data/links'
import { latitude, longitude, utcDate } from '../lib/format'
import { MAX_MAP_ZOOM, WHOLE_WORLD, panMap, zoomMapAt, type MapView } from '../lib/mapZoom'
import { ImageViewer } from './ImageViewer'
import { footprintRadiusDeg, type LonLat, type SatState, type Satellite, type Station } from '../lib/orbit'

const W = 1000
const H = 500
const SIZE = { w: W, h: H }
/** Projection scale at which the whole world exactly fills the drawing. */
const WORLD_SCALE = geoEquirectangular().fitSize([W, H], { type: 'Sphere' }).scale()
const LAND = feature(landTopology, landTopology.objects.land)
const GRATICULE = geoGraticule10()
const WHEEL_ZOOM = 1.3
const BUTTON_ZOOM = 2
/** A press that moves further than this is a drag to move the map, not a click. */
const DRAG_THRESHOLD_PX = 4

export interface MapSatellite {
  sat: Satellite
  state: SatState
  /** a short lead showing where an unselected satellite is heading */
  ahead: LonLat[]
  inContact: boolean
}

/** The selected satellite's current orbit and the one that follows it. */
export interface OrbitView {
  /** current orbit, from its start to the satellite */
  travelled: LonLat[]
  /** current orbit, from the satellite to its end */
  remaining: LonLat[]
  upcoming: LonLat[]
  /** where the upcoming orbit begins */
  upcomingHead: LonLat
  /** true for a moment after the upcoming orbit has become the current one */
  handover: boolean
}

interface Props {
  satellites: MapSatellite[]
  selectedId: string
  onSelectSatellite: (id: string) => void
  orbit: OrbitView | null
  /** places with a published radar image; pass an empty list to hide them */
  gallery: GalleryEntry[]
  stations: Station[]
  stationId: string
  onSelectStation: (id: string) => void
  sun: LonLat
}

const nearRightEdge = (x: number) => x > W - 110

/**
 * The picture for a gallery entry, loaded from the publisher's server when the card opens.
 * The tab in its corner shows it full screen, where the full-size picture replaces the preview.
 */
function ImageThumbnail({ entry }: { entry: GalleryEntry }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const canFullScreen = typeof document !== 'undefined' && document.fullscreenEnabled === true
  useEffect(() => {
    const onChange = () => setIsFullScreen(document.fullscreenElement === frameRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  if (failed) return <p className="image-card-missing">The preview picture couldn't be loaded.</p>

  return (
    <div className="image-frame" ref={frameRef}>
      {isFullScreen ? (
        <ImageViewer entry={entry} onExit={() => void document.exitFullscreen()} />
      ) : (
        <>
          <img
            className="image-card-thumb"
            src={entry.thumbnail}
            alt={`Radar image of ${entry.title}`}
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
          />
          {canFullScreen && (
            <button type="button" className="fullscreen-tab" onClick={() => void frameRef.current?.requestFullscreen()}>
              Full screen
            </button>
          )}
        </>
      )}
    </div>
  )
}

function activate(fn: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      fn()
    }
  }
}

export function WorldMap({
  satellites,
  selectedId,
  onSelectSatellite,
  orbit,
  gallery,
  stations,
  stationId,
  onSelectStation,
  sun,
}: Props) {
  // Zooming redraws the map at a larger projection scale rather than stretching the drawing,
  // so markers, labels and line weights keep their size while the places they mark spread apart.
  const [view, setView] = useState<MapView>(WHOLE_WORLD)
  const projection = useMemo(
    () =>
      geoEquirectangular()
        .scale(WORLD_SCALE * view.k)
        .translate([(W / 2) * view.k + view.x, (H / 2) * view.k + view.y]),
    [view],
  )
  const path = useMemo(() => geoPath(projection), [projection])
  const landD = useMemo(() => path(LAND) ?? '', [path])
  const graticuleD = useMemo(() => path(GRATICULE) ?? '', [path])
  const line = (coordinates: LonLat[]) => path({ type: 'LineString', coordinates }) ?? ''
  /** Outline of the ground area where the satellite sits at least `minElDeg` above the horizon. */
  const footprint = (state: SatState, minElDeg: number) =>
    path(geoCircle().center([state.lon, state.lat]).radius(footprintRadiusDeg(state.altKm, minElDeg))()) ?? ''

  const svgRef = useRef<SVGSVGElement>(null)
  /** Converts a pointer position on the page to the map's drawing units. */
  const toMap = (e: { clientX: number; clientY: number }) => {
    const box = svgRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - box.left) / box.width) * W, y: ((e.clientY - box.top) / box.height) * H }
  }

  // Wheel zoom needs a non-passive listener so it can stop the page scrolling underneath.
  const zoomLevel = useRef(view.k)
  useEffect(() => {
    zoomLevel.current = view.k
  }, [view.k])
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e: WheelEvent) => {
      // Fully zoomed out and scrolling down: let the page scroll as usual.
      if (zoomLevel.current === 1 && e.deltaY > 0) return
      e.preventDefault()
      const box = svg.getBoundingClientRect()
      const p = { x: ((e.clientX - box.left) / box.width) * W, y: ((e.clientY - box.top) / box.height) * H }
      setView((v) => zoomMapAt(v, e.deltaY < 0 ? WHEEL_ZOOM : 1 / WHEEL_ZOOM, p, SIZE))
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [])

  // Drag to move the map once zoomed in. A drag must not also count as a click on what's under it.
  const press = useRef<{ x: number; y: number; dragging: boolean } | null>(null)
  const swallowClick = useRef(false)
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (view.k > 1) press.current = { x: e.clientX, y: e.clientY, dragging: false }
  }
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const p = press.current
    if (!p) return
    const dx = e.clientX - p.x
    const dy = e.clientY - p.y
    if (!p.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      p.dragging = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
    const box = e.currentTarget.getBoundingClientRect()
    setView((v) => panMap(v, (dx / box.width) * W, (dy / box.height) * H, SIZE))
    p.x = e.clientX
    p.y = e.clientY
  }
  const onPointerUp = () => {
    if (press.current?.dragging) swallowClick.current = true
    press.current = null
  }
  const centre = { x: W / 2, y: H / 2 }

  const nightD = useMemo(() => {
    const night = geoCircle().center([sun[0] + 180, -sun[1]]).radius(90)()
    return path(night) ?? ''
  }, [sun, path])

  const station = stations.find((s) => s.id === stationId)
  const stationXY = station ? projection([station.lon, station.lat]) : null
  const selected = satellites.find((s) => s.sat.id === selectedId)
  const sunXY = projection(sun)
  // The antisolar point: directly opposite the sun, where it is local midnight.
  const antiSunXY = projection([sun[0] > 0 ? sun[0] - 180 : sun[0] + 180, -sun[1]])
  const headXY = orbit ? projection(orbit.upcomingHead) : null
  const handover = orbit?.handover ?? false

  const [openImageId, setOpenImageId] = useState<string | null>(null)
  const openImage = gallery.find((g) => g.id === openImageId) ?? null
  const openAt = openImage ? projection([openImage.lon, openImage.lat]) : null
  // Hide the card while its marker has been moved out of view.
  const openXY = openAt && openAt[0] >= 0 && openAt[0] <= W && openAt[1] >= 0 && openAt[1] <= H ? openAt : null
  useEffect(() => {
    if (openImageId === null) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpenImageId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openImageId])

  return (
    <div className="map-wrap">
      <div className="map-frame">
    <svg
      ref={svgRef}
      className={view.k > 1 ? 'map is-zoomed' : 'map'}
      viewBox={`0 0 ${W} ${H}`}
      role="group"
      aria-label="World map of satellite ground tracks, ground stations and the day-night line"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={(e) => {
        if (!swallowClick.current) return
        swallowClick.current = false
        e.stopPropagation()
      }}
      onDoubleClick={(e) => {
        const p = toMap(e)
        setView((v) => zoomMapAt(v, BUTTON_ZOOM, p, SIZE))
      }}
    >
      <rect className="map-sea" width={W} height={H} onClick={() => setOpenImageId(null)} />
      <path className="map-land" d={landD} />
      <path className="map-graticule" d={graticuleD} />
      <path className="map-night" d={nightD} />
      {sunXY && (
        <>
          <circle className="map-sun" cx={sunXY[0]} cy={sunXY[1]} r={7} />
          <text className="sun-label" x={sunXY[0]} y={sunXY[1] + 22} textAnchor="middle">
            SUB-SOL
          </text>
        </>
      )}
      {antiSunXY && (
        <>
          <circle className="map-antisun" cx={antiSunXY[0]} cy={antiSunXY[1]} r={7} />
          <text className="sun-label" x={antiSunXY[0]} y={antiSunXY[1] + 22} textAnchor="middle">
            ANTI-SOL
          </text>
        </>
      )}

      {satellites.map(({ sat, ahead }) =>
        sat.id === selectedId ? null : <path key={sat.id} className="track" d={line(ahead)} />,
      )}

      {gallery.map((g) => {
        const xy = projection([g.lon, g.lat])
        if (!xy) return null
        const open = g.id === openImageId
        return (
          <g
            key={g.id}
            className={open ? 'image-spot is-open' : 'image-spot'}
            transform={`translate(${xy[0]} ${xy[1]})`}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-label={`Radar image of ${g.title}`}
            onClick={() => setOpenImageId(open ? null : g.id)}
            onKeyDown={activate(() => setOpenImageId(open ? null : g.id))}
          >
            <title>{g.title}</title>
            <circle className="hit" r={8} />
            <rect x={-3.5} y={-3.5} width={7} height={7} transform="rotate(45)" />
          </g>
        )
      })}

      {selected && (
        <>
          <path className="footprint footprint-uplink" d={footprint(selected.state, UPLINK_MIN_ELEVATION_DEG)} />
          <path className="footprint footprint-downlink" d={footprint(selected.state, DOWNLINK_MIN_ELEVATION_DEG)} />
        </>
      )}

      {orbit && (
        <g className={handover ? 'orbit is-handover' : 'orbit'}>
          <path className="orbit-upcoming" d={line(orbit.upcoming)} />
          <path className="orbit-current orbit-travelled" d={line(orbit.travelled)} />
          <path className="orbit-current" d={line(orbit.remaining)} />
          {headXY && (
            <g className="orbit-head" transform={`translate(${headXY[0]} ${headXY[1]})`}>
              <circle r={6} />
              <circle className="orbit-head-core" r={2} />
              {/* Labelled on the left: the satellite's own label sits to the right of this point just after a handover. */}
              <text x={headXY[0] < 110 ? 11 : -11} y={-9} textAnchor={headXY[0] < 110 ? 'start' : 'end'}>
                Upcoming orbit
              </text>
            </g>
          )}
        </g>
      )}

      {stationXY &&
        satellites
          .filter((s) => s.inContact)
          .map(({ sat, state }) => {
            const xy = projection([state.lon, state.lat])
            // Skip links that would be drawn the long way round the map edge.
            if (!xy || Math.abs(xy[0] - stationXY[0]) > W / 2) return null
            return (
              <line
                key={sat.id}
                className="contact-link"
                x1={stationXY[0]}
                y1={stationXY[1]}
                x2={xy[0]}
                y2={xy[1]}
              />
            )
          })}

      {stations.map((s) => {
        const xy = projection([s.lon, s.lat])
        if (!xy) return null
        const active = s.id === stationId
        const flip = nearRightEdge(xy[0])
        return (
          <g
            key={s.id}
            className={active ? 'station is-active' : 'station'}
            transform={`translate(${xy[0]} ${xy[1]})`}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`Ground station ${s.name}`}
            onClick={() => onSelectStation(s.id)}
            onKeyDown={activate(() => onSelectStation(s.id))}
          >
            <circle className="hit" r={14} />
            <path d="M0 -7 L6.5 5 L-6.5 5 Z" />
            <text x={flip ? -10 : 10} y={4} textAnchor={flip ? 'end' : 'start'}>
              {s.name}
            </text>
          </g>
        )
      })}

      {satellites.map(({ sat, state }) => {
        const xy = projection([state.lon, state.lat])
        if (!xy) return null
        const active = sat.id === selectedId
        const cls = ['sat', active ? 'is-active' : '', state.sunlit ? '' : 'is-eclipsed'].filter(Boolean).join(' ')
        const flip = nearRightEdge(xy[0])
        return (
          <g
            key={sat.id}
            className={cls}
            transform={`translate(${xy[0]} ${xy[1]})`}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`Satellite ${sat.name}, ${state.sunlit ? 'sunlit' : 'in eclipse'}`}
            onClick={() => onSelectSatellite(sat.id)}
            onKeyDown={activate(() => onSelectSatellite(sat.id))}
          >
            <circle className="hit" r={14} />
            <circle className="dot" r={active ? 6 : 4.5} />
            <text x={flip ? -10 : 10} y={-8} textAnchor={flip ? 'end' : 'start'}>
              {sat.name}
            </text>
          </g>
        )
      })}
    </svg>

        <div className="map-zoom" role="group" aria-label="Map zoom">
          <button
            type="button"
            aria-label="Zoom in"
            title="Zoom in"
            disabled={view.k >= MAX_MAP_ZOOM}
            onClick={() => setView((v) => zoomMapAt(v, BUTTON_ZOOM, centre, SIZE))}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            title="Zoom out"
            disabled={view.k <= 1}
            onClick={() => setView((v) => zoomMapAt(v, 1 / BUTTON_ZOOM, centre, SIZE))}
          >
            −
          </button>
          <button type="button" disabled={view.k <= 1} onClick={() => setView(WHOLE_WORLD)}>
            Whole world
          </button>
          {view.k > 1 && <output aria-label="Map magnification">{view.k.toFixed(1)}×</output>}
        </div>

      {openImage && openXY && (
        <div
          className={[
            'image-card',
            openXY[0] > W * 0.6 ? 'opens-left' : '',
            openXY[1] > H * 0.5 ? 'opens-up' : '',
          ].join(' ')}
          style={{ left: `${(openXY[0] / W) * 100}%`, top: `${(openXY[1] / H) * 100}%` }}
          role="dialog"
          aria-label={`Radar image of ${openImage.title}`}
        >
          <ImageThumbnail key={openImage.id} entry={openImage} />
          <p className="image-card-title">{openImage.title}</p>
          <dl>
            {openImage.date && (
              <div>
                <dt>Captured</dt>
                <dd>{utcDate(Date.parse(openImage.date))}</dd>
              </div>
            )}
            {openImage.mode && (
              <div>
                <dt>Imaging mode</dt>
                <dd>{openImage.mode}</dd>
              </div>
            )}
            <div>
              <dt>Near</dt>
              <dd>
                {latitude(openImage.lat)}, {longitude(openImage.lon)}
              </dd>
            </div>
          </dl>
          <p className="image-card-credit">Image: Synspective</p>
          <button type="button" className="image-card-close" onClick={() => setOpenImageId(null)}>
            Close
          </button>
        </div>
      )}

      </div>
    </div>
  )
}
