/** Geometry for the full-screen image viewer. All values are in screen pixels. */

export interface Size {
  w: number
  h: number
}

export interface Rect extends Size {
  x: number
  y: number
}

/** Where the picture sits in its frame: its top-left corner, and how much it is magnified. */
export interface View {
  scale: number
  tx: number
  ty: number
}

export const MIN_SCALE = 0.02
export const MAX_SCALE = 40

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** The view that shows the whole picture, centred, as large as the frame allows. */
export function fitView(image: Size, frame: Size, rotationDeg = 0): View {
  const onItsSide = Math.abs(rotationDeg % 180) === 90
  const boxW = onItsSide ? image.h : image.w
  const boxH = onItsSide ? image.w : image.h
  const scale = Math.min(frame.w / boxW, frame.h / boxH)
  // The picture turns about its own centre, so centring the unrotated picture centres the rotated one.
  return { scale, tx: frame.w / 2 - (image.w / 2) * scale, ty: frame.h / 2 - (image.h / 2) * scale }
}

/** Magnifies by `factor` while keeping the picture under `point` exactly where it is. */
export function zoomAt(view: View, factor: number, point: { x: number; y: number }): View {
  const scale = clamp(view.scale * factor, MIN_SCALE, MAX_SCALE)
  const k = scale / view.scale
  return { scale, tx: point.x - (point.x - view.tx) * k, ty: point.y - (point.y - view.ty) * k }
}

/** One picture pixel per screen pixel, keeping the centre of the frame in place. */
export function actualSize(view: View, frame: Size): View {
  return zoomAt(view, 1 / view.scale, { x: frame.w / 2, y: frame.h / 2 })
}

/**
 * Crops to a selection drawn inside the current frame. The selection becomes the new frame,
 * enlarged to fill as much of the screen as its shape allows, with the same picture content.
 */
export function cropTo(view: View, selection: Rect, screen: Size): { view: View; frame: Size } {
  const k = Math.min(screen.w / selection.w, screen.h / selection.h)
  return {
    frame: { w: selection.w * k, h: selection.h * k },
    view: { scale: view.scale * k, tx: (view.tx - selection.x) * k, ty: (view.ty - selection.y) * k },
  }
}

/** A rectangle from any two opposite corners, whichever way it was dragged. */
export function rectFromCorners(a: { x: number; y: number }, b: { x: number; y: number }): Rect {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }
}
