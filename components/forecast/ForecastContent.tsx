'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/skeleton'
import { TurbulenceMap } from './TurbulenceMap'
import { TurbulenceSummary } from './TurbulenceSummary'
import { RouteSegments } from './RouteSegments'
import { TurbulenceChart } from './TurbulenceChart'
import { WindChart } from './WindChart'
import { DataSources } from './DataSources'
import { FullPageLoader } from '@/components/ui/FullPageLoader'

interface ForecastData {
  success: boolean
  flightNumber: string
  cached?: boolean
  cacheHit?: boolean
  origin: {
    iata: string
    name: string
    city: string
    country: string
    lat: number
    lon: number
  }
  destination: {
    iata: string
    name: string
    city: string
    country: string
    lat: number
    lon: number
  }
  route: {
    totalDistance: number
    cruiseAltitude: number
    estimatedDuration: number
  }
  forecast: Array<{
    lat: number
    lon: number
    altitude: number
    distanceFromOrigin: number
    turbulence: {
      edr: number
      level: string
      windSpeed: number
      windDirection: number
    }
  }>
  summary: {
    maxEDR: number
    maxTurbulenceLevel: string
    smoothPercentage: number
    levelCounts: Record<string, number>
  }
  metadata?: {
    pirepCount: number
    sigmetCount: number
    airmetCount: number
    dataQuality: 'high' | 'medium' | 'low'
    lastUpdated: string
    usingFallback: boolean
  }
}

export function ForecastContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const flightNumber = searchParams.get('flightNumber')
  const departure = searchParams.get('departure')
  const aircraft = searchParams.get('aircraft')

  useEffect(() => {
    async function fetchForecast() {
      if (!origin || !destination) {
        setError('Missing flight information')
        setIsLoading(false)
        return
      }

      try {
        const params = new URLSearchParams({ origin, destination })
        if (flightNumber) params.set('flightNumber', flightNumber)
        if (departure) params.set('departure', departure)
        if (aircraft) params.set('aircraft', aircraft)

        const res = await fetch(`/api/forecast?${params.toString()}`)
        const data = await res.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to load forecast')
        }

        setForecast(data)
      } catch (err) {
        console.error('Error fetching forecast:', err)
        setError(err instanceof Error ? err.message : 'Failed to load forecast')
      } finally {
        setIsLoading(false)
      }
    }

    fetchForecast()
  }, [origin, destination, flightNumber])

  if (isLoading) {
    return <FullPageLoader label="Generating turbulence forecast..." sublabel="Analysing conditions along your route." />
  }

  if (error || !forecast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-sky/10 to-white p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Forecast</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/')}>
                Back to Search
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-sky/10 via-white to-white py-12">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            ← Back
          </Button>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {forecast.flightNumber}
                  </h1>
                  <p className="text-xl text-gray-600">
                    {forecast.origin.iata} → {forecast.destination.iata}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {forecast.origin.city}, {forecast.origin.country} → {forecast.destination.city}, {forecast.destination.country}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-500">Distance</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(forecast.route.totalDistance)} km
                  </div>
                  <div className="text-sm text-gray-500 mt-2">Duration</div>
                  <div className="text-lg font-semibold text-gray-700">
                    ~{Math.floor(forecast.route.estimatedDuration / 60)}h {forecast.route.estimatedDuration % 60}m
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Turbulence Chart - FIRST! */}
        <div className="mb-6">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl">Turbulence Forecast Chart</CardTitle>
              <CardDescription>Turbulence levels throughout your flight</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <TurbulenceChart
                forecast={forecast.forecast}
                route={forecast.route}
                origin={forecast.origin.iata}
                destination={forecast.destination.iata}
              />
            </CardContent>
          </Card>
        </div>

        {/* Wind Chart */}
        <div className="mb-6">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-2xl">Wind Forecast Chart</CardTitle>
              <CardDescription>Wind conditions and headwind/tailwind analysis</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <WindChart
                forecast={forecast.forecast}
                route={forecast.route}
                origin={forecast.origin.iata}
                destination={forecast.destination.iata}
                originCoords={{ lat: forecast.origin.lat, lon: forecast.origin.lon }}
                destinationCoords={{ lat: forecast.destination.lat, lon: forecast.destination.lon }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="mb-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl">Flight Path & Route Map</CardTitle>
              <CardDescription>Geographic visualization of your route</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px]">
                <TurbulenceMap
                  origin={forecast.origin}
                  destination={forecast.destination}
                  forecast={forecast.forecast}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="mb-6">
          <TurbulenceSummary
            summary={forecast.summary}
            route={forecast.route}
          />
        </div>

        {/* Data sources (optional) */}
        {forecast.metadata && (
          <div className="mb-6">
            <DataSources metadata={forecast.metadata} cached={forecast.cached} />
          </div>
        )}

        {/* Route Segments */}
        <div>
          <RouteSegments
            forecast={forecast.forecast}
            origin={forecast.origin.iata}
            destination={forecast.destination.iata}
          />
        </div>
      </div>
    </div>
  )
}
