import { parseTleText, type Tle } from '../lib/orbit'

export interface TleSet {
  tles: Tle[]
  source: 'snapshot' | 'live'
  fetchedAt: number
}

/** Public elements from CelesTrak, captured 26 Nov 2026. Used until a fresh set loads. */
const SNAPSHOT_TEXT = `STRIX-1
1 53815U 22113A   26329.95300659  .00017701  00000+0  34682-3 0  9991
2 53815  97.4294  35.5080 0003702  29.5588 330.5871 15.47436849232396
STRIX-3
1 59224U 24047A   26329.94211845  .00003701  00000+0  16768-3 0  9996
2 59224  97.6805 308.4323 0011287 214.4898 145.5606 15.21468047149321
STRIX-4
1 60352U 24137A   26329.78855081  .00012634  00000+0  33941-3 0  9995
2 60352  43.0161  82.1976 0018085 292.8004  67.0941 15.37692785128857
STRIX-2
1 62406U 24248A   26329.93229596  .00002416  00000+0  15047-3 0  9997
2 62406  97.6510 284.9856 0016056 135.7308 224.5209 15.10444420105998
STRIX-5
1 65971U 25229A   26329.70777411  .00001426  00000+0  10991-3 0  9999
2 65971  41.9269 111.0441 0034514  31.3181 328.9692 15.05458327 61317
STRIX-6
1 68291U 26056A   26329.64874840  .00001765  00000+0  15157-3 0  9998
2 68291  50.2834 305.6788 0015865 148.2895 211.9014 15.02453469 37523
STRIX-7
1 69177U 26112A   26329.73198145  .00002011  00000+0  16598-3 0  9997
2 69177  44.9082  63.3508 0025647 234.3044 125.5440 15.02406425 28165
STRIX-8
1 69701U 26146A   26329.75663488  .00002329  00000+0  17309-3 0  9999
2 69701  41.9906 352.7158 0006652 195.3788 164.6838 15.05322787 22904`

export const SNAPSHOT: TleSet = {
  tles: parseTleText(SNAPSHOT_TEXT),
  source: 'snapshot',
  fetchedAt: Date.UTC(2026, 10, 26),
}

const LIVE_URL = 'https://celestrak.org/NORAD/elements/gp.php?NAME=STRIX&FORMAT=tle'
const CACHE_KEY = 'groundtrack.tles'
/** CelesTrak updates a few times a day and asks clients not to poll more often. */
const CACHE_MS = 2 * 60 * 60 * 1000

/** Fetches current elements, reusing a recent browser copy. Resolves to null on any failure. */
export async function loadLiveTles(now = Date.now()): Promise<TleSet | null> {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const { text, fetchedAt } = JSON.parse(cached) as { text: string; fetchedAt: number }
      const tles = parseTleText(text)
      if (now - fetchedAt < CACHE_MS && tles.length > 0) return { tles, source: 'live', fetchedAt }
    }
  } catch {
    // unreadable cache: fall through to the network
  }
  try {
    const res = await fetch(LIVE_URL)
    if (!res.ok) return null
    const text = await res.text()
    const tles = parseTleText(text)
    if (tles.length === 0) return null
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ text, fetchedAt: now }))
    } catch {
      // storage unavailable: still use the fresh set
    }
    return { tles, source: 'live', fetchedAt: now }
  } catch {
    return null
  }
}
