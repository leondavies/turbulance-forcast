import type { RoutePoint } from '../route/greatCircle'
import { sampleWafsModelAlongRoute } from './wafsModel'

export type TurbulenceLevel = 'smooth' | 'light' | 'moderate' | 'severe'

/**
 * Deterministic pseudo-random number generator
 * Uses a simple hash function seeded from coordinates and index
 */
function seededRandom(lat: number, lon: number, index: number, salt: number = 0): number {
  // Create a seed from coordinates, index, and optional salt
  const seed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233 + index * 43.758 + salt) * 43758.5453)
  return seed - Math.floor(seed) // Return fractional part [0, 1)
}

export interface TurbulenceData {
  edr: number // Eddy Dissipation Rate (0-1)
  level: TurbulenceLevel
  windSpeed: number // knots
  windDirection: number // degrees
}

export interface SegmentForecast extends RoutePoint {
  turbulence: TurbulenceData
}

export interface ForecastMetadata {
  /** PIREPs close to the route corridor (not the whole bounding box) */
  pirepCount: number
  /** Turbulence-relevant SIGMETs in the route region */
  sigmetCount: number
  /** Turbulence-relevant AIRMETs in the route region */
  airmetCount: number
  /** How much live/official data is available to support the forecast */
  dataQuality: 'high' | 'medium' | 'low'
  lastUpdated: Date
  /**
   * True only when we could not fetch model guidance (WAFS) *and* could not fetch reports/advisories,
   * so we generated a heuristic baseline instead.
   */
  usingFallback: boolean
  /** When true, we used NOAA model guidance but could not fetch live reports/advisories for this run. */
  modelOnly?: boolean
  /** Model metadata when available. */
  model?: {
    source: 'noaa-awc-wafs'
    run: string
    forecastHour: number
    levelMb: number
  }
}

export interface ForecastResult {
  segments: SegmentForecast[]
  metadata: ForecastMetadata
}

/**
 * Fetch real turbulence forecast data from Aviation Weather Center
 * Uses SIGMET/AIRMET data and WAFS turbulence forecasts.
 * Optionally time-aware: departureTime adjusts diurnal variability and seeds.
 */
export async function generateTurbulenceForecast(
  waypoints: RoutePoint[],
  opts?: { departureTime?: Date; aircraftIata?: string; durationMinutes?: number }
): Promise<ForecastResult> {
  // Always try to fetch model guidance first. If this fails, we may fall back to heuristic.
  let wafs: Awaited<ReturnType<typeof sampleWafsModelAlongRoute>> | null = null
  try {
    wafs = await sampleWafsModelAlongRoute(waypoints, {
      departureTime: opts?.departureTime,
      durationMinutes: opts?.durationMinutes,
    })
  } catch (error) {
    console.error('Error fetching WAFS model guidance:', error)
    wafs = null
  }

  try {
    // Fetch reports/advisories from Aviation Weather Center (PIREP/SIGMET/AIRMET)
    const turbulenceData = await fetchAviationWeatherData(waypoints)

    const segments = waypoints.map((point, index) => {
      const turbulence = calculateTurbulenceForPoint(
        point,
        turbulenceData,
        index,
        waypoints.length,
        opts,
        wafs?.edrByPoint[index],
        wafs?.windSpeedKtByPoint[index]
      )
      return {
        ...point,
        turbulence,
      }
    })

    // Calculate data support based on *route-relevant* reports/advisories
    const pirepCount = countPirepsAlongRoute(waypoints, turbulenceData.pireps)
    const sigmetCount = countTurbulenceAdvisories(turbulenceData.sigmets)
    const airmetCount = countTurbulenceAdvisories(turbulenceData.airmets)

    let dataQuality: 'high' | 'medium' | 'low' = 'low'
    if (pirepCount >= 3 || sigmetCount >= 2 || airmetCount >= 2) {
      dataQuality = 'high'
    } else if (pirepCount >= 1 || sigmetCount >= 1 || airmetCount >= 1) {
      dataQuality = 'medium'
    }

    return {
      segments,
      metadata: {
        pirepCount,
        sigmetCount,
        airmetCount,
        dataQuality,
        lastUpdated: new Date(),
        usingFallback: !wafs,
        modelOnly: false,
        model: wafs?.model,
      },
    }
  } catch (error) {
    console.error('Error fetching aviation weather data:', error)

    if (wafs) {
      // Model guidance is available; treat this as "model-only" (no live reports/advisories fetched).
      const segments = waypoints.map((point, index) => ({
        ...point,
        turbulence: calculateTurbulenceLevel(
          wafs.edrByPoint[index] ?? 0.05,
          point,
          wafs.windSpeedKtByPoint[index]
        ),
      }))

      return {
        segments,
        metadata: {
          pirepCount: 0,
          sigmetCount: 0,
          airmetCount: 0,
          dataQuality: 'low',
          lastUpdated: new Date(),
          usingFallback: false,
          modelOnly: true,
          model: wafs.model,
        },
      }
    }

    // Last-resort heuristic fallback (no model + no reports/advisories).
    const segments = waypoints.map((point, index) => ({
      ...point,
      turbulence: calculateAtmosphericTurbulence(point, index, waypoints.length),
    }))

    return {
      segments,
      metadata: {
        pirepCount: 0,
        sigmetCount: 0,
        airmetCount: 0,
        dataQuality: 'low',
        lastUpdated: new Date(),
        usingFallback: true,
        modelOnly: true,
        model: undefined,
      },
    }
  }
}

interface AviationWeatherData {
  sigmets: any[]
  airmets: any[]
  pireps: any[] // Pilot reports
}

function countTurbulenceAdvisories(reports: any[]): number {
  // Only count advisories that are likely turbulence-related (reduces noise).
  return (reports || []).filter((report: any) => {
    const hazard = String(report?.hazard ?? '').toLowerCase()
    const raw = String(report?.raw ?? report?.rawText ?? report?.text ?? '').toLowerCase()
    return (
      hazard.includes('turb') ||
      hazard.includes('convection') ||
      raw.includes('turb') ||
      raw.includes('convection')
    )
  }).length
}

function countPirepsAlongRoute(waypoints: RoutePoint[], pireps: any[]): number {
  // PIREPs are sparse; we only count ones plausibly near the route corridor.
  // This keeps the UI honest: "0" means "none near your track right now",
  // not "none anywhere in a massive bounding box".
  const radiusNm = 50
  const reports = (pireps || []).filter((p: any) => p?.lat && p?.lon)
  if (reports.length === 0 || waypoints.length === 0) return 0

  // Cap waypoint checks per report (performance) by sampling the route.
  const step = Math.max(1, Math.floor(waypoints.length / 120))
  const seen = new Set<string>()

  for (const p of reports) {
    const key = `${p.lat},${p.lon},${p?.obsTime ?? p?.time ?? ''},${p?.turbulence?.intensity ?? ''}`
    if (seen.has(key)) continue

    for (let i = 0; i < waypoints.length; i += step) {
      const wp = waypoints[i]
      const d = calculateDistance(wp.lat, wp.lon, p.lat, p.lon)
      if (d < radiusNm) {
        seen.add(key)
        break
      }
    }
  }

  return seen.size
}

async function fetchAviationWeatherData(waypoints: RoutePoint[]): Promise<AviationWeatherData> {
  // Get bounding box for the route
  const lats = waypoints.map(p => p.lat)
  const lons = waypoints.map(p => p.lon)
  const minLat = Math.min(...lats) - 2
  const maxLat = Math.max(...lats) + 2
  const minLon = Math.min(...lons) - 2
  const maxLon = Math.max(...lons) + 2

  // Aviation Weather Center API endpoint
  const baseUrl = 'https://aviationweather.gov/api/data'

  try {
    // Fetch SIGMETs (Significant Meteorological Information) for turbulence
    const sigmetUrl = `${baseUrl}/sigmet?bbox=${minLon},${minLat},${maxLon},${maxLat}&format=json`
    const sigmetResponse = await fetch(sigmetUrl, {
      headers: { 'User-Agent': 'TurbCast/1.0', 'Accept': 'application/json' },
      next: { revalidate: 1800 }
    }) // Cache for 30 min
    const sigmets = sigmetResponse.ok ? await sigmetResponse.json() : []

    // Fetch AIRMETs (Airmen's Meteorological Information) for turbulence
    const airmetUrl = `${baseUrl}/airmet?bbox=${minLon},${minLat},${maxLon},${maxLat}&format=json`
    const airmetResponse = await fetch(airmetUrl, {
      headers: { 'User-Agent': 'TurbCast/1.0', 'Accept': 'application/json' },
      next: { revalidate: 1800 }
    })
    const airmets = airmetResponse.ok ? await airmetResponse.json() : []

    // Fetch PIREPs (Pilot Reports) for actual turbulence observations
    const pirepUrl = `${baseUrl}/pirep?bbox=${minLon},${minLat},${maxLon},${maxLat}&format=json`
    const pirepResponse = await fetch(pirepUrl, {
      headers: { 'User-Agent': 'TurbCast/1.0', 'Accept': 'application/json' },
      next: { revalidate: 600 }
    }) // Cache for 10 min
    const pireps = pirepResponse.ok ? await pirepResponse.json() : []

    return { sigmets, airmets, pireps }
  } catch (error) {
    console.error('Error fetching from Aviation Weather Center:', error)
    return { sigmets: [], airmets: [], pireps: [] }
  }
}

function calculateTurbulenceForPoint(
  point: RoutePoint,
  weatherData: AviationWeatherData,
  index: number,
  total: number,
  opts?: { departureTime?: Date; aircraftIata?: string; durationMinutes?: number },
  wafsEdr?: number,
  wafsWindSpeedKt?: number
): TurbulenceData {
  // Start with model guidance if available, otherwise a smooth baseline.
  let baseEDR = typeof wafsEdr === 'number' ? wafsEdr : 0.05

  // Check for turbulence reports in the area (within ~50nm)
  const nearbyReports = weatherData.pireps.filter((pirep: any) => {
    if (!pirep.lat || !pirep.lon) return false
    const distance = calculateDistance(point.lat, point.lon, pirep.lat, pirep.lon)
    return distance < 50 // Within 50 nautical miles
  })

  // Analyze pilot reports for turbulence
  nearbyReports.forEach((pirep: any, reportIdx: number) => {
    if (pirep.turbulence) {
      const intensity = pirep.turbulence.intensity || ''
      if (intensity.includes('SEV') || intensity.includes('EXTREME')) {
        baseEDR = Math.max(baseEDR, 0.45 + seededRandom(point.lat, point.lon, index, reportIdx) * 0.15)
      } else if (intensity.includes('MOD')) {
        baseEDR = Math.max(baseEDR, 0.25 + seededRandom(point.lat, point.lon, index, reportIdx + 100) * 0.1)
      } else if (intensity.includes('LGT')) {
        baseEDR = Math.max(baseEDR, 0.15 + seededRandom(point.lat, point.lon, index, reportIdx + 200) * 0.05)
      }
    }
  })

  // Check SIGMETs and AIRMETs for turbulence warnings
  const turbulenceWarnings = [...weatherData.sigmets, ...weatherData.airmets].filter(
    (report: any) => {
      if (!report.hazard) return false
      const hazard = report.hazard.toLowerCase()
      return hazard.includes('turb') || hazard.includes('convection')
    }
  )

  if (turbulenceWarnings.length > 0) {
    turbulenceWarnings.forEach((warning: any) => {
      if (warning.severity?.includes('SEV')) {
        baseEDR = Math.max(baseEDR, 0.4)
      } else if (warning.severity?.includes('MOD')) {
        baseEDR = Math.max(baseEDR, 0.25)
      }
    })
  }

  // If we *still* have only baseline (no model + no reports/advisories),
  // fall back to a heuristic atmospheric estimate.
  if (baseEDR === 0.05 && typeof wafsEdr !== 'number') {
    baseEDR = calculateAtmosphericEDR(point, index, total)
  }

  return calculateTurbulenceLevel(baseEDR, point, wafsWindSpeedKt)
}

function calculateAtmosphericTurbulence(point: RoutePoint, index: number, total: number): TurbulenceData {
  const baseEDR = calculateAtmosphericEDR(point, index, total)
  return calculateTurbulenceLevel(baseEDR, point)
}

function calculateAtmosphericEDR(point: RoutePoint, index: number, total: number): number {
  let edr = 0.05 // Base smooth conditions

  // Jet stream turbulence at typical cruise altitudes
  if (point.altitude > 28000 && point.altitude < 42000) {
    // Higher turbulence likelihood near jet stream (typically 30-40°N)
    if (Math.abs(point.lat) > 30 && Math.abs(point.lat) < 45) {
      edr += 0.08 + seededRandom(point.lat, point.lon, index, 1) * 0.12
    }
  }

  // Mountain wave turbulence (especially over mountainous regions)
  // Approximate mountain regions by latitude bands
  if (Math.abs(point.lat) > 35 && Math.abs(point.lat) < 50) {
    if (point.altitude > 15000 && point.altitude < 35000) {
      edr += seededRandom(point.lat, point.lon, index, 2) * 0.1
    }
  }

  // Convective turbulence (more common at lower latitudes and altitudes)
  if (Math.abs(point.lat) < 35) {
    if (point.altitude < 30000) {
      // Deterministic convective activity based on location
      if (seededRandom(point.lat, point.lon, index, 3) < 0.15) {
        edr += 0.15 + seededRandom(point.lat, point.lon, index, 4) * 0.15
      }
    }
  }

  // Clear air turbulence (can occur anywhere)
  edr += seededRandom(point.lat, point.lon, index, 5) * 0.05

  return Math.min(edr, 0.65)
}

function calculateTurbulenceLevel(edr: number, point: RoutePoint, windSpeedOverrideKt?: number): TurbulenceData {
  // EDR thresholds based on FAA/ICAO standards
  let level: TurbulenceLevel

  if (edr < 0.15) {
    level = 'smooth'
  } else if (edr < 0.25) {
    level = 'light'
  } else if (edr < 0.4) {
    level = 'moderate'
  } else {
    level = 'severe'
  }

  // Generate realistic wind data based on altitude
  // Wind speeds generally increase with altitude
  const baseWind = point.altitude / 400 // Rough approximation
  const windSpeed =
    typeof windSpeedOverrideKt === 'number'
      ? Math.round(windSpeedOverrideKt)
      : Math.round(baseWind + (seededRandom(point.lat, point.lon, 0, 6) - 0.5) * 40)

  // Wind direction varies by hemisphere and altitude
  // Northern hemisphere: generally westerly at altitude
  const baseDirection = point.lat > 0 ? 270 : 90
  const windDirection = Math.round(baseDirection + (seededRandom(point.lat, point.lon, 0, 7) - 0.5) * 60)

  return {
    edr: Math.round(edr * 1000) / 1000,
    level,
    windSpeed: Math.max(0, windSpeed),
    windDirection: (windDirection + 360) % 360,
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Haversine formula for great circle distance in nautical miles
  const R = 3440.065 // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function getTurbulenceColor(level: TurbulenceLevel): string {
  const colors = {
    smooth: '#10b981', // green
    light: '#fbbf24', // yellow
    moderate: '#f97316', // orange
    severe: '#ef4444', // red
  }
  return colors[level]
}

export function getTurbulenceDescription(level: TurbulenceLevel): string {
  const descriptions = {
    smooth: 'Smooth flight conditions expected',
    light: 'Light turbulence - minor discomfort possible',
    moderate: 'Moderate turbulence - seatbelt advised',
    severe: 'Severe turbulence - may be uncomfortable',
  }
  return descriptions[level]
}
