import { NextRequest, NextResponse } from 'next/server'
import { searchFlights } from '@/services/flight/airlabs'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const date = searchParams.get('date')

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      )
    }

    console.log(`Flight search request: ${origin} → ${destination} on ${date || 'today'}`)

    // Get origin and destination airport timezones
    const [originAirport, destinationAirport] = await Promise.all([
      prisma.airport.findUnique({
        where: { iata: origin.toUpperCase() },
        select: { timezone: true }
      }),
      prisma.airport.findUnique({
        where: { iata: destination.toUpperCase() },
        select: { timezone: true }
      })
    ])

    const flights = await searchFlights({
      depIata: origin.toUpperCase(),
      arrIata: destination.toUpperCase(),
      flightDate: date || undefined,
    })

    // Filter to show TODAY's flights in the AIRPORT's local timezone
    // AviationStack returns times in local timezone but with +00:00 suffix (misleading!)
    // So we can just extract the date portion and compare directly
    const timezone = originAirport?.timezone || 'UTC'

    // Get today's date in the airport's local timezone (format: YYYY-MM-DD)
    const todayInLocalTZ = new Date().toLocaleDateString('en-CA', {
      timeZone: timezone,
    }) // en-CA gives YYYY-MM-DD format

    console.log(`Filtering for today in ${timezone}: ${todayInLocalTZ}`)

    const filteredFlights = flights.filter(flight => {
      // Extract date from AviationStack time (which is in local TZ despite +00:00)
      // Format: "2025-12-21T05:45:00.000Z" -> "2025-12-21"
      const departureDate = new Date(flight.departure.scheduled).toISOString().split('T')[0]

      // Check if departure is on today's date
      return departureDate === todayInLocalTZ
    })

    console.log(`Filtered ${flights.length} flights to ${filteredFlights.length} for TODAY in ${timezone}`)

    // Deduplicate by departure time + route (not flight number, to keep codeshares)
    // This keeps all unique departures but removes exact duplicates
    const flightMap = new Map<string, typeof filteredFlights[0]>()

    for (const flight of filteredFlights) {
      // Only keep scheduled or active flights (skip landed, cancelled, etc)
      if (flight.status !== 'scheduled' && flight.status !== 'active') {
        continue
      }

      // Deduplicate by time + route instead of flight number
      // This keeps codeshares (e.g., NZ576 and SQ4367 on same flight)
      const departureTime = new Date(flight.departure.scheduled).toISOString()
      const key = `${flight.origin.iata}-${flight.destination.iata}-${departureTime}`

      // If we haven't seen this exact departure, add it
      if (!flightMap.has(key)) {
        flightMap.set(key, flight)
      }
    }

    const deduplicatedFlights = Array.from(flightMap.values())

    // Sort by departure time
    deduplicatedFlights.sort((a, b) =>
      new Date(a.departure.scheduled).getTime() - new Date(b.departure.scheduled).getTime()
    )

    // Add timezone information to each flight
    const flightsWithTimezone = deduplicatedFlights.map(flight => ({
      ...flight,
      origin: {
        ...flight.origin,
        timezone: originAirport?.timezone || 'UTC'
      },
      destination: {
        ...flight.destination,
        timezone: destinationAirport?.timezone || 'UTC'
      }
    }))

    console.log(`Deduplicated from ${filteredFlights.length} to ${deduplicatedFlights.length} flights`)

    return NextResponse.json({
      success: true,
      count: flightsWithTimezone.length,
      flights: flightsWithTimezone,
    })
  } catch (error) {
    console.error('Flight search error:', error)

    const message = error instanceof Error ? error.message : 'Failed to search flights'
    // Surface upstream 4xx/403 errors more clearly to the client for debugging.
    const status = /403/.test(message) ? 502 : 500

    return NextResponse.json(
      {
        error: message,
        success: false,
      },
      { status }
    )
  }
}
