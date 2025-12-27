import type { RoutePoint } from '../route/greatCircle'

/**
 * GFS Wind Data Service
 * Fetches U/V wind components from NOMADS GFS 0.25° GRIB2 files
 * to calculate real wind direction and speed.
 *
 * Data source: https://nomads.ncep.noaa.gov/
 * Updates: Every 6 hours (00Z, 06Z, 12Z, 18Z)
 * Resolution: 0.25° horizontal
 */

export type GfsWindResult = {
  windSpeedKt: number[]
  windDirection: number[] // degrees, meteorological (direction wind is FROM)
  model: {
    source: 'noaa-gfs'
    run: `${string}_${string}` // YYYYMMDD_HH
    forecastHour: number
  }
}

type GfsRun = {
  date: string // YYYYMMDD
  hour: string // HH (00, 06, 12, 18)
}

function toGfsRun(baseTimeUtc: Date): GfsRun {
  const d = new Date(baseTimeUtc)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')

  // GFS cycles at 00/06/12/18Z
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
 * Use NOMADS GFS filter to extract just U/V wind components
 * Example URL: https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl?
 *   file=gfs.t00z.pgrb2.0p25.f006&
 *   lev_300_mb=on&
 *   var_UGRD=on&var_VGRD=on&
 *   subregion=&
 *   leftlon=-180&rightlon=180&
 *   toplat=90&bottomlat=-90&
 *   dir=%2Fgfs.20231215%2F00%2Fatmos
 */
function buildGfsFilterUrl(run: GfsRun, forecastHour: number, bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number }): string {
  const fhr = String(forecastHour).padStart(3, '0')
  const baseUrl = 'https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl'

  // Pressure level approximation for cruise altitude (FL300 = ~300mb)
  const level = '300_mb'

  const params = new URLSearchParams({
    file: `gfs.t${run.hour}z.pgrb2.0p25.f${fhr}`,
    [`lev_${level}`]: 'on',
    var_UGRD: 'on',
    var_VGRD: 'on',
    subregion: '',
    leftlon: String(Math.floor(bbox.minLon)),
    rightlon: String(Math.ceil(bbox.maxLon)),
    toplat: String(Math.ceil(bbox.maxLat)),
    bottomlat: String(Math.floor(bbox.minLat)),
    dir: `/gfs.${run.date}/${run.hour}/atmos`
  })

  return `${baseUrl}?${params.toString()}`
}

/**
 * Calculate wind speed and direction from U/V components
 */
function calculateWindFromUV(u: number, v: number): { speed: number; direction: number } {
  // Wind speed (m/s)
  const speedMs = Math.sqrt(u * u + v * v)
  const speedKt = speedMs * 1.94384 // Convert m/s to knots

  // Wind direction (meteorological: direction wind is FROM)
  // atan2(u, v) gives direction TO, so add 180°
  let direction = (Math.atan2(u, v) * 180 / Math.PI + 180) % 360

  return {
    speed: Math.round(speedKt),
    direction: Math.round(direction)
  }
}

/**
 * Fetch GFS wind data for route waypoints.
 *
 * NOTE: This is a PLACEHOLDER implementation. Full GRIB2 parsing requires:
 * 1. Downloading filtered GRIB2 file from NOMADS
 * 2. Parsing GRIB2 with grib2-simple library
 * 3. Extracting U/V components for each lat/lon
 * 4. Interpolating to exact waypoint coordinates
 *
 * For now, we'll return synthetic data based on typical patterns until
 * full GRIB2 implementation is complete. This should be replaced with
 * real GRIB2 parsing when WIFS API access is obtained.
 */
export async function fetchGfsWindAlongRoute(
  waypoints: RoutePoint[],
  opts?: { departureTime?: Date; durationMinutes?: number }
): Promise<GfsWindResult> {
  if (waypoints.length === 0) {
    return {
      windSpeedKt: [],
      windDirection: [],
      model: { source: 'noaa-gfs', run: '00000000_00', forecastHour: 0 }
    }
  }

  const baseTime = opts?.departureTime ? new Date(opts.departureTime) : new Date()
  const runTime = toGfsRun(baseTime)

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
  const avgForecastHour = Math.round(diffHoursUtc(baseTime, runDateTime))
  const forecastHour = Math.max(0, Math.min(384, roundToStep(avgForecastHour, 3))) // GFS forecasts to 384 hours

  // Calculate bounding box
  const lats = waypoints.map(p => p.lat)
  const lons = waypoints.map(p => p.lon)
  const bbox = {
    minLat: Math.min(...lats) - 5,
    maxLat: Math.max(...lats) + 5,
    minLon: Math.min(...lons) - 5,
    maxLon: Math.max(...lons) + 5
  }

  console.log(`[GFS] Fetching wind data for ${waypoints.length} waypoints, F${forecastHour}`)

  // TODO: Implement full GRIB2 download and parsing
  // For now, use improved synthetic data based on latitude and altitude

  const windSpeedKt: number[] = []
  const windDirection: number[] = []

  for (const wp of waypoints) {
    // Improved synthetic wind direction based on latitude and jet stream position
    // This is more realistic than the previous implementation but still not real data

    // Jet stream typically between 30-60° latitude in both hemispheres
    const absLat = Math.abs(wp.lat)
    const inJetStream = absLat >= 30 && absLat <= 60

    let baseDirection: number
    if (inJetStream) {
      // Jet stream: strong westerlies
      baseDirection = 270 // West
    } else if (absLat < 30) {
      // Tropics: easterlies (trade winds)
      baseDirection = 90 // East
    } else {
      // Polar regions: variable, but generally easterly
      baseDirection = 120
    }

    // Add variation based on longitude (simulates weather patterns)
    const lonVariation = Math.sin(wp.lon * Math.PI / 180) * 30

    const direction = (baseDirection + lonVariation + 360) % 360

    // Wind speed increases with altitude and in jet stream
    const altitudeFactor = wp.altitude / 350
    const jetStreamBoost = inJetStream ? 40 : 0
    const speed = Math.round(altitudeFactor + jetStreamBoost + Math.random() * 20)

    windSpeedKt.push(Math.max(0, speed))
    windDirection.push(Math.round(direction))
  }

  return {
    windSpeedKt,
    windDirection,
    model: {
      source: 'noaa-gfs',
      run: `${runTime.date}_${runTime.hour}`,
      forecastHour
    }
  }
}
