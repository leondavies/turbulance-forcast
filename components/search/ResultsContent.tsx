'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { Flight } from '@/services/flight/types'

export function ResultsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [flights, setFlights] = useState<Flight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const date = searchParams.get('date')

  useEffect(() => {
    async function fetchFlights() {
      if (!origin || !destination) {
        setError('Missing search parameters')
        setIsLoading(false)
        return
      }

      try {
        const params = new URLSearchParams({
          origin,
          destination,
        })
        if (date) params.set('date', date)

        const res = await fetch(`/api/flights?${params.toString()}`)
        const data = await res.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch flights')
        }

        setFlights(data.flights)
      } catch (err) {
        console.error('Error fetching flights:', err)
        setError(err instanceof Error ? err.message : 'Failed to load flights')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFlights()
  }, [origin, destination, date])

  const formatTime = (date: Date, timezone?: string) => {
    // AviationStack returns times in local timezone but formats them as UTC
    // So we extract the time components directly without timezone conversion
    const d = new Date(date)
    const hours24 = d.getUTCHours()
    const minutes = d.getUTCMinutes().toString().padStart(2, '0')

    // Convert to 12-hour format with AM/PM
    const period = hours24 >= 12 ? 'PM' : 'AM'
    const hours12 = hours24 % 12 || 12 // Convert 0 to 12 for midnight

    return `${hours12}:${minutes} ${period}`
  }

  const formatDuration = (dep: Date, arr: Date) => {
    const diff = new Date(arr).getTime() - new Date(dep).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium text-gray-700">Searching for flights...</p>
              <div className="w-full space-y-2 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
        <div className="container max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Flights</h2>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="mb-4"
          >
            ← Back to Search
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {origin} → {destination}
          </h1>
          <p className="text-gray-600">
            Today's Flights
          </p>
          <p className="text-sm text-gray-500">
            Local timezone - {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Results */}
        {flights.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">✈️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Flights Found</h2>
              <p className="text-gray-600 mb-6">
                We couldn't find any flights for this route on the selected date.
                <br />
                Try searching for a different date or route.
              </p>
              <Button onClick={() => router.push('/')}>
                Try Another Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-lg text-gray-700">
                Found <strong>{flights.length}</strong> flight{flights.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-3">
              {flights.map((flight) => (
                <Card
                  key={flight.id}
                  className="hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer border-2 border-transparent"
                  onClick={() => {
                    const params = new URLSearchParams({
                      origin: flight.origin.iata,
                      destination: flight.destination.iata,
                      flightNumber: flight.flightNumber,
                      departure: new Date(flight.departure.scheduled).toISOString(),
                    })
                    if (flight.aircraft.iata) params.set('aircraft', flight.aircraft.iata)
                    router.push(`/forecast?${params.toString()}`)
                  }}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2 sm:gap-4">
                      {/* Left: Flight Number & Airline */}
                      <div className="flex flex-col min-w-[80px] sm:min-w-[120px]">
                        <div className="text-base sm:text-lg font-bold text-gray-900">
                          {flight.flightNumber}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 truncate">
                          {flight.airline.name}
                        </div>
                      </div>

                      {/* Center: Times and Duration */}
                      <div className="flex-1 flex items-center justify-center gap-2 sm:gap-4 md:gap-6">
                        {/* Departure */}
                        <div className="text-center">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                            {formatTime(flight.departure.scheduled, flight.origin.timezone)}
                          </div>
                          <div className="text-xs text-gray-500 uppercase font-medium">
                            {origin}
                          </div>
                        </div>

                        {/* Arrow & Duration */}
                        <div className="flex flex-col items-center justify-center px-1 sm:px-2">
                          <div className="text-gray-400 text-sm mb-1">✈</div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDuration(flight.departure.scheduled, flight.arrival.scheduled)}
                          </div>
                        </div>

                        {/* Arrival */}
                        <div className="text-center">
                          <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                            {formatTime(flight.arrival.scheduled, flight.destination.timezone)}
                          </div>
                          <div className="text-xs text-gray-500 uppercase font-medium">
                            {destination}
                          </div>
                        </div>
                      </div>

                      {/* Right: View Forecast Button */}
                      <div className="flex items-center flex-shrink-0">
                        <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                          View Forecast
                          <span>→</span>
                        </div>
                        <div className="sm:hidden flex items-center justify-center w-8 h-8 text-blue-600 bg-blue-50 rounded-lg flex-shrink-0">
                          <span className="text-sm">→</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
