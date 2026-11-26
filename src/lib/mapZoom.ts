/**
 * Zoom and pan for the world map. A view magnifies the whole-world drawing by `k` and then
 * shifts it by (x, y), in the map's own drawing units. k = 1 with no shift is the whole world.
 */
export interface MapView {
  k: number
  x: number
  y: number
}

export interface MapSize {
  w: number
  h: number
}

export const WHOLE_WORLD: MapView = { k: 1, x: 0, y: 0 }
export const MAX_MAP_ZOOM = 16

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Keeps the zoom in range and stops the map being dragged so far that empty space shows. */
export function clampMapView(view: MapView, size: MapSize): MapView {
  const k = clamp(view.k, 1, MAX_MAP_ZOOM)
  return { k, x: clamp(view.x, size.w - size.w * k, 0), y: clamp(view.y, size.h - size.h * k, 0) }
}

/** Zooms by `factor`, keeping the place under `point` where it is whenever the edges allow. */
export function zoomMapAt(view: MapView, factor: number, point: { x: number; y: number }, size: MapSize): MapView {
  const k = clamp(view.k * factor, 1, MAX_MAP_ZOOM)
  const r = k / view.k
  return clampMapView({ k, x: point.x - (point.x - view.x) * r, y: point.y - (point.y - view.y) * r }, size)
}

export function panMap(view: MapView, dx: number, dy: number, size: MapSize): MapView {
  return clampMapView({ ...view, x: view.x + dx, y: view.y + dy }, size)
}
