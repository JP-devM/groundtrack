const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const pad = (n: number) => String(n).padStart(2, '0')

/** 14:02:10 */
export function utcTime(ms: number): string {
  const d = new Date(ms)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

/** 14:02 */
export function utcHourMinute(ms: number): string {
  const d = new Date(ms)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/** 26 Nov 2026 */
export function utcDate(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/** 26 Nov */
export function utcDayMonth(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

/** 1:04:09 or 04:09 */
export function duration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function latitude(deg: number): string {
  return `${Math.abs(deg).toFixed(2)}° ${deg >= 0 ? 'N' : 'S'}`
}

export function longitude(deg: number): string {
  return `${Math.abs(deg).toFixed(2)}° ${deg >= 0 ? 'E' : 'W'}`
}

/** 45 s, 12 min, 3 h 05 min, 2 days 4 h: the size of a gap in time, ignoring its direction. */
export function timeSpan(ms: number): string {
  const s = Math.round(Math.abs(ms) / 1000)
  if (s < 60) return `${s} s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  if (m < 24 * 60) return `${Math.floor(m / 60)} h ${pad(m % 60)} min`
  const h = Math.round(m / 60)
  return `${Math.floor(h / 24)} days ${h % 24} h`
}

/** Simulated time covered by one second of wall-clock time at a given rate: "1 s", "30 s", "10 min". */
export function simulatedPerSecond(rate: number): string {
  if (rate < 60) return `${rate} s`
  const minutes = rate / 60
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)} min`
}

/** The same instant in the viewer's own time zone, labelled by its UTC offset: 13:15:52 UTC+9 */
export function localTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-GB', { hour12: false, timeZoneName: 'shortOffset' }).replace('GMT', 'UTC')
}
