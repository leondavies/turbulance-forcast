import type { RoutePoint } from '../route/greatCircle'
import { PNG } from 'pngjs'

type RGB = readonly [number, number, number]

type WafsRun = {
  /** YYYYMMDD */
  date: string
  /** HH (UTC), typically 00/06/12/18 */
  hour: string
}

export type WafsSampleResult = {
  edrByPoint: number[]
  windSpeedKtByPoint: number[]
  model: {
    source: 'noaa-awc-wafs'
    run: `${string}_${string}` // YYYYMMDD_HH
    /** Forecast hour (e.g. 6 for F06). This may vary by point; this is the most common bucket used. */
    forecastHour: number
    /** WAFS uses pressure levels; for now we sample the level used by AWC UI. */
    levelMb: 301
  }
}

const WAFS_BASE_URL = 'https://aviationweather.gov/data/products/wafs'
const EARTH_RADIUS_M = 6378137
const WEB_MERCATOR_X_MAX = Math.PI * EARTH_RADIUS_M // 20037508.34...

// The AWC WAFS overlay PNGs are 900x600 and appear to cover a Mercator band (~±70.7°).
// We infer the Y extent from the pixel aspect ratio so x/y have the same scale.
function inferredWebMercatorYMax(width: number, height: number) {
  return WEB_MERCATOR_X_MAX * (height / width)
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function toWafsRun(baseTimeUtc: Date): WafsRun {
  const d = new Date(baseTimeUtc)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')

  // WAFS cycles commonly at 00/06/12/18Z. Floor to latest 6-hour cycle.
  const hour = d.getUTCHours()
  const cycle = Math.floor(hour / 6) * 6
  const hh = String(cycle).padStart(2, '0')

  return { date: `${yyyy}${mm}${dd}`, hour: hh }
}

function addHoursUtc(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function diffHoursUtc(a: Date, b: Date) {
  return (a.getTime() - b.getTime()) / (60 * 60 * 1000)
}

function roundToStep(n: number, step: number) {
  return Math.round(n / step) * step
}

function buildWafsUrl(run: WafsRun, forecastHour: number, product: 'edr' | 'wind') {
  const fhr = String(forecastHour).padStart(2, '0')
  const suffix = product === 'edr' ? 'edr' : 'wind'
  // Matches AWC UI naming observed via network requests.
  return `${WAFS_BASE_URL}/${run.date}/${run.hour}/${run.date}_${run.hour}_F${fhr}_wafs_301_${suffix}_m.png`
}

function rgbDistanceSq(a: RGB, b: RGB) {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return dr * dr + dg * dg + db * db
}

// Extracted from AWC WAFS page HTML legend (/wafs/).
// We map to representative midpoints of each legend bin (EDR is shown as x100).
const TURBULENCE_COLOUR_TO_EDR: Array<{ rgb: RGB; edr: number }> = [
  { rgb: [255, 255, 255], edr: 0.05 }, // <10
  { rgb: [204, 255, 0], edr: 0.15 }, // 10–20
  { rgb: [255, 204, 0], edr: 0.15 }, // 10–20
  { rgb: [255, 153, 0], edr: 0.3 }, // 20–40
  { rgb: [255, 102, 0], edr: 0.3 }, // 20–40
  { rgb: [255, 0, 0], edr: 0.5 }, // 40–60
  { rgb: [204, 0, 0], edr: 0.5 }, // 40–60
  { rgb: [153, 0, 0], edr: 0.7 }, // 60–80
  { rgb: [102, 0, 0], edr: 0.7 }, // 60–80
  { rgb: [77, 0, 0], edr: 0.9 }, // 80–100
]

// Extracted from AWC WAFS page HTML legend (/wafs/).
const WIND_COLOUR_TO_KT: Array<{ rgb: RGB; kt: number }> = [
  { rgb: [0, 255, 255], kt: 60 },
  { rgb: [0, 242, 229], kt: 70 },
  { rgb: [0, 229, 204], kt: 80 },
  { rgb: [0, 216, 165], kt: 90 },
  { rgb: [0, 204, 127], kt: 100 },
  { rgb: [0, 191, 63], kt: 110 },
  { rgb: [0, 178, 0], kt: 120 },
  { rgb: [94, 191, 0], kt: 130 },
  { rgb: [127, 204, 0], kt: 140 },
  { rgb: [165, 216, 0], kt: 150 },
]

function mapColourToNearest<T extends { rgb: RGB }>(rgb: RGB, table: readonly T[]) {
  let best = table[0]
  let bestD = Number.POSITIVE_INFINITY
  for (const item of table) {
    const d = rgbDistanceSq(rgb, item.rgb)
    if (d < bestD) {
      bestD = d
      best = item
    }
  }
  return best
}

function lonLatToPixel(
  lon: number,
  lat: number,
  width: number,
  height: number
): { x: number; y: number } | null {
  // Clamp to valid mercator range.
  const latClamped = clamp(lat, -85, 85)
  const lonNorm = ((lon + 180) % 360 + 360) % 360 - 180

  const xMeters = (lonNorm * Math.PI) / 180 * EARTH_RADIUS_M
  const latRad = (latClamped * Math.PI) / 180
  const yMeters = EARTH_RADIUS_M * Math.log(Math.tan(Math.PI / 4 + latRad / 2))

  const yMax = inferredWebMercatorYMax(width, height)
  if (yMeters < -yMax || yMeters > yMax) return null

  const x = Math.round(((xMeters + WEB_MERCATOR_X_MAX) / (2 * WEB_MERCATOR_X_MAX)) * (width - 1))
  const y = Math.round(((yMax - yMeters) / (2 * yMax)) * (height - 1))

  if (x < 0 || x >= width || y < 0 || y >= height) return null
  return { x, y }
}

type CachedPng = { png: PNG; expiresAt: number }
const pngCache = new Map<string, CachedPng>()
const PNG_CACHE_TTL_MS = 20 * 60 * 1000

async function fetchPng(url: string): Promise<PNG> {
  const now = Date.now()
  const cached = pngCache.get(url)
  if (cached && cached.expiresAt > now) return cached.png

  const res = await fetch(url, {
    // Keep this separate from Next's fetch cache; we manage our own TTL.
    headers: { 'User-Agent': 'TurbCast/1.0', Accept: 'image/png' },
  })
  if (!res.ok) {
    throw new Error(`WAFS fetch failed: ${res.status} ${res.statusText} (${url})`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const png = PNG.sync.read(buf)

  pngCache.set(url, { png, expiresAt: now + PNG_CACHE_TTL_MS })
  return png
}

function samplePngRgb(png: PNG, x: number, y: number): { rgb: RGB; alpha: number } {
  const idx = (png.width * y + x) << 2
  const r = png.data[idx]
  const g = png.data[idx + 1]
  const b = png.data[idx + 2]
  const a = png.data[idx + 3]
  return { rgb: [r, g, b], alpha: a }
}

async function tryFetchWithRunFallback(
  initialRun: WafsRun,
  forecastHour: number,
  product: 'edr' | 'wind'
) {
  // Try the computed run, then walk back by 6 hours up to 4 times.
  let run = initialRun
  for (let attempt = 0; attempt < 4; attempt++) {
    const url = buildWafsUrl(run, forecastHour, product)
    try {
      const png = await fetchPng(url)
      return { png, url, run }
    } catch (err: any) {
      const msg = String(err?.message ?? err)
      if (!msg.includes('404')) throw err
      // Step back one cycle.
      const runDateTime = new Date(
        Date.UTC(
          Number(run.date.slice(0, 4)),
          Number(run.date.slice(4, 6)) - 1,
          Number(run.date.slice(6, 8)),
          Number(run.hour),
          0,
          0
        )
      )
      const prev = addHoursUtc(runDateTime, -6)
      run = toWafsRun(prev)
    }
  }
  throw new Error(`WAFS product not found after run fallbacks: ${product} F${forecastHour}`)
}

export async function sampleWafsModelAlongRoute(
  waypoints: RoutePoint[],
  opts?: { departureTime?: Date; durationMinutes?: number }
): Promise<WafsSampleResult> {
  if (waypoints.length === 0) {
    return {
      edrByPoint: [],
      windSpeedKtByPoint: [],
      model: { source: 'noaa-awc-wafs', run: '00000000_00', forecastHour: 0, levelMb: 301 },
    }
  }

  const baseTime = opts?.departureTime ? new Date(opts.departureTime) : new Date()
  const runTime = toWafsRun(baseTime)

  // Compute forecast hour per point relative to the model run time. WAFS UI steps look 3-hourly.
  const runDateTime = new Date(
    Date.UTC(
      Number(runTime.date.slice(0, 4)),
      Number(runTime.date.slice(4, 6)) - 1,
      Number(runTime.date.slice(6, 8)),
      Number(runTime.hour),
      0,
      0
    )
  )

  const durationMinutes = opts?.durationMinutes ?? 0
  const forecastHourForPoint = waypoints.map((_, idx) => {
    const minutesProgress = durationMinutes * (idx / Math.max(1, waypoints.length - 1))
    const waypointTime = new Date(baseTime.getTime() + minutesProgress * 60 * 1000)
    const raw = diffHoursUtc(waypointTime, runDateTime)
    const stepped = roundToStep(raw, 3)
    return Math.max(0, Math.min(99, Math.round(stepped)))
  })

  // Use the most common hour bucket as the "headline" for metadata.
  const counts = new Map<number, number>()
  for (const fh of forecastHourForPoint) counts.set(fh, (counts.get(fh) ?? 0) + 1)
  let headlineFh = forecastHourForPoint[0] ?? 0
  for (const [fh, c] of counts.entries()) {
    if ((counts.get(headlineFh) ?? 0) < c) headlineFh = fh
  }
  let headlineRun: WafsRun | null = null

  // Fetch the needed hours (EDR + wind) and sample each point.
  const edrByPoint = new Array<number>(waypoints.length).fill(0.05)
  const windSpeedKtByPoint = new Array<number>(waypoints.length).fill(0)

  const uniqueHours = Array.from(new Set(forecastHourForPoint))
  for (const fh of uniqueHours) {
    const [{ png: edrPng, run: edrRun }, { png: windPng }] = await Promise.all([
      tryFetchWithRunFallback(runTime, fh, 'edr'),
      tryFetchWithRunFallback(runTime, fh, 'wind'),
    ])

    for (let i = 0; i < waypoints.length; i++) {
      if (forecastHourForPoint[i] !== fh) continue
      const wp = waypoints[i]

      const p = lonLatToPixel(wp.lon, wp.lat, edrPng.width, edrPng.height)
      if (!p) {
        edrByPoint[i] = 0.05
        windSpeedKtByPoint[i] = 0
        continue
      }

      const edrPx = samplePngRgb(edrPng, p.x, p.y)
      if (edrPx.alpha < 10) {
        edrByPoint[i] = 0.05
      } else {
        const nearest = mapColourToNearest(edrPx.rgb, TURBULENCE_COLOUR_TO_EDR)
        edrByPoint[i] = nearest.edr
      }

      const windPx = samplePngRgb(windPng, p.x, p.y)
      if (windPx.alpha < 10) {
        windSpeedKtByPoint[i] = 0
      } else {
        const nearest = mapColourToNearest(windPx.rgb, WIND_COLOUR_TO_KT)
        windSpeedKtByPoint[i] = nearest.kt
      }
    }

    if (fh === headlineFh) {
      // Prefer the run we successfully found (it may have stepped back).
      headlineRun = edrRun
    }
  }

  const runForMetadata = headlineRun ?? runTime
  return {
    edrByPoint,
    windSpeedKtByPoint,
    model: {
      source: 'noaa-awc-wafs',
      run: `${runForMetadata.date}_${runForMetadata.hour}`,
      forecastHour: headlineFh,
      levelMb: 301,
    },
  }
}


