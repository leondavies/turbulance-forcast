import type { RoutePoint } from '../route/greatCircle'

export type TurbulenceLevel = 'smooth' | 'light' | 'moderate' | 'severe'

export interface TurbulenceData {
  edr: number // Eddy Dissipation Rate (0-1)
  level: TurbulenceLevel
  windSpeed: number // knots
  windDirection: number // degrees
}

export interface SegmentForecast extends RoutePoint {
  turbulence: TurbulenceData
}

/**
 * Generate mock turbulence data for demonstration
 * In production, this would fetch real GRIB2 data from NOAA
 */
export function generateMockTurbulence(waypoints: RoutePoint[]): SegmentForecast[] {
  return waypoints.map((point, index) => {
    // Simulate varying turbulence conditions
    // Higher turbulence over mountains, weather fronts, jet streams
    const baseEDR = generateBaseEDR(point, index, waypoints.length)
    const turbulence = calculateTurbulenceLevel(baseEDR)

    return {
      ...point,
      turbulence,
    }
  })
}

function generateBaseEDR(point: RoutePoint, index: number, total: number): number {
  // Create realistic turbulence patterns
  let edr = 0.05 // Base smooth conditions

  // Add some randomness
  edr += Math.random() * 0.1

  // Simulate jet stream turbulence at cruise altitude (30,000-40,000 ft)
  if (point.altitude > 30000 && point.altitude < 40000) {
    // Add turbulence in the middle of the route (simulating jet stream crossing)
    const middleFraction = Math.abs((index / total) - 0.5)
    if (middleFraction < 0.15) {
      edr += 0.15 + Math.random() * 0.1
    }
  }

  // Simulate mountain wave turbulence (varies by latitude)
  if (Math.abs(point.lat) > 35 && Math.abs(point.lat) < 50) {
    edr += Math.random() * 0.08
  }

  // Simulate occasional convective activity (thunderstorms)
  if (Math.random() < 0.05) {
    edr += 0.2 + Math.random() * 0.15
  }

  // Cap EDR at realistic maximum
  return Math.min(edr, 0.7)
}

function calculateTurbulenceLevel(edr: number): TurbulenceData {
  // EDR thresholds based on industry standards
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

  // Generate wind data
  const windSpeed = Math.round(50 + Math.random() * 150) // 50-200 knots
  const windDirection = Math.round(Math.random() * 360)

  return {
    edr: Math.round(edr * 1000) / 1000, // Round to 3 decimals
    level,
    windSpeed,
    windDirection,
  }
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
