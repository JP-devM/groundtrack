import { describe, expect, it } from 'vitest'
import { MAX_MAP_ZOOM, WHOLE_WORLD, panMap, zoomMapAt, type MapView } from './mapZoom'

const size = { w: 1000, h: 500 }
/** Where a whole-world drawing position ends up on screen under a view. */
const onScreen = (v: MapView, p: { x: number; y: number }) => ({ x: p.x * v.k + v.x, y: p.y * v.k + v.y })

describe('zoomMapAt', () => {
  it('keeps the place under the pointer where it is', () => {
    const japan = { x: 885, y: 150 }
    const v = zoomMapAt(WHOLE_WORLD, 4, japan, size)
    expect(v.k).toBe(4)
    expect(onScreen(v, japan)).toEqual(japan)
  })

  it('spreads neighbouring places apart by the zoom factor', () => {
    const v = zoomMapAt(WHOLE_WORLD, 8, { x: 885, y: 150 }, size)
    const a = onScreen(v, { x: 885, y: 150 })
    const b = onScreen(v, { x: 887, y: 151 })
    expect(b.x - a.x).toBeCloseTo(16)
    expect(b.y - a.y).toBeCloseTo(8)
  })

  it('never zooms out past the whole world or in past the limit', () => {
    expect(zoomMapAt(WHOLE_WORLD, 0.5, { x: 10, y: 10 }, size)).toEqual(WHOLE_WORLD)
    expect(zoomMapAt(WHOLE_WORLD, 1e6, { x: 10, y: 10 }, size).k).toBe(MAX_MAP_ZOOM)
  })

  it('returns to the whole world when zoomed all the way back out', () => {
    const zoomed = zoomMapAt(WHOLE_WORLD, 4, { x: 885, y: 150 }, size)
    expect(zoomMapAt(zoomed, 1 / 4, { x: 300, y: 300 }, size)).toEqual(WHOLE_WORLD)
  })
})

describe('panMap', () => {
  const zoomed = zoomMapAt(WHOLE_WORLD, 2, { x: 500, y: 250 }, size)

  it('moves the map with the drag', () => {
    const v = panMap(zoomed, -100, 50, size)
    expect(v.x).toBe(zoomed.x - 100)
    expect(v.y).toBe(zoomed.y + 50)
  })

  it('stops at the edge of the map rather than showing empty space', () => {
    expect(panMap(zoomed, 5000, 5000, size)).toMatchObject({ x: 0, y: 0 })
    expect(panMap(zoomed, -5000, -5000, size)).toMatchObject({ x: -1000, y: -500 })
  })

  it('does nothing at whole-world zoom', () => {
    expect(panMap(WHOLE_WORLD, 200, 100, size)).toEqual(WHOLE_WORLD)
  })
})
