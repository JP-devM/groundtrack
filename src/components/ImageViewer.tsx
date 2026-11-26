import { useCallback, useEffect, useRef, useState, type PointerEvent, type WheelEvent } from 'react'
import type { GalleryEntry } from '../data/gallery'
import { latitude, longitude, utcDate } from '../lib/format'
import { fullImageUrl } from '../lib/galleryImage'
import { actualSize, cropTo, fitView, rectFromCorners, zoomAt, type Rect, type Size, type View } from '../lib/viewer'

interface Props {
  entry: GalleryEntry
  onExit: () => void
}

type Tool = 'move' | 'crop'

const ZOOM_STEP = 1.25
const PAN_STEP = 80
const SMALLEST_CROP = 12
const screenSize = (): Size => ({ w: window.innerWidth, h: window.innerHeight })

/**
 * Full-screen viewer for one radar image: zoom, move, crop, rotate, and adjust how it is shown.
 * Nothing here alters or saves the picture; every tool only changes the view.
 */
export function ImageViewer({ entry, onExit }: Props) {
  const [src, setSrc] = useState(() => fullImageUrl(entry.thumbnail))
  const [image, setImage] = useState<Size | null>(null)
  const [screen, setScreen] = useState<Size>(screenSize)
  /** The visible window onto the picture: the whole screen, or a smaller area after a crop. */
  const [frame, setFrame] = useState<Size>(screenSize)
  const [view, setView] = useState<View>({ scale: 1, tx: 0, ty: 0 })
  const [rotation, setRotation] = useState(0)
  const [tool, setTool] = useState<Tool>('move')
  const [inverted, setInverted] = useState(false)
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [selection, setSelection] = useState<Rect | null>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  // Measure the viewer itself rather than the window: while the browser is still switching into
  // full screen the two can disagree, which would leave the picture off-centre.
  const viewerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = viewerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (el.clientWidth > 0 && el.clientHeight > 0) setScreen({ w: el.clientWidth, h: el.clientHeight })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Start from the whole picture whenever it loads or the screen changes size.
  // (rotation is left out on purpose: turning the picture refits it in its own handler.)
  useEffect(() => {
    if (!image) return
    setFrame(screen) // oxlint-disable-line react-hooks/set-state-in-effect
    setView(fitView(image, screen, rotation))
  }, [image, screen]) // oxlint-disable-line react-hooks/exhaustive-deps

  const cropped = frame.w !== screen.w || frame.h !== screen.h

  const zoom = useCallback((factor: number) => setView((v) => zoomAt(v, factor, { x: frame.w / 2, y: frame.h / 2 })), [frame])
  const fit = useCallback(() => {
    if (image) setView(fitView(image, frame, rotation))
  }, [image, frame, rotation])
  const showActualSize = useCallback(() => setView((v) => actualSize(v, frame)), [frame])
  const rotate = useCallback(() => {
    if (!image) return
    const next = (rotation + 90) % 360
    setRotation(next)
    setView(fitView(image, frame, next))
  }, [image, frame, rotation])
  const reset = useCallback(() => {
    setRotation(0)
    setInverted(false)
    setBrightness(100)
    setContrast(100)
    setTool('move')
    setSelection(null)
    setFrame(screen)
    if (image) setView(fitView(image, screen, 0))
  }, [image, screen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Leave the arrow keys to a focused slider.
      if (e.target instanceof HTMLInputElement) return
      const pan = (dx: number, dy: number) => setView((v) => ({ ...v, tx: v.tx + dx, ty: v.ty + dy }))
      switch (e.key) {
        case '+':
        case '=':
          return zoom(ZOOM_STEP)
        case '-':
          return zoom(1 / ZOOM_STEP)
        case '0':
          return fit()
        case '1':
          return showActualSize()
        case 'r':
          return rotate()
        case 'i':
          return setInverted((v) => !v)
        case 'c':
          return setTool((t) => (t === 'crop' ? 'move' : 'crop'))
        case 'ArrowLeft':
          return pan(PAN_STEP, 0)
        case 'ArrowRight':
          return pan(-PAN_STEP, 0)
        case 'ArrowUp':
          return pan(0, PAN_STEP)
        case 'ArrowDown':
          return pan(0, -PAN_STEP)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom, fit, showActualSize, rotate])

  const pointInFrame = (e: { clientX: number; clientY: number }) => {
    const box = frameRef.current!.getBoundingClientRect()
    return { x: e.clientX - box.left, y: e.clientY - box.top }
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    drag.current = pointInFrame(e)
    if (tool === 'crop') setSelection({ ...drag.current, w: 0, h: 0 })
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const from = drag.current
    if (!from) return
    const p = pointInFrame(e)
    if (tool === 'crop') {
      setSelection(rectFromCorners(from, p))
    } else {
      setView((v) => ({ ...v, tx: v.tx + p.x - from.x, ty: v.ty + p.y - from.y }))
      drag.current = p
    }
  }
  const onPointerUp = () => {
    drag.current = null
    if (tool !== 'crop') return
    if (selection && selection.w >= SMALLEST_CROP && selection.h >= SMALLEST_CROP) {
      const next = cropTo(view, selection, screen)
      setFrame(next.frame)
      setView(next.view)
      setTool('move')
    }
    setSelection(null)
  }
  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    const p = pointInFrame(e)
    setView((v) => zoomAt(v, e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, p))
  }

  const cx = image ? image.w / 2 : 0
  const cy = image ? image.h / 2 : 0

  return (
    <div className="viewer" ref={viewerRef}>
      <div
        ref={frameRef}
        className={['viewer-frame', cropped ? 'is-cropped' : '', tool === 'crop' ? 'is-cropping' : ''].join(' ')}
        style={{ width: frame.w, height: frame.h, left: (screen.w - frame.w) / 2, top: (screen.h - frame.h) / 2 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <img
          src={src}
          alt={`Radar image of ${entry.title}`}
          referrerPolicy="no-referrer"
          draggable={false}
          onLoad={(e) => setImage({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
          // If the full-size picture won't load, use the preview.
          onError={() => src !== entry.thumbnail && setSrc(entry.thumbnail)}
          style={
            image
              ? {
                  width: image.w,
                  height: image.h,
                  transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale}) translate(${cx}px, ${cy}px) rotate(${rotation}deg) translate(${-cx}px, ${-cy}px)`,
                  filter: `brightness(${brightness}%) contrast(${contrast}%) invert(${inverted ? 1 : 0})`,
                  // Past 3x, show the picture's real pixels rather than a smoothed blur.
                  imageRendering: view.scale > 3 ? 'pixelated' : 'auto',
                }
              : { visibility: 'hidden' }
          }
        />
        {selection && (
          <div
            className="viewer-selection"
            style={{ left: selection.x, top: selection.y, width: selection.w, height: selection.h }}
          />
        )}
      </div>

      {!image && <p className="viewer-loading">Loading the picture…</p>}

      <div className="viewer-toolbar" role="toolbar" aria-label="Image tools">
        <button type="button" onClick={() => zoom(1 / ZOOM_STEP)} aria-label="Zoom out" title="Zoom out (−)">
          −
        </button>
        <output className="viewer-zoom" aria-label="Magnification">
          {Math.round(view.scale * 100)}%
        </output>
        <button type="button" onClick={() => zoom(ZOOM_STEP)} aria-label="Zoom in" title="Zoom in (+)">
          +
        </button>
        <button type="button" onClick={fit} title="Show the whole picture (0)">
          Fit
        </button>
        <button type="button" onClick={showActualSize} title="One picture pixel per screen pixel (1)">
          Actual size
        </button>
        <button
          type="button"
          aria-pressed={tool === 'crop'}
          onClick={() => setTool(tool === 'crop' ? 'move' : 'crop')}
          title="Drag a box to keep only that area (C)"
        >
          Crop
        </button>
        <button type="button" onClick={rotate} title="Turn a quarter turn clockwise (R)">
          Rotate
        </button>
        <button
          type="button"
          aria-pressed={inverted}
          onClick={() => setInverted(!inverted)}
          title="Swap light and dark (I)"
        >
          Invert
        </button>
        <label>
          Brightness
          <input
            type="range"
            min={50}
            max={300}
            step={5}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
          />
        </label>
        <label>
          Contrast
          <input
            type="range"
            min={50}
            max={300}
            step={5}
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
          />
        </label>
        <button type="button" onClick={reset} title="Undo every change, including the crop">
          Reset
        </button>
      </div>

      <p className="image-caption">
        {tool === 'crop'
          ? 'Drag a box around the area to keep.'
          : `${entry.title}${entry.date ? `, ${utcDate(Date.parse(entry.date))}` : ''}. Near ${latitude(entry.lat)}, ${longitude(entry.lon)}. Image: Synspective`}
      </p>
      <button type="button" className="fullscreen-tab" onClick={onExit}>
        Exit full screen
      </button>
    </div>
  )
}
