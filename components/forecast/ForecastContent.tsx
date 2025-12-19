'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, Loading, Button } from '@/components/ui'
import { TurbulenceMap } from './TurbulenceMap'
import { TurbulenceSummary } from './TurbulenceSummary'
import { RouteSegments } from './RouteSegments'
import { TurbulenceChart } from './TurbulenceChart'

interface ForecastData {
  success: boolean
  flightNumber: string
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Loading text="Generating turbulence forecast..." size="lg" />
      </div>
    )
  }

  if (error || !forecast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            ← Back
          </Button>

          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-white/20">
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
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6">
          <TurbulenceSummary
            summary={forecast.summary}
            route={forecast.route}
          />
        </div>

        {/* Turbulence Chart */}
        <div className="mb-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-white/20 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Turbulence Forecast Chart</h2>
              <p className="text-gray-600 mt-1">Turbulence levels throughout your flight</p>
            </div>
            <TurbulenceChart
              forecast={forecast.forecast}
              route={forecast.route}
              origin={forecast.origin.iata}
              destination={forecast.destination.iata}
            />
          </div>
        </div>

        {/* Map */}
        <div className="mb-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-white/20">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900">Flight Path & Route Map</h2>
              <p className="text-gray-600 mt-1">Geographic visualization of your route</p>
            </div>
            <div className="h-[500px]">
              <TurbulenceMap
                origin={forecast.origin}
                destination={forecast.destination}
                forecast={forecast.forecast}
              />
            </div>
          </div>
        </div>

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
