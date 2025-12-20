import { NextRequest, NextResponse } from 'next/server'
import { searchFlights } from '@/services/flight/aviationstack'
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

    // Get origin airport timezone to determine "today" in local time
    const originAirport = await prisma.airport.findUnique({
      where: { iata: origin.toUpperCase() },
      select: { timezone: true }
    })

    const flights = await searchFlights({
      depIata: origin.toUpperCase(),
      arrIata: destination.toUpperCase(),
      flightDate: date || undefined,
    })

    // Filter to show TODAY's flights in the AIRPORT's local timezone
    const timezone = originAirport?.timezone || 'UTC'
    const now = new Date()

    // Get today's date in the airport's timezone
    const localDateString = new Date().toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const [month, day, year] = localDateString.split(/[\/,\s]+/)
    const startOfTodayLocal = new Date(`${year}-${month}-${day}T00:00:00`)
    const endOfTodayLocal = new Date(`${year}-${month}-${day}T23:59:59`)

    console.log(`Filtering for today in ${timezone}: ${startOfTodayLocal.toISOString()} to ${endOfTodayLocal.toISOString()}`)

    const filteredFlights = flights.filter(flight => {
      const departureDate = new Date(flight.departure.scheduled)
      // Convert departure to airport's local timezone
      const departureLocalString = departureDate.toLocaleString('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const [depMonth, depDay, depYear] = departureLocalString.split(/[\/,\s]+/)

      // Check if departure is on the same local day
      return depYear === year && depMonth === month && depDay === day
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

    console.log(`Deduplicated from ${filteredFlights.length} to ${deduplicatedFlights.length} flights`)

    return NextResponse.json({
      success: true,
      count: deduplicatedFlights.length,
      flights: deduplicatedFlights,
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
