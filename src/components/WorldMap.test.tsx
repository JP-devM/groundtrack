// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { GalleryEntry } from '../data/gallery'
import { fullImageUrl } from '../lib/galleryImage'
import { WorldMap } from './WorldMap'

const fuji: GalleryEntry = {
  id: 'mt-fuji-japan',
  title: 'Mt. Fuji/Japan',
  date: '2025-01-15',
  mode: 'Sliding Spotlight 1',
  lat: 35.36,
  lon: 138.73,
  thumbnail: 'https://images.example/fuji.png',
}

function setup(gallery: GalleryEntry[]) {
  render(
    <WorldMap
      satellites={[]}
      selectedId=""
      onSelectSatellite={() => {}}
      orbit={null}
      gallery={gallery}
      stations={[]}
      stationId=""
      onSelectStation={() => {}}
      sun={[130, -21]}
    />,
  )
}

afterEach(cleanup)

describe('WorldMap image locations', () => {
  it('opens a card with the preview picture, details and coordinates, and no link', () => {
    setup([fuji])
    fireEvent.click(screen.getByRole('button', { name: 'Radar image of Mt. Fuji/Japan' }))
    const card = screen.getByRole('dialog')
    expect(screen.getByRole('img', { name: 'Radar image of Mt. Fuji/Japan' }).getAttribute('src')).toBe(fuji.thumbnail)
    expect(card.textContent).toContain('15 Jan 2025')
    expect(card.textContent).toContain('Sliding Spotlight 1')
    expect(card.textContent).toContain('35.36° N, 138.73° E')
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('says so when the preview picture fails to load', () => {
    setup([fuji])
    fireEvent.click(screen.getByRole('button', { name: 'Radar image of Mt. Fuji/Japan' }))
    fireEvent.error(screen.getByRole('img', { name: 'Radar image of Mt. Fuji/Japan' }))
    expect(screen.getByText("The preview picture couldn't be loaded.")).toBeTruthy()
  })

  it('closes the card with the Close button or the Escape key', () => {
    setup([fuji])
    const spot = screen.getByRole('button', { name: 'Radar image of Mt. Fuji/Japan' })
    fireEvent.click(spot)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(spot)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('derives the full-size picture address from the preview address', () => {
    expect(fullImageUrl('https://www.synspective.com/files_thumbnail/co/gallery/Busan_KV.jpg/500.jpg')).toBe(
      'https://www.synspective.com/files/co/gallery/Busan_KV.jpg',
    )
    expect(fullImageUrl('https://www.synspective.com/files_thumbnail/co/gallery/Cushing-usa.png/500.png')).toBe(
      'https://www.synspective.com/files/co/gallery/Cushing-usa.png',
    )
  })

  it('shows no image markers when the list is empty', () => {
    setup([])
    expect(screen.queryByRole('button', { name: /Radar image/ })).toBeNull()
  })
})
