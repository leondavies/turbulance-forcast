import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query) {
      // Return all airports if no query
      const airports = await prisma.airport.findMany({
        orderBy: { name: 'asc' },
        take: 50,
      })

      return NextResponse.json({
        success: true,
        airports,
      })
    }

    // Search airports by IATA, ICAO, name, or city
    const searchTerm = query.toUpperCase()

    const airports = await prisma.airport.findMany({
      where: {
        OR: [
          { iata: { contains: searchTerm, mode: 'insensitive' } },
          { icao: { contains: searchTerm, mode: 'insensitive' } },
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { city: { contains: searchTerm, mode: 'insensitive' } },
          { country: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: [
        { iata: 'asc' },
      ],
      take: 20,
    })

    return NextResponse.json({
      success: true,
      count: airports.length,
      airports,
    })
  } catch (error) {
    console.error('Airport search error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to search airports',
        success: false,
      },
      { status: 500 }
    )
  }
}
