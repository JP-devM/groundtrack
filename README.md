# Groundtrack

A contact-planning console for Synspective's StriX radar satellites, built from public orbit data.
It answers the questions an operator asks through the day: where is each satellite now, where is it
going, and when can a ground station next talk to it?

An independent personal project. It is not affiliated with Synspective, and the ground stations are
example sites, not a real network.

## What it shows

- **Ground tracks.** Each satellite's position and the next 15 minutes of its path, computed in the
  browser from two-line elements with the SGP4 model. The selected satellite shows most of an
  orbit ahead, a quarter orbit behind it, and its uplink and downlink footprints.
- **Day and night.** The night side of the Earth is shaded, and a satellite in Earth's shadow is
  drawn hollow.
- **Contact timeline.** Every pass over the chosen ground station for the next 24 hours, one row per
  satellite. Bar height shows how high the pass climbs. Choosing a bar moves the clock to the start
  of that contact.
- **Published images.** Diamonds mark the places in Synspective's public Data Gallery. Each opens a
  card with the radar picture, and a full-screen viewer with zoom, crop, rotate, invert, brightness
  and contrast. The pictures are loaded from Synspective's site and are theirs; none are stored here.
- **A clock you can drive.** Track current UTC, run at any rate from 1× to 600×, pause, or jump anywhere in the
  window.

## Run it

```
npm install
npm run dev      # development server
npm test         # unit and component tests
npm run build    # type-check and production build
```

## How it's put together

| Path | Role |
| --- | --- |
| `src/lib/orbit.ts` | Pure functions: element parsing, propagation, ground tracks, sun position, pass prediction |
| `src/hooks/useSimClock.ts` | The simulated clock (live, scaled, paused, jump) |
| `src/components/WorldMap.tsx` | SVG map drawn with d3-geo |
| `src/components/ContactTimeline.tsx` | SVG pass timeline, usable by keyboard |
| `src/data/tle.ts` | Saved element set, plus a cached refresh from CelesTrak |

The orbit maths has no dependency on React, so it is tested directly against known physical limits:
a track never exceeds its inclination, a polar satellite passes a polar station on most orbits, and
the sun sits on the equator at the equinox. The timeline is tested through its accessible roles.

## Data

Orbit elements come from [CelesTrak](https://celestrak.org). The app keeps a saved copy so it works
offline, and refreshes at most once every two hours. Coastlines are from Natural Earth via
`world-atlas`.
