import type { AviationStackResponse, AviationStackFlight, Flight } from './types'
import { prisma } from '@/lib/db'

// Default to HTTP to support free AviationStack plans which do not allow HTTPS.
// Allow override via env if you are on a paid plan that supports HTTPS.
const DEFAULT_API_URL = 'http://api.aviationstack.com/v1'
const AVIATIONSTACK_API_URL = process.env.AVIATIONSTACK_API_URL || DEFAULT_API_URL
const API_KEY = process.env.AVIATIONSTACK_API_KEY
const ENABLE_DATE_FILTER = process.env.AVIATIONSTACK_ENABLE_DATE_FILTER === 'true'

if (!API_KEY) {
  console.error('❌ AVIATIONSTACK_API_KEY is not set')
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('AVIATION')))
} else {
  console.log('✓ AVIATIONSTACK_API_KEY loaded:', API_KEY.substring(0, 8) + '...')
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
  url.searchParams.append('limit', '100') // Limit results to reduce noise

  // Add flight_date parameter only if explicitly enabled (Basic+ plan)
  if (params.flightDate && ENABLE_DATE_FILTER) {
    url.searchParams.append('flight_date', params.flightDate)
    console.log('Fetching flights from AviationStack:', params.depIata, '→', params.arrIata, 'on', params.flightDate)
  } else {
    console.log('Fetching flights from AviationStack:', params.depIata, '→', params.arrIata)
    if (params.flightDate && !ENABLE_DATE_FILTER) {
      console.log('Skipping flight_date filter because AVIATIONSTACK_ENABLE_DATE_FILTER is not enabled.')
    }
  }

  // Helper to perform the request to a given URL (used for http/https retry logic)
  async function performRequest(targetUrl: string): Promise<Response> {
    return fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TurbCast/1.0)',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })
  }

  let response = await performRequest(url.toString())

  // If HTTPS is used on a free plan, AviationStack may return 403. Retry over HTTP once.
  if (!response.ok && response.status === 403 && url.protocol === 'https:') {
    try {
      const httpUrl = new URL(url.toString())
      httpUrl.protocol = 'http:'
      console.warn('AviationStack returned 403 over HTTPS. Retrying over HTTP…')
      response = await performRequest(httpUrl.toString())
    } catch {
      // swallow; we will handle below
    }
  }

  if (!response.ok) {
    let details: string | undefined
    try {
      // AviationStack often returns JSON with an "error" object
      const maybeJson = await response.json()
      details = JSON.stringify(maybeJson)
    } catch {
      details = await response.text()
    }
    console.error('AviationStack API error:', response.status, details)
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
    id: `${asFlightInfo.flight?.iata || asFlightInfo.flight?.number || 'UNKNOWN'}-${asFlightInfo.flight_date}`,
    flightNumber: asFlightInfo.flight?.iata || asFlightInfo.flight?.number || 'UNKNOWN',
    airline: {
      name: asFlightInfo.airline?.name || 'Unknown Airline',
      iata: asFlightInfo.airline?.iata || '',
      icao: asFlightInfo.airline?.icao || '',
    },
    origin: {
      iata: asFlightInfo.departure?.iata || '',
      icao: asFlightInfo.departure?.icao || '',
      name: asFlightInfo.departure?.airport || 'Unknown Airport',
    },
    destination: {
      iata: asFlightInfo.arrival?.iata || '',
      icao: asFlightInfo.arrival?.icao || '',
      name: asFlightInfo.arrival?.airport || 'Unknown Airport',
    },
    departure: {
      scheduled: new Date(asFlightInfo.departure?.scheduled || Date.now()),
      estimated: new Date(asFlightInfo.departure?.estimated || asFlightInfo.departure?.scheduled || Date.now()),
    },
    arrival: {
      scheduled: new Date(asFlightInfo.arrival?.scheduled || Date.now()),
      estimated: new Date(asFlightInfo.arrival?.estimated || asFlightInfo.arrival?.scheduled || Date.now()),
    },
    aircraft: {
      type: aircraftName,
      iata: asFlightInfo.aircraft?.iata || null,
      registration: asFlightInfo.aircraft?.registration || null,
    },
    status: normalizeStatus(asFlightInfo.flight_status),
  }
}

function normalizeStatus(status?: string | null): Flight['status'] {
  const statusMap: Record<string, Flight['status']> = {
    scheduled: 'scheduled',
    active: 'active',
    landed: 'landed',
    cancelled: 'cancelled',
    incident: 'incident',
    diverted: 'diverted',
  }

  if (!status || typeof status !== 'string') return 'scheduled'
  return statusMap[status.toLowerCase()] || 'scheduled'
}
