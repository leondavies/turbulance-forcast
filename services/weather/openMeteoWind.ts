import type { RoutePoint } from '../route/greatCircle'

/**
 * Open-Meteo Wind Data Service
 * FREE API providing wind speed and direction at pressure levels
 *
 * API Documentation: https://open-meteo.com/en/docs
 * Pressure levels: 300hPa (~FL300), 250hPa (~FL340), etc.
 * Updates: Hourly
 * License: Free for non-commercial use, no API key required
 */

export type OpenMeteoWindResult = {
  windSpeedKt: number[]
  windDirection: number[] // degrees, meteorological (direction wind is FROM)
  model: {
    source: 'open-meteo'
    model: string
  }
}

interface OpenMeteoResponse {
  hourly: {
    time: string[]
    wind_speed_300hPa: number[] // m/s
    wind_direction_300hPa: number[] // degrees
  }
}

/**
 * Fetch wind data from Open-Meteo API for a single coordinate
 */
async function fetchWindAtPoint(lat: number, lon: number, targetTime: Date): Promise<{ speed: number; direction: number }> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toFixed(4))
  url.searchParams.set('longitude', lon.toFixed(4))
  url.searchParams.set('hourly', 'wind_speed_300hPa,wind_direction_300hPa')
  url.searchParams.set('wind_speed_unit', 'kn') // Request knots directly
  url.searchParams.set('timezone', 'UTC')

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'TurbCast/1.0 (https://turbcast.com)',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`)
    }

    const data: OpenMeteoResponse = await response.json()

    if (!data.hourly || !data.hourly.time || data.hourly.time.length === 0) {
      throw new Error('No wind data returned from Open-Meteo')
    }

    // Find closest time index
    const targetIso = targetTime.toISOString()
    let closestIdx = 0
    let closestDiff = Math.abs(new Date(data.hourly.time[0]).getTime() - targetTime.getTime())

    for (let i = 1; i < data.hourly.time.length; i++) {
      const diff = Math.abs(new Date(data.hourly.time[i]).getTime() - targetTime.getTime())
      if (diff < closestDiff) {
        closestDiff = diff
        closestIdx = i
      }
    }

    const speed = data.hourly.wind_speed_300hPa[closestIdx] || 0
    const direction = data.hourly.wind_direction_300hPa[closestIdx] || 0

    return {
      speed: Math.round(speed),
      direction: Math.round(direction)
    }
  } catch (error) {
    console.error(`[Open-Meteo] Error fetching wind for ${lat},${lon}:`, error)
    // Return default values on error
    return { speed: 0, direction: 0 }
  }
}

/**
 * Fetch wind data along entire route from Open-Meteo
 *
 * NOTE: Open-Meteo's free tier has rate limits. For routes with many waypoints,
 * we sample key points and interpolate between them.
 */
export async function fetchOpenMeteoWindAlongRoute(
  waypoints: RoutePoint[],
  opts?: { departureTime?: Date; durationMinutes?: number }
): Promise<OpenMeteoWindResult> {
  if (waypoints.length === 0) {
    return {
      windSpeedKt: [],
      windDirection: [],
      model: { source: 'open-meteo', model: 'gfs' }
    }
  }

  const baseTime = opts?.departureTime ? new Date(opts.departureTime) : new Date()
  const durationMinutes = opts?.durationMinutes ?? 0

  // Sample waypoints to reduce API calls (Open-Meteo free tier limits)
  // Sample ~15 points max for reasonable API usage
  const sampleSize = Math.min(15, waypoints.length)
  const sampleStep = Math.max(1, Math.floor(waypoints.length / sampleSize))
  const sampledIndices: number[] = []

  for (let i = 0; i < waypoints.length; i += sampleStep) {
    sampledIndices.push(i)
  }

  // Always include last waypoint
  if (sampledIndices[sampledIndices.length - 1] !== waypoints.length - 1) {
    sampledIndices.push(waypoints.length - 1)
  }

  console.log(`[Open-Meteo] Sampling ${sampledIndices.length} of ${waypoints.length} waypoints`)

  // Fetch wind data for sampled points
  const sampledWind: Array<{ idx: number; speed: number; direction: number }> = []

  for (const idx of sampledIndices) {
    const wp = waypoints[idx]

    // Calculate time at this waypoint
    const progress = idx / Math.max(1, waypoints.length - 1)
    const minutesFromDeparture = durationMinutes * progress
    const waypointTime = new Date(baseTime.getTime() + minutesFromDeparture * 60 * 1000)

    const wind = await fetchWindAtPoint(wp.lat, wp.lon, waypointTime)
    sampledWind.push({ idx, ...wind })

    // Small delay to be respectful of free API (10 requests/second limit)
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  // Interpolate wind data for all waypoints
  const windSpeedKt: number[] = new Array(waypoints.length).fill(0)
  const windDirection: number[] = new Array(waypoints.length).fill(0)

  for (let i = 0; i < waypoints.length; i++) {
    // Find surrounding sampled points
    let lowerIdx = 0
    let upperIdx = sampledWind.length - 1

    for (let j = 0; j < sampledWind.length - 1; j++) {
      if (sampledWind[j].idx <= i && sampledWind[j + 1].idx >= i) {
        lowerIdx = j
        upperIdx = j + 1
        break
      }
    }

    const lower = sampledWind[lowerIdx]
    const upper = sampledWind[upperIdx]

    if (lower.idx === upper.idx) {
      // Direct match
      windSpeedKt[i] = lower.speed
      windDirection[i] = lower.direction
    } else {
      // Linear interpolation
      const fraction = (i - lower.idx) / (upper.idx - lower.idx)

      // Interpolate speed
      windSpeedKt[i] = Math.round(lower.speed + fraction * (upper.speed - lower.speed))

      // Interpolate direction (handle 360° wrap)
      let dirDiff = upper.direction - lower.direction
      if (dirDiff > 180) dirDiff -= 360
      if (dirDiff < -180) dirDiff += 360

      windDirection[i] = Math.round((lower.direction + fraction * dirDiff + 360) % 360)
    }
  }

  return {
    windSpeedKt,
    windDirection,
    model: { source: 'open-meteo', model: 'gfs' }
  }
}
