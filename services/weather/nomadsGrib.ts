import type { RoutePoint } from '../route/greatCircle'
import Grib2 from 'grib2-simple'

/**
 * NOMADS (NOAA Operational Model Archive and Distribution System)
 * Provides raw WAFS GRIB2 turbulence data without requiring API keys.
 *
 * Data source: https://nomads.ncep.noaa.gov/
 * Updates: Every 6 hours (00Z, 06Z, 12Z, 18Z)
 * Coverage: Global, FL100-FL450
 * Resolution: 0.25° horizontal, multiple pressure levels
 */

type WafsRun = {
  /** YYYYMMDD */
  date: string
  /** HH (UTC), typically 00/06/12/18 */
  hour: string
}

export type NomadsGribResult = {
  edrByPoint: number[]
  windSpeedKtByPoint: number[]
  model: {
    source: 'noaa-nomads-wafs'
    run: `${string}_${string}` // YYYYMMDD_HH
    forecastHour: number
    levelMb: number
  }
}

type GribGrid = {
  latitudes: number[]
  longitudes: number[]
  values: number[]
  nx: number // grid width
  ny: number // grid height
}

const NOMADS_BASE_URL = 'https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod'

// Flight levels commonly used for turbulence forecasting
// Pressure levels in mb (hPa)
const FLIGHT_LEVELS = {
  FL180: 500,   // ~18,000 ft
  FL240: 400,   // ~24,000 ft
  FL300: 300,   // ~30,000 ft
  FL340: 250,   // ~34,000 ft
  FL390: 200,   // ~39,000 ft
} as const

// GRIB2 cache: keyed by URL, stores parsed grid data
type CachedGrib = {
  grids: Map<number, GribGrid> // pressure level → grid
  expiresAt: number
}
const gribCache = new Map<string, CachedGrib>()
const GRIB_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour (WAFS updates every 6h, but we refresh sooner)

function toWafsRun(baseTimeUtc: Date): WafsRun {
  const d = new Date(baseTimeUtc)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')

  // WAFS cycles at 00/06/12/18Z. Floor to latest 6-hour cycle.
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

/**
 * Build NOMADS GRIB2 URL for WAFS turbulence forecast.
 *
 * Example: https://nomads.ncep.noaa.gov/pub/data/nccf/com/gfs/prod/gfs.20231215/00/atmos/gfs.t00z.wafs_grb45f12.grib2
 */
function buildNomadsUrl(run: WafsRun, forecastHour: number): string {
  const fhr = String(forecastHour).padStart(2, '0')
  // WAFS GRIB2 files use 45km resolution (grb45)
  return `${NOMADS_BASE_URL}/gfs.${run.date}/${run.hour}/atmos/gfs.t${run.hour}z.wafs_grb45f${fhr}.grib2`
}

/**
 * Download and parse GRIB2 file from NOMADS.
 * Extracts turbulence EDR grids for all available flight levels.
 */
async function fetchAndParseGrib2(url: string): Promise<Map<number, GribGrid>> {
  const now = Date.now()
  const cached = gribCache.get(url)
  if (cached && cached.expiresAt > now) {
    return cached.grids
  }

  console.log(`[NOMADS] Fetching GRIB2: ${url}`)

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'TurbCast/1.0',
      'Accept': 'application/octet-stream'
    },
  })

  if (!res.ok) {
    throw new Error(`NOMADS fetch failed: ${res.status} ${res.statusText} (${url})`)
  }

  const arrayBuf = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuf)

  console.log(`[NOMADS] Parsing GRIB2 (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`)

  // Parse GRIB2 file
  const gribData = await Grib2.parse(buffer)

  if (!gribData || !gribData.messages || gribData.messages.length === 0) {
    throw new Error(`GRIB2 parse failed: no messages found`)
  }

  console.log(`[NOMADS] Found ${gribData.messages.length} GRIB2 messages`)

  // Extract EDR turbulence grids for each flight level
  const grids = new Map<number, GribGrid>()

  for (const msg of gribData.messages) {
    // Look for EDR (Eddy Dissipation Rate) parameter
    // GRIB2 discipline=0 (Meteorological), category=19 (Physical Atmospheric Properties)
    // parameter=37 (Eddy Dissipation Rate)
    if (
      msg.discipline === 0 &&
      msg.parameterCategory === 19 &&
      msg.parameterNumber === 37
    ) {
      // Check if this is a pressure level we care about
      const pressureMb = msg.level // e.g., 300 for FL300
      const validLevels = Object.values(FLIGHT_LEVELS) as number[]

      if (validLevels.includes(pressureMb)) {
        const grid = extractGridFromMessage(msg)
        if (grid) {
          grids.set(pressureMb, grid)
          console.log(`[NOMADS] Extracted EDR grid for ${pressureMb}mb (${grid.values.length} points)`)
        }
      }
    }
  }

  if (grids.size === 0) {
    console.warn(`[NOMADS] No EDR grids found in GRIB2 file`)
  }

  // Cache the parsed grids
  gribCache.set(url, { grids, expiresAt: now + GRIB_CACHE_TTL_MS })

  return grids
}

/**
 * Extract lat/lon grid and values from a GRIB2 message.
 */
function extractGridFromMessage(msg: any): GribGrid | null {
  try {
    // GRIB2 grid definition
    const nx = msg.nx || msg.grid?.nx || 0
    const ny = msg.ny || msg.grid?.ny || 0

    if (!nx || !ny) {
      console.warn(`[NOMADS] Invalid grid dimensions: nx=${nx}, ny=${ny}`)
      return null
    }

    // Grid coordinates (varies by GRIB2 template)
    const latitudes: number[] = msg.grid?.latitudes || []
    const longitudes: number[] = msg.grid?.longitudes || []
    const values: number[] = msg.values || []

    if (latitudes.length === 0 || longitudes.length === 0 || values.length === 0) {
      console.warn(`[NOMADS] Missing grid data`)
      return null
    }

    return { latitudes, longitudes, values, nx, ny }
  } catch (error) {
    console.error(`[NOMADS] Error extracting grid:`, error)
    return null
  }
}

/**
 * Bilinear interpolation for a single point.
 * Finds 4 nearest grid points and interpolates.
 */
function interpolateBilinear(
  lat: number,
  lon: number,
  grid: GribGrid
): number | null {
  // Normalize longitude to -180 to 180
  const lonNorm = ((lon + 180) % 360) - 180

  // Find grid cell containing the point
  // Note: GRIB2 grids can have varying structures, we'll do a simple search

  // For WAFS grids, typical resolution is 0.25° or 1.25°
  // We'll search for the 4 nearest points

  let closestPoints: Array<{ lat: number; lon: number; value: number; dist: number }> = []

  for (let i = 0; i < grid.values.length; i++) {
    const glat = grid.latitudes[i]
    const glon = ((grid.longitudes[i] + 180) % 360) - 180

    const dist = Math.sqrt(
      Math.pow(lat - glat, 2) + Math.pow(lonNorm - glon, 2)
    )

    closestPoints.push({ lat: glat, lon: glon, value: grid.values[i], dist })
  }

  // Sort by distance and take 4 closest
  closestPoints.sort((a, b) => a.dist - b.dist)
  closestPoints = closestPoints.slice(0, 4)

  if (closestPoints.length === 0) return null

  // If very close to a grid point, just use it
  if (closestPoints[0].dist < 0.01) {
    return closestPoints[0].value
  }

  // Inverse distance weighting (simple bilinear approximation)
  let sumWeightedValues = 0
  let sumWeights = 0

  for (const pt of closestPoints) {
    const weight = 1 / Math.max(pt.dist, 0.001) // avoid division by zero
    sumWeightedValues += pt.value * weight
    sumWeights += weight
  }

  return sumWeightedValues / sumWeights
}

/**
 * Linear interpolation between two flight levels.
 */
function interpolateVertical(
  alt: number,
  lowerLevel: number,
  upperLevel: number,
  lowerEDR: number,
  upperEDR: number
): number {
  const fraction = (alt - lowerLevel) / (upperLevel - lowerLevel)
  return lowerEDR + fraction * (upperEDR - lowerEDR)
}

/**
 * Convert altitude (feet) to pressure level (mb) - approximate.
 */
function altitudeToPressure(altFt: number): number {
  // Standard atmosphere approximation
  // This is a rough conversion; real atmosphere varies
  if (altFt >= 36000) return 250 // ~FL360+
  if (altFt >= 30000) return 300 // FL300
  if (altFt >= 24000) return 400 // FL240
  if (altFt >= 18000) return 500 // FL180
  return 500
}

/**
 * Fetch turbulence forecast with fallback to older model runs if current unavailable.
 */
async function tryFetchWithRunFallback(
  initialRun: WafsRun,
  forecastHour: number
): Promise<{ grids: Map<number, GribGrid>; url: string; run: WafsRun }> {
  let run = initialRun

  for (let attempt = 0; attempt < 4; attempt++) {
    const url = buildNomadsUrl(run, forecastHour)

    try {
      const grids = await fetchAndParseGrib2(url)
      return { grids, url, run }
    } catch (err: any) {
      const msg = String(err?.message ?? err)

      // If 404, try previous model run
      if (msg.includes('404')) {
        console.warn(`[NOMADS] GRIB2 not found (attempt ${attempt + 1}/4), trying previous run`)

        // Step back 6 hours
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
      } else {
        // Other error, throw
        throw err
      }
    }
  }

  throw new Error(`NOMADS GRIB2 not found after ${4} attempts`)
}

/**
 * Sample NOMADS WAFS turbulence data along a flight route.
 *
 * @param waypoints - Route waypoints with lat/lon/altitude
 * @param opts - Departure time and duration for time-aware forecasting
 * @returns EDR and wind speed values for each waypoint
 */
export async function sampleNomadsWafsAlongRoute(
  waypoints: RoutePoint[],
  opts?: { departureTime?: Date; durationMinutes?: number }
): Promise<NomadsGribResult> {
  if (waypoints.length === 0) {
    return {
      edrByPoint: [],
      windSpeedKtByPoint: [],
      model: { source: 'noaa-nomads-wafs', run: '00000000_00', forecastHour: 0, levelMb: 300 },
    }
  }

  const baseTime = opts?.departureTime ? new Date(opts.departureTime) : new Date()
  const runTime = toWafsRun(baseTime)

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

  // Calculate forecast hour for each waypoint (3-hour steps for WAFS)
  const forecastHourForPoint = waypoints.map((_, idx) => {
    const minutesProgress = durationMinutes * (idx / Math.max(1, waypoints.length - 1))
    const waypointTime = new Date(baseTime.getTime() + minutesProgress * 60 * 1000)
    const raw = diffHoursUtc(waypointTime, runDateTime)
    const stepped = roundToStep(raw, 3) // WAFS files every 3 hours
    return Math.max(0, Math.min(36, Math.round(stepped))) // WAFS forecasts up to 36 hours
  })

  // Use most common forecast hour as headline
  const counts = new Map<number, number>()
  for (const fh of forecastHourForPoint) counts.set(fh, (counts.get(fh) ?? 0) + 1)
  let headlineFh = forecastHourForPoint[0] ?? 0
  for (const [fh, c] of counts.entries()) {
    if ((counts.get(headlineFh) ?? 0) < c) headlineFh = fh
  }

  const edrByPoint = new Array<number>(waypoints.length).fill(0.05)
  const windSpeedKtByPoint = new Array<number>(waypoints.length).fill(0)

  let headlineRun: WafsRun | null = null

  // Fetch unique forecast hours
  const uniqueHours = Array.from(new Set(forecastHourForPoint))

  for (const fh of uniqueHours) {
    try {
      const { grids, run } = await tryFetchWithRunFallback(runTime, fh)

      // Sample each waypoint for this forecast hour
      for (let i = 0; i < waypoints.length; i++) {
        if (forecastHourForPoint[i] !== fh) continue

        const wp = waypoints[i]
        const pressureMb = altitudeToPressure(wp.altitude)

        // Find grids for interpolation (vertical)
        const levels = Array.from(grids.keys()).sort((a, b) => b - a) // descending
        const lowerLevel = levels.find(l => l >= pressureMb) || levels[levels.length - 1]
        const upperLevel = levels.find(l => l < pressureMb) || levels[0]

        const lowerGrid = grids.get(lowerLevel)
        const upperGrid = grids.get(upperLevel)

        if (!lowerGrid) {
          // No grid data available
          edrByPoint[i] = 0.05
          continue
        }

        // Interpolate horizontally at lower level
        const lowerEDR = interpolateBilinear(wp.lat, wp.lon, lowerGrid)

        if (lowerEDR === null) {
          edrByPoint[i] = 0.05
          continue
        }

        // If we have both levels, interpolate vertically
        if (upperGrid && lowerLevel !== upperLevel) {
          const upperEDR = interpolateBilinear(wp.lat, wp.lon, upperGrid)
          if (upperEDR !== null) {
            edrByPoint[i] = interpolateVertical(
              pressureMb,
              lowerLevel,
              upperLevel,
              lowerEDR,
              upperEDR
            )
          } else {
            edrByPoint[i] = lowerEDR
          }
        } else {
          edrByPoint[i] = lowerEDR
        }

        // Clamp EDR to reasonable range
        edrByPoint[i] = Math.max(0, Math.min(1.0, edrByPoint[i]))
      }

      if (fh === headlineFh) {
        headlineRun = run
      }
    } catch (error) {
      console.error(`[NOMADS] Failed to fetch forecast hour ${fh}:`, error)
      // Continue with other forecast hours
    }
  }

  const runForMetadata = headlineRun ?? runTime

  return {
    edrByPoint,
    windSpeedKtByPoint, // TODO: Extract wind from GRIB2 if available
    model: {
      source: 'noaa-nomads-wafs',
      run: `${runForMetadata.date}_${runForMetadata.hour}`,
      forecastHour: headlineFh,
      levelMb: 300, // Representative level
    },
  }
}
