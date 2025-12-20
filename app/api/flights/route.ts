import { NextRequest, NextResponse } from 'next/server'
import { searchFlights } from '@/services/flight/aviationstack'

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

    const flights = await searchFlights({
      depIata: origin.toUpperCase(),
      arrIata: destination.toUpperCase(),
      flightDate: date || undefined,
    })

    // Filter to only show TODAY's flights
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)

    const filteredFlights = flights.filter(flight => {
      const departureDate = new Date(flight.departure.scheduled)
      return departureDate >= startOfToday && departureDate < endOfToday
    })

    console.log(`Filtered ${flights.length} flights to ${filteredFlights.length} for TODAY (${startOfToday.toDateString()})`)

    // Deduplicate by flight number (keep only the most recent scheduled flight)
    const flightMap = new Map<string, typeof filteredFlights[0]>()

    for (const flight of filteredFlights) {
      const key = `${flight.flightNumber}-${flight.departure.scheduled.toISOString().split('T')[0]}`

      // Only keep scheduled or active flights (skip landed, cancelled, etc)
      if (flight.status !== 'scheduled' && flight.status !== 'active') {
        continue
      }

      // If we haven't seen this flight, or this one is more relevant
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
