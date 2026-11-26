// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { GalleryEntry } from '../data/gallery'
import { ImageViewer } from './ImageViewer'

const busan: GalleryEntry = {
  id: 'busan-south-korea',
  title: 'Busan/South Korea',
  date: '2025-03-04',
  mode: 'Staring Spotlight 4',
  lat: 35.1,
  lon: 129.04,
  thumbnail: 'https://images.example/files_thumbnail/busan.jpg/500.jpg',
}

/** Renders the viewer and pretends a 2048 x 1024 picture has loaded. jsdom's screen is 1024 x 768. */
function setup() {
  const onExit = vi.fn()
  render(<ImageViewer entry={busan} onExit={onExit} />)
  const img = screen.getByAltText('Radar image of Busan/South Korea') as HTMLImageElement
  Object.defineProperty(img, 'naturalWidth', { value: 2048 })
  Object.defineProperty(img, 'naturalHeight', { value: 1024 })
  fireEvent.load(img)
  return { img, onExit }
}

const magnification = () => screen.getByLabelText('Magnification').textContent

afterEach(cleanup)

describe('ImageViewer', () => {
  it('asks for the full-size picture and falls back to the preview if that fails', () => {
    render(<ImageViewer entry={busan} onExit={() => {}} />)
    const img = screen.getByAltText('Radar image of Busan/South Korea') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('https://images.example/files/busan.jpg')
    fireEvent.error(img)
    expect(img.getAttribute('src')).toBe(busan.thumbnail)
  })

  it('starts with the whole picture fitted to the screen', () => {
    setup()
    expect(magnification()).toBe('50%')
  })

  it('zooms with the buttons and the keyboard, and returns with Fit', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(magnification()).toBe('63%')
    fireEvent.keyDown(window, { key: '-' })
    expect(magnification()).toBe('50%')
    fireEvent.click(screen.getByRole('button', { name: 'Actual size' }))
    expect(magnification()).toBe('100%')
    fireEvent.click(screen.getByRole('button', { name: 'Fit' }))
    expect(magnification()).toBe('50%')
  })

  it('refits when the picture is turned on its side', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }))
    // 1024 wide by 2048 tall now has to fit 768 of height
    expect(magnification()).toBe('38%')
  })

  it('applies invert, brightness and contrast to how the picture is shown', () => {
    const { img } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Invert' }))
    fireEvent.change(screen.getByLabelText('Brightness'), { target: { value: '150' } })
    fireEvent.change(screen.getByLabelText('Contrast'), { target: { value: '200' } })
    expect(img.style.filter).toBe('brightness(150%) contrast(200%) invert(1)')
    expect(screen.getByRole('button', { name: 'Invert' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('explains the crop tool while it is active', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Crop' }))
    expect(screen.getByText('Drag a box around the area to keep.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Crop' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('undoes everything with Reset', () => {
    const { img } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    fireEvent.click(screen.getByRole('button', { name: 'Invert' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rotate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(magnification()).toBe('50%')
    expect(img.style.filter).toBe('brightness(100%) contrast(100%) invert(0)')
    expect(img.style.transform).toContain('rotate(0deg)')
  })

  it('leaves full screen from its corner tab', () => {
    const { onExit } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Exit full screen' }))
    expect(onExit).toHaveBeenCalled()
  })
})
