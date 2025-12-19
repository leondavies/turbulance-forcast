// AviationStack API Response Types
export interface AviationStackFlight {
  flight_date: string
  flight_status: string
  departure: {
    airport: string
    timezone: string
    iata: string
    icao: string
    terminal: string | null
    gate: string | null
    delay: number | null
    scheduled: string
    estimated: string
    actual: string | null
    estimated_runway: string | null
    actual_runway: string | null
  }
  arrival: {
    airport: string
    timezone: string
    iata: string
    icao: string
    terminal: string | null
    gate: string | null
    baggage: string | null
    delay: number | null
    scheduled: string
    estimated: string
    actual: string | null
    estimated_runway: string | null
    actual_runway: string | null
  }
  airline: {
    name: string
    iata: string
    icao: string
  }
  flight: {
    number: string
    iata: string
    icao: string
    codeshared: {
      airline_name: string
      airline_iata: string
      airline_icao: string
      flight_number: string
      flight_iata: string
      flight_icao: string
    } | null
  }
  aircraft: {
    registration: string | null
    iata: string | null
    icao: string | null
    icao24: string | null
  } | null
  live: {
    updated: string
    latitude: number
    longitude: number
    altitude: number
    direction: number
    speed_horizontal: number
    speed_vertical: number
    is_ground: boolean
  } | null
}

export interface AviationStackResponse {
  pagination: {
    limit: number
    offset: number
    count: number
    total: number
  }
  data: AviationStackFlight[]
}

// Our normalized flight type
export interface Flight {
  id: string
  flightNumber: string
  airline: {
    name: string
    iata: string
    icao: string
  }
  origin: {
    iata: string
    icao: string
    name: string
  }
  destination: {
    iata: string
    icao: string
    name: string
  }
  departure: {
    scheduled: Date
    estimated: Date
  }
  arrival: {
    scheduled: Date
    estimated: Date
  }
  aircraft: {
    type: string
    iata: string | null
    registration: string | null
  }
  status: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted'
}
