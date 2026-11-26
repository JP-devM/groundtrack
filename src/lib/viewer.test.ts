import { describe, expect, it } from 'vitest'
import { MAX_SCALE, actualSize, cropTo, fitView, rectFromCorners, zoomAt, type View } from './viewer'

const image = { w: 2000, h: 1000 }
const screen = { w: 1000, h: 800 }

/** Which picture pixel is under a screen point. */
const pictureAt = (v: View, p: { x: number; y: number }) => ({ x: (p.x - v.tx) / v.scale, y: (p.y - v.ty) / v.scale })

describe('fitView', () => {
  it('shows the whole picture, centred', () => {
    const v = fitView(image, screen)
    expect(v.scale).toBe(0.5)
    expect(v.tx).toBe(0)
    expect(v.ty).toBe(150)
  })

  it('fits the turned shape when the picture is on its side', () => {
    const v = fitView(image, screen, 90)
    expect(v.scale).toBe(0.4)
    // still centred on the picture's own centre
    expect(pictureAt(v, { x: 500, y: 400 })).toEqual({ x: 1000, y: 500 })
  })
})

describe('zoomAt', () => {
  it('keeps the picture under the pointer where it is', () => {
    const before = fitView(image, screen)
    const pointer = { x: 320, y: 410 }
    const after = zoomAt(before, 3, pointer)
    expect(after.scale).toBeCloseTo(1.5)
    expect(pictureAt(after, pointer).x).toBeCloseTo(pictureAt(before, pointer).x)
    expect(pictureAt(after, pointer).y).toBeCloseTo(pictureAt(before, pointer).y)
  })

  it('stops at the maximum magnification', () => {
    expect(zoomAt(fitView(image, screen), 1e6, { x: 0, y: 0 }).scale).toBe(MAX_SCALE)
  })
})

describe('actualSize', () => {
  it('shows one picture pixel per screen pixel around the same centre', () => {
    const before = fitView(image, screen)
    const after = actualSize(before, screen)
    expect(after.scale).toBeCloseTo(1)
    expect(pictureAt(after, { x: 500, y: 400 }).x).toBeCloseTo(1000)
    expect(pictureAt(after, { x: 500, y: 400 }).y).toBeCloseTo(500)
  })
})

describe('cropTo', () => {
  const before = fitView(image, screen)
  const selection = { x: 200, y: 300, w: 400, h: 200 }
  const { view, frame } = cropTo(before, selection, screen)

  it('enlarges the selection to fill the screen in its own shape', () => {
    expect(frame).toEqual({ w: 1000, h: 500 })
  })

  it('keeps exactly the selected part of the picture in the new frame', () => {
    expect(pictureAt(view, { x: 0, y: 0 })).toEqual(pictureAt(before, { x: 200, y: 300 }))
    const corner = pictureAt(view, { x: frame.w, y: frame.h })
    expect(corner.x).toBeCloseTo(pictureAt(before, { x: 600, y: 500 }).x)
    expect(corner.y).toBeCloseTo(pictureAt(before, { x: 600, y: 500 }).y)
  })
})

describe('rectFromCorners', () => {
  it('gives the same rectangle whichever way it was dragged', () => {
    const r = { x: 10, y: 20, w: 30, h: 40 }
    expect(rectFromCorners({ x: 10, y: 20 }, { x: 40, y: 60 })).toEqual(r)
    expect(rectFromCorners({ x: 40, y: 60 }, { x: 10, y: 20 })).toEqual(r)
  })
})
