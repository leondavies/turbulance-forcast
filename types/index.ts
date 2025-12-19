// Airport types
export interface Airport {
  id: string
  iata: string
  icao: string
  name: string
  city: string
  country: string
  latitude: number
  longitude: number
  elevation: number
  timezone: string
}

// Aircraft types
export interface Aircraft {
  id: string
  iata: string
  name: string
  manufacturer: string
  maxTakeoffWeight: number
  wingArea: number | null
  cruiseSpeed: number
  cruiseAltitude: number
  typicalFlightLevel: number
  category: 'light' | 'medium' | 'heavy'
}

// Flight search types
export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  aircraftType?: string
}

// Turbulence types
export type TurbulenceLevel = 'smooth' | 'light' | 'moderate' | 'severe' | 'extreme'

export interface ForecastSegment {
  segmentIndex: number
  coordinate: {
    lat: number
    lon: number
  }
  distanceFromOrigin: number // km
  altitude: number // feet
  edr: number
  turbulenceLevel: TurbulenceLevel
  wind: {
    speed: number // knots
    direction: number // degrees
  }
  hasThunderstorms: boolean
}

export interface WeatherForecast {
  id: string
  routeId: string
  generatedAt: Date
  validFrom: Date
  validUntil: Date
  segments: ForecastSegment[]
  summary: {
    maxEDR: number
    maxTurbulenceLevel: TurbulenceLevel
    turbulentSegmentCount: number
    smoothPercentage: number
  }
}
