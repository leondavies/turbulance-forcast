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

    return NextResponse.json({
      success: true,
      count: flights.length,
      flights,
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
