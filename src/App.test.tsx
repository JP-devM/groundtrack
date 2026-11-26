// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

beforeEach(() => {
  // Keep the app on its saved orbit data instead of calling out to the network.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))))
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const onMap = () => within(screen.getByRole('group', { name: /World map/ })).queryAllByRole('button', { name: /^Satellite / })
const onTimeline = () => screen.getByRole('group', { name: /^Contacts with/ }).querySelectorAll('.row').length

describe('fleet visibility', () => {
  it('lists the whole fleet but draws only the selected satellite by default', () => {
    render(<App />)
    expect(within(screen.getByRole('list')).getAllByRole('button')).toHaveLength(8)
    expect(onMap().map((b) => b.getAttribute('aria-label'))).toEqual([expect.stringMatching(/^Satellite STRIX-1,/)])
    expect(onTimeline()).toBe(1)
  })

  it('follows the selection when another satellite is chosen', () => {
    render(<App />)
    fireEvent.click(within(screen.getByRole('list')).getByRole('button', { name: /STRIX-5/ }))
    expect(onMap().map((b) => b.getAttribute('aria-label'))).toEqual([expect.stringMatching(/^Satellite STRIX-5,/)])
    expect(screen.getByRole('heading', { level: 2, name: 'STRIX-5' })).toBeTruthy()
  })

  it('draws every satellite when Whole fleet is switched on, and one again when switched off', () => {
    render(<App />)
    const toggle = screen.getByRole('button', { name: 'Whole fleet' })
    fireEvent.click(toggle)
    expect(toggle.getAttribute('aria-pressed')).toBe('true')
    expect(onMap()).toHaveLength(8)
    expect(onTimeline()).toBe(8)
    fireEvent.click(toggle)
    expect(onMap()).toHaveLength(1)
    expect(onTimeline()).toBe(1)
  })
})
