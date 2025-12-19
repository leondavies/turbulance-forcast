import type { AviationStackResponse, AviationStackFlight, Flight } from './types'

const AVIATIONSTACK_API_URL = 'http://api.aviationstack.com/v1'
const API_KEY = process.env.AVIATIONSTACK_API_KEY

if (!API_KEY) {
  console.warn('AVIATIONSTACK_API_KEY is not set')
}

export async function searchFlights(params: {
  depIata: string
  arrIata: string
  flightDate?: string
}): Promise<Flight[]> {
  if (!API_KEY) {
    throw new Error('AviationStack API key is not configured')
  }

  const url = new URL(`${AVIATIONSTACK_API_URL}/flights`)
  url.searchParams.append('access_key', API_KEY)
  url.searchParams.append('dep_iata', params.depIata)
  url.searchParams.append('arr_iata', params.arrIata)

  if (params.flightDate) {
    url.searchParams.append('flight_date', params.flightDate)
  }

  console.log('Fetching flights from AviationStack:', url.toString().replace(API_KEY, 'API_KEY_HIDDEN'))

  const response = await fetch(url.toString(), {
    next: { revalidate: 300 } // Cache for 5 minutes
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('AviationStack API error:', response.status, errorText)
    throw new Error(`AviationStack API error: ${response.status} ${response.statusText}`)
  }

  const data: AviationStackResponse = await response.json()

  console.log(`Found ${data.data.length} flights from AviationStack`)

  // Transform AviationStack data to our Flight type
  return data.data.map(transformFlight)
}

function transformFlight(asFlightInfo: AviationStackFlight): Flight {
  return {
    id: `${asFlightInfo.flight.iata}-${asFlightInfo.flight_date}`,
    flightNumber: asFlightInfo.flight.iata,
    airline: {
      name: asFlightInfo.airline.name,
      iata: asFlightInfo.airline.iata,
      icao: asFlightInfo.airline.icao,
    },
    origin: {
      iata: asFlightInfo.departure.iata,
      icao: asFlightInfo.departure.icao,
      name: asFlightInfo.departure.airport,
    },
    destination: {
      iata: asFlightInfo.arrival.iata,
      icao: asFlightInfo.arrival.icao,
      name: asFlightInfo.arrival.airport,
    },
    departure: {
      scheduled: new Date(asFlightInfo.departure.scheduled),
      estimated: new Date(asFlightInfo.departure.estimated || asFlightInfo.departure.scheduled),
    },
    arrival: {
      scheduled: new Date(asFlightInfo.arrival.scheduled),
      estimated: new Date(asFlightInfo.arrival.estimated || asFlightInfo.arrival.scheduled),
    },
    aircraft: {
      type: asFlightInfo.aircraft?.iata || 'Unknown',
      iata: asFlightInfo.aircraft?.iata || null,
      registration: asFlightInfo.aircraft?.registration || null,
    },
    status: normalizeStatus(asFlightInfo.flight_status),
  }
}

function normalizeStatus(status: string): Flight['status'] {
  const statusMap: Record<string, Flight['status']> = {
    scheduled: 'scheduled',
    active: 'active',
    landed: 'landed',
    cancelled: 'cancelled',
    incident: 'incident',
    diverted: 'diverted',
  }

  return statusMap[status.toLowerCase()] || 'scheduled'
}
