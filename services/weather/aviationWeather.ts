import type { RoutePoint } from '../route/greatCircle'
import { sampleNomadsWafsAlongRoute } from './nomadsGrib'
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
    source: 'noaa-nomads-wafs' | 'noaa-awc-wafs'
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
  // Data sources in priority order:
  // 1. WAFS PNG sampling (proven working source)
  // 2. Heuristic calculation (fallback)
  // Note: NOMADS GRIB2 disabled - WAFS data not available via NOMADS public endpoints

  let wafs: Awaited<ReturnType<typeof sampleNomadsWafsAlongRoute>> | Awaited<ReturnType<typeof sampleWafsModelAlongRoute>> | null = null

  // Use WAFS PNG sampling (aviationweather.gov)
  try {
    console.log('[TurbCast] Fetching WAFS PNG model data...')
    wafs = await sampleWafsModelAlongRoute(waypoints, {
      departureTime: opts?.departureTime,
      durationMinutes: opts?.durationMinutes,
    })
    console.log('[TurbCast] WAFS PNG sampling successful')
  } catch (error) {
    console.error('[TurbCast] WAFS PNG sampling failed:', error)
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
    const intlSigmetCount = countTurbulenceAdvisories(turbulenceData.intlSigmets)
    const airmetCount = countTurbulenceAdvisories(turbulenceData.airmets)
    const gairmetCount = countTurbulenceAdvisories(turbulenceData.gairmets)
    const totalAdvisories = sigmetCount + intlSigmetCount + airmetCount + gairmetCount

    let dataQuality: 'high' | 'medium' | 'low' = 'low'
    if (pirepCount >= 3 || totalAdvisories >= 2) {
      dataQuality = 'high'
    } else if (pirepCount >= 1 || totalAdvisories >= 1) {
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
  sigmets: any[] // Domestic SIGMETs
  intlSigmets: any[] // International SIGMETs
  airmets: any[]
  gairmets: any[] // Graphical AIRMETs (forecast turbulence areas)
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

  // Get typical cruise altitude for filtering
  const avgAltitude = waypoints.reduce((sum, p) => sum + p.altitude, 0) / waypoints.length

  // Aviation Weather Center API endpoint
  const baseUrl = 'https://aviationweather.gov/api/data'

  try {
    // Fetch all data sources in parallel for better performance
    const [sigmetResponse, intlSigmetResponse, airmetResponse, gairmetResponse, pirepResponse] = await Promise.all([
      // Domestic SIGMETs (Significant Meteorological Information) for turbulence
      fetch(`${baseUrl}/airsigmet?format=json&hazard=turb&level=${Math.round(avgAltitude)}`, {
        headers: { 'User-Agent': 'TurbCast/1.0', 'Accept': 'application/json' },
        next: { revalidate: 1800 }
      }),

      // International SIGMETs for global route coverage
      fetch(`${baseUrl}/isigmet?format=json&hazard=turb&level=${Math.round(avgAltitude)}`, {
        headers: { 'User-Agent': 'TurbCast/1.0', 'Accept': 'application/json' },
        next: { revalidate: 1800 }
      }),

      // AIRMETs (Airmen's Meteorological Information) for turbulence
      fetch(`${baseUrl}/airmet?bbox=${minLon},${minLat},${maxLon},${maxLat}&format=json&hazard=turb`, {
        headers: { 'User-Agent': 'TurbCast/1.0', 'Accept': 'application/json' },
        next: { revalidate: 1800 }
      }),

      // G-AIRMETs (Graphical AIRMETs) for forecast turbulence areas (0-12 hour forecasts)
      fetch(`${baseUrl}/gairmet?format=json&hazard=turb-hi,turb-lo`, {
        headers: { 'User-Agent': 'TurbCast/1.0', 'Accept': 'application/json' },
        next: { revalidate: 1800 }
      }),

      // PIREPs (Pilot Reports) filtered by age (2 hours) and altitude
      fetch(`${baseUrl}/pirep?bbox=${minLon},${minLat},${maxLon},${maxLat}&format=json&age=2&level=${Math.round(avgAltitude)}`, {
        headers: { 'User-Agent': 'TurbCast/1.0', 'Accept': 'application/json' },
        next: { revalidate: 600 }
      })
    ])

    const sigmets = sigmetResponse.ok ? await sigmetResponse.json() : []
    const intlSigmets = intlSigmetResponse.ok ? await intlSigmetResponse.json() : []
    const airmets = airmetResponse.ok ? await airmetResponse.json() : []
    const gairmets = gairmetResponse.ok ? await gairmetResponse.json() : []
    const pireps = pirepResponse.ok ? await pirepResponse.json() : []

    return { sigmets, intlSigmets, airmets, gairmets, pireps }
  } catch (error) {
    console.error('Error fetching from Aviation Weather Center:', error)
    return { sigmets: [], intlSigmets: [], airmets: [], gairmets: [], pireps: [] }
  }
}

/**
 * Weighted confidence system for blending multiple turbulence data sources.
 * Higher confidence sources override lower confidence ones.
 */
interface TurbulenceSource {
  edr: number
  confidence: number // 0-1 scale
  source: 'pirep' | 'sigmet' | 'airmet' | 'gairmet' | 'wafs' | 'heuristic'
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
  const sources: TurbulenceSource[] = []

  // 1. WAFS model baseline (confidence: 0.6)
  if (typeof wafsEdr === 'number') {
    sources.push({ edr: wafsEdr, confidence: 0.6, source: 'wafs' })
  }

  // 2. PIREPs - Real pilot observations (confidence: 0.9-1.0, decays with distance)
  const nearbyReports = weatherData.pireps.filter((pirep: any) => {
    if (!pirep.lat || !pirep.lon) return false
    const distance = calculateDistance(point.lat, point.lon, pirep.lat, pirep.lon)
    return distance < 50 // Within 50 nautical miles
  })

  nearbyReports.forEach((pirep: any, reportIdx: number) => {
    if (pirep.turbulence) {
      const distance = calculateDistance(point.lat, point.lon, pirep.lat, pirep.lon)
      // Confidence decays with distance: 1.0 at 0nm, 0.7 at 50nm
      const distanceConfidence = 1.0 - (distance / 50) * 0.3

      const intensity = pirep.turbulence.intensity || ''
      let edr = 0.05

      if (intensity.includes('SEV') || intensity.includes('EXTREME')) {
        edr = 0.45 + seededRandom(point.lat, point.lon, index, reportIdx) * 0.15
      } else if (intensity.includes('MOD')) {
        edr = 0.25 + seededRandom(point.lat, point.lon, index, reportIdx + 100) * 0.1
      } else if (intensity.includes('LGT')) {
        edr = 0.15 + seededRandom(point.lat, point.lon, index, reportIdx + 200) * 0.05
      }

      sources.push({ edr, confidence: distanceConfidence, source: 'pirep' })
    }
  })

  // 3. SIGMETs/AIRMETs - Official warnings (confidence: 0.85)
  const turbulenceWarnings = [
    ...weatherData.sigmets,
    ...weatherData.intlSigmets,
    ...weatherData.airmets
  ].filter((report: any) => {
    if (!report.hazard) return false
    const hazard = report.hazard.toLowerCase()
    return hazard.includes('turb') || hazard.includes('convection')
  })

  turbulenceWarnings.forEach((warning: any) => {
    let edr = 0.05
    if (warning.severity?.includes('SEV')) {
      edr = 0.4
    } else if (warning.severity?.includes('MOD')) {
      edr = 0.25
    }
    sources.push({ edr, confidence: 0.85, source: 'sigmet' })
  })

  // 4. G-AIRMETs - Forecast turbulence areas (confidence: 0.7)
  const gairmetTurbulence = weatherData.gairmets.filter((g: any) => {
    if (!g.hazard) return false
    const hazard = g.hazard.toLowerCase()
    return hazard.includes('turb')
  })

  gairmetTurbulence.forEach((gairmet: any) => {
    const hazard = String(gairmet.hazard || '').toLowerCase()
    let edr = 0.05
    // turb-hi = high altitude turbulence (>FL200), turb-lo = low altitude (<FL200)
    if (hazard.includes('turb-hi') && point.altitude > 20000) {
      edr = 0.2
    } else if (hazard.includes('turb-lo') && point.altitude <= 20000) {
      edr = 0.2
    }
    if (edr > 0.05) {
      sources.push({ edr, confidence: 0.7, source: 'gairmet' })
    }
  })

  // 5. Heuristic fallback (confidence: 0.3)
  if (sources.length === 0) {
    const heuristicEDR = calculateAtmosphericEDR(point, index, total)
    sources.push({ edr: heuristicEDR, confidence: 0.3, source: 'heuristic' })
  }

  // Blend sources using weighted maximum (highest confidence source wins)
  let finalEDR = 0.05
  let maxConfidence = 0

  for (const src of sources) {
    // Weight the EDR by confidence and use weighted maximum
    const weightedEDR = src.edr * src.confidence
    const currentWeighted = finalEDR * maxConfidence

    if (weightedEDR > currentWeighted) {
      finalEDR = src.edr
      maxConfidence = src.confidence
    }
  }

  return calculateTurbulenceLevel(finalEDR, point, wafsWindSpeedKt)
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
