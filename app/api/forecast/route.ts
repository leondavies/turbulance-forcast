import { NextRequest, NextResponse } from 'next/server'
import { calculateGreatCircleRoute } from '@/services/route/greatCircle'
import { generateTurbulenceForecast } from '@/services/weather/aviationWeather'
import { prisma } from '@/lib/db'
import { getCachedForecast, setCachedForecast } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const originIata = searchParams.get('origin')
    const destinationIata = searchParams.get('destination')
    const flightNumber = searchParams.get('flightNumber')

    if (!originIata || !destinationIata) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `${originIata.toUpperCase()}-${destinationIata.toUpperCase()}`
    const cached = await getCachedForecast(cacheKey)

    if (cached) {
      console.log(`Cache hit for ${cacheKey}`)
      return NextResponse.json({
        ...cached,
        cached: true,
        cacheHit: true
      })
    }

    console.log(`Cache miss for ${cacheKey}, generating forecast...`)

    // Get airport coordinates from database
    const [origin, destination] = await Promise.all([
      prisma.airport.findUnique({ where: { iata: originIata.toUpperCase() } }),
      prisma.airport.findUnique({ where: { iata: destinationIata.toUpperCase() } }),
    ])

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Airport not found' },
        { status: 404 }
      )
    }

    // Calculate Great Circle route
    const route = calculateGreatCircleRoute(
      { lat: origin.latitude, lon: origin.longitude },
      { lat: destination.latitude, lon: destination.longitude },
      50 // 50 km waypoint spacing
    )

    // Generate turbulence forecast using real Aviation Weather Center data
    const forecastResult = await generateTurbulenceForecast(route.waypoints)
    const forecast = forecastResult.segments

    // Calculate summary statistics
    const maxTurbulence = Math.max(...forecast.map(f => f.turbulence.edr))
    const maxTurbulenceLevel = forecast.reduce((max, f) => {
      const levels = { smooth: 0, light: 1, moderate: 2, severe: 3 }
      return levels[f.turbulence.level] > levels[max.turbulence.level] ? f : max
    }).turbulence.level

    const levelCounts = forecast.reduce((acc, f) => {
      acc[f.turbulence.level] = (acc[f.turbulence.level] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const smoothPercentage = Math.round(
      ((levelCounts.smooth || 0) / forecast.length) * 100
    )

    const response = {
      success: true,
      flightNumber: flightNumber || `${originIata}-${destinationIata}`,
      origin: {
        iata: origin.iata,
        icao: origin.icao,
        name: origin.name,
        city: origin.city,
        country: origin.country,
        lat: origin.latitude,
        lon: origin.longitude,
      },
      destination: {
        iata: destination.iata,
        icao: destination.icao,
        name: destination.name,
        city: destination.city,
        country: destination.country,
        lat: destination.latitude,
        lon: destination.longitude,
      },
      route: {
        totalDistance: route.totalDistance,
        cruiseAltitude: route.cruiseAltitude,
        estimatedDuration: route.estimatedDuration,
      },
      forecast,
      summary: {
        maxEDR: maxTurbulence,
        maxTurbulenceLevel,
        smoothPercentage,
        levelCounts,
      },
      metadata: {
        ...forecastResult.metadata,
        lastUpdated: forecastResult.metadata.lastUpdated.toISOString()
      },
      cached: false,
      cacheHit: false
    }

    // Store in cache for future requests
    await setCachedForecast(cacheKey, response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Forecast error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate forecast',
        success: false,
      },
      { status: 500 }
    )
  }
}
