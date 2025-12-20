import type { AviationStackResponse, AviationStackFlight, Flight } from './types'
import { prisma } from '@/lib/db'

const AVIATIONSTACK_API_URL = 'https://api.aviationstack.com/v1'
const API_KEY = process.env.AVIATIONSTACK_API_KEY

if (!API_KEY) {
  console.warn('AVIATIONSTACK_API_KEY is not set')
}

// Cache for aircraft lookups to avoid repeated DB queries
const aircraftCache = new Map<string, string>()

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

  // NOTE: flight_date parameter requires a paid plan (Basic+)
  // Free plan only supports real-time flights
  // params.flightDate is accepted but ignored for now

  console.log('Fetching flights from AviationStack:', params.depIata, '→', params.arrIata)

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TurbCast/1.0)',
      'Accept': 'application/json',
    },
    cache: 'no-store', // Disable Next.js caching for now
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('AviationStack API error:', response.status, errorText)
    throw new Error(`AviationStack API error: ${response.status} ${response.statusText}`)
  }

  const data: AviationStackResponse = await response.json()

  console.log(`Found ${data.data.length} flights from AviationStack`)

  // Transform AviationStack data to our Flight type (with async aircraft lookup)
  const transformedFlights = await Promise.all(
    data.data.map(flight => transformFlight(flight))
  )

  return transformedFlights
}

async function getAircraftName(iataCode: string | null): Promise<string> {
  if (!iataCode) return 'Unknown'

  // Check cache first
  if (aircraftCache.has(iataCode)) {
    return aircraftCache.get(iataCode)!
  }

  try {
    const aircraft = await prisma.aircraft.findUnique({
      where: { iata: iataCode },
      select: { name: true }
    })

    const name = aircraft?.name || iataCode // Fallback to IATA code if not found
    aircraftCache.set(iataCode, name)
    return name
  } catch (error) {
    console.error(`Failed to lookup aircraft ${iataCode}:`, error)
    return iataCode
  }
}

async function transformFlight(asFlightInfo: AviationStackFlight): Promise<Flight> {
  const aircraftName = await getAircraftName(asFlightInfo.aircraft?.iata || null)

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
      type: aircraftName,
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
