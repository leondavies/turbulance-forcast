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

    // Filter to only show flights for the requested date
    let filteredFlights = flights

    if (date) {
      // Parse the requested date
      const requestedDate = new Date(date)
      const startOfDay = new Date(requestedDate.getFullYear(), requestedDate.getMonth(), requestedDate.getDate())
      const endOfDay = new Date(startOfDay)
      endOfDay.setDate(endOfDay.getDate() + 1)

      filteredFlights = flights.filter(flight => {
        const departureDate = new Date(flight.departure.scheduled)
        return departureDate >= startOfDay && departureDate < endOfDay
      })

      console.log(`Filtered ${flights.length} flights to ${filteredFlights.length} for ${date}`)
    } else {
      // If no date provided, show today and tomorrow
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

      filteredFlights = flights.filter(flight => {
        const departureDate = new Date(flight.departure.scheduled)
        return departureDate >= today && departureDate < dayAfterTomorrow
      })

      console.log(`Filtered ${flights.length} flights to ${filteredFlights.length} (today/tomorrow)`)
    }

    return NextResponse.json({
      success: true,
      count: filteredFlights.length,
      flights: filteredFlights,
    })
  } catch (error) {
    console.error('Flight search error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to search flights',
        success: false,
      },
      { status: 500 }
    )
  }
}
