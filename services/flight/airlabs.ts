import type { Flight } from './types'
import { prisma } from '@/lib/db'

const AIRLABS_API_URL = 'https://airlabs.co/api/v9'
const API_KEY = process.env.AIRLABS_API_KEY

if (!API_KEY) {
  console.error('❌ AIRLABS_API_KEY is not set')
} else {
  console.log('✓ AIRLABS_API_KEY loaded:', API_KEY.substring(0, 8) + '...')
}

// Cache for aircraft lookups to avoid repeated DB queries
const aircraftCache = new Map<string, string>()

interface AirLabsFlight {
  flight_iata?: string
  flight_icao?: string
  flight_number?: string
  airline_iata?: string
  airline_icao?: string
  dep_iata?: string
  dep_icao?: string
  arr_iata?: string
  arr_icao?: string
  dep_time?: string
  arr_time?: string
  dep_estimated?: string
  arr_estimated?: string
  dep_actual?: string
  arr_actual?: string
  status?: string
  duration?: number
  delayed?: number
  dep_delayed?: number
  arr_delayed?: number
  aircraft_icao?: string
  reg_number?: string
  dep_terminal?: string
  dep_gate?: string
  arr_terminal?: string
  arr_gate?: string
  arr_baggage?: string
  cs_flight_iata?: string
  cs_airline_iata?: string
}

interface AirLabsResponse {
  response: AirLabsFlight[]
  request?: {
    lang?: string
    currency?: string
    time?: number
    id?: string
    server?: string
    host?: string
    pid?: number
    key?: {
      id?: number
      api_key?: string
      type?: string
      expired?: string
      registered?: string
      upgraded?: string | null
      limits_by_hour?: number
      limits_by_minute?: number
      limits_by_month?: number
      limits_total?: number
      limits_total_used?: number
    }
    params?: any[]
    version?: number
    method?: string
    client?: {
      ip?: string
      geo?: any
      connection?: any
      device?: any
      agent?: any
      karma?: any
    }
  }
  terms?: string
  error?: {
    message?: string
    code?: string
  }
}

export async function searchFlights(params: {
  depIata: string
  arrIata: string
  flightDate?: string
}): Promise<Flight[]> {
  if (!API_KEY) {
    throw new Error('AirLabs API key is not configured')
  }

  // AirLabs schedules endpoint - returns flights up to 10 hours ahead
  const url = new URL(`${AIRLABS_API_URL}/schedules`)
  url.searchParams.append('api_key', API_KEY)
  url.searchParams.append('dep_iata', params.depIata)
  url.searchParams.append('arr_iata', params.arrIata)

  console.log('Fetching flights from AirLabs:', params.depIata, '→', params.arrIata)

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TurbCast/1.0)',
      'Accept': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('AirLabs API error:', response.status, errorText)
    throw new Error(`AirLabs API error: ${response.status} ${response.statusText}`)
  }

  const data: AirLabsResponse = await response.json()

  // Check for API errors
  if (data.error) {
    console.error('AirLabs API error:', data.error)
    throw new Error(`AirLabs API error: ${data.error.message || data.error.code}`)
  }

  if (!data.response || !Array.isArray(data.response)) {
    console.error('Unexpected AirLabs response format:', data)
    return []
  }

  console.log(`Found ${data.response.length} flights from AirLabs`)

  // Filter out codeshares - only keep operating carriers (passenger flights)
  // If cs_flight_iata is not null, it's a codeshare of another flight
  const operatingFlights = data.response.filter(flight => !flight.cs_flight_iata)

  console.log(`Filtered to ${operatingFlights.length} operating carrier flights (removed ${data.response.length - operatingFlights.length} codeshares)`)

  // Transform AirLabs data to our Flight type
  const transformedFlights = await Promise.all(
    operatingFlights.map(flight => transformFlight(flight))
  )

  return transformedFlights
}

async function getAircraftName(icaoCode: string | null): Promise<string> {
  if (!icaoCode) return 'Unknown'

  // Check cache first
  if (aircraftCache.has(icaoCode)) {
    return aircraftCache.get(icaoCode)!
  }

  try {
    const aircraft = await prisma.aircraft.findUnique({
      where: { icao: icaoCode },
      select: { name: true }
    })

    const name = aircraft?.name || icaoCode // Fallback to ICAO code if not found
    aircraftCache.set(icaoCode, name)
    return name
  } catch (error) {
    console.error(`Failed to lookup aircraft ${icaoCode}:`, error)
    return icaoCode
  }
}

async function getAirportName(iata: string): Promise<string> {
  try {
    const airport = await prisma.airport.findUnique({
      where: { iata: iata.toUpperCase() },
      select: { name: true }
    })
    return airport?.name || 'Unknown Airport'
  } catch (error) {
    console.error(`Failed to lookup airport ${iata}:`, error)
    return 'Unknown Airport'
  }
}

function getAirlineName(iata: string | null): {name: string, icao: string} {
  if (!iata) return {name: 'Unknown Airline', icao: ''}

  // Map of common airline IATA codes to names
  const airlineNames: Record<string, {name: string, icao: string}> = {
    'NZ': {name: 'Air New Zealand', icao: 'ANZ'},
    'JQ': {name: 'Jetstar', icao: 'JST'},
    'QF': {name: 'Qantas', icao: 'QFA'},
    'EY': {name: 'Etihad Airways', icao: 'ETD'},
    'BR': {name: 'EVA Air', icao: 'EVA'},
    'EK': {name: 'Emirates', icao: 'UAE'},
    'FJ': {name: 'Fiji Airways', icao: 'FJI'},
    'NH': {name: 'All Nippon Airways', icao: 'ANA'},
    'OZ': {name: 'Asiana Airlines', icao: 'AAR'},
    'SQ': {name: 'Singapore Airlines', icao: 'SIA'},
    'TK': {name: 'Turkish Airlines', icao: 'THY'},
    'AC': {name: 'Air Canada', icao: 'ACA'},
  }

  return airlineNames[iata.toUpperCase()] || {name: iata, icao: ''}
}

async function transformFlight(airLabsFlight: AirLabsFlight): Promise<Flight> {
  const aircraftName = await getAircraftName(airLabsFlight.aircraft_icao || null)
  const [depAirportName, arrAirportName] = await Promise.all([
    getAirportName(airLabsFlight.dep_iata || ''),
    getAirportName(airLabsFlight.arr_iata || ''),
  ])
  const airline = getAirlineName(airLabsFlight.airline_iata || null)

  // AirLabs returns times in format "2025-12-21 05:45" (local airport time, 24-hour)
  // We need to convert to Date object
  function parseAirLabsTime(timeStr: string | null | undefined): Date {
    if (!timeStr) return new Date()

    // Format is "YYYY-MM-DD HH:MM" in local timezone
    // Example: "2025-12-21 05:45"
    const parts = timeStr.split(' ')
    if (parts.length !== 2) return new Date()

    const [datePart, timePart] = parts
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)

    // Create date in UTC with these values
    // (AirLabs dep_time/arr_time are in local airport timezone)
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))

    return date
  }

  const depScheduled = parseAirLabsTime(airLabsFlight.dep_time)
  const arrScheduled = parseAirLabsTime(airLabsFlight.arr_time)

  return {
    id: `${airLabsFlight.flight_iata || airLabsFlight.flight_number || 'UNKNOWN'}-${new Date().toISOString().split('T')[0]}`,
    flightNumber: airLabsFlight.flight_iata || airLabsFlight.flight_number || 'UNKNOWN',
    airline: {
      name: airline.name,
      iata: airLabsFlight.airline_iata || '',
      icao: airLabsFlight.airline_icao || airline.icao || '',
    },
    origin: {
      iata: airLabsFlight.dep_iata || '',
      icao: airLabsFlight.dep_icao || '',
      name: depAirportName,
    },
    destination: {
      iata: airLabsFlight.arr_iata || '',
      icao: airLabsFlight.arr_icao || '',
      name: arrAirportName,
    },
    departure: {
      scheduled: depScheduled,
      estimated: airLabsFlight.dep_estimated
        ? parseAirLabsTime(airLabsFlight.dep_estimated)
        : depScheduled,
    },
    arrival: {
      scheduled: arrScheduled,
      estimated: airLabsFlight.arr_estimated
        ? parseAirLabsTime(airLabsFlight.arr_estimated)
        : arrScheduled,
    },
    aircraft: {
      type: aircraftName,
      iata: null, // AirLabs doesn't provide IATA aircraft code
      registration: airLabsFlight.reg_number || null,
    },
    status: normalizeStatus(airLabsFlight.status),
  }
}

function normalizeStatus(status?: string | null): Flight['status'] {
  if (!status || typeof status !== 'string') return 'scheduled'

  const statusLower = status.toLowerCase()

  // AirLabs statuses: scheduled, en-route, landed, cancelled, diverted, unknown
  if (statusLower.includes('route') || statusLower.includes('active')) return 'active'
  if (statusLower.includes('land')) return 'landed'
  if (statusLower.includes('cancel')) return 'cancelled'
  if (statusLower.includes('divert')) return 'diverted'

  return 'scheduled'
}
