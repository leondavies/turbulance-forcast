'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { Flight } from '@/services/flight/types'
import { airlineInitials, airlineLogoSrc } from '@/lib/airlines/logos'
import { FullPageLoader } from '@/components/ui/FullPageLoader'

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

  const formatTime24 = (date: Date, timezone?: string) => {
    // AviationStack returns times in local timezone but formats them as UTC
    // So we extract the time components directly without timezone conversion
    const d = new Date(date)
    const hours24 = d.getUTCHours()
    const minutes = d.getUTCMinutes().toString().padStart(2, '0')
    return `${hours24.toString().padStart(2, '0')}:${minutes}`
  }

  const formatDuration = (dep: Date, arr: Date) => {
    const diff = new Date(arr).getTime() - new Date(dep).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  if (isLoading) {
    return <FullPageLoader label="Searching for flights..." sublabel="This usually takes a few seconds." />
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
                  <CardContent className="p-4 sm:p-4">
                    {(() => {
                      const dep = formatTime24(
                        flight.departure.scheduled,
                        flight.origin.timezone
                      )
                      const arr = formatTime24(
                        flight.arrival.scheduled,
                        flight.destination.timezone
                      )

                      return (
                        <>
                          {/* Mobile layout */}
                          <div className="sm:hidden flex items-start gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center overflow-hidden flex-shrink-0">
                              {airlineLogoSrc(flight.airline) ? (
                                <img
                                  src={airlineLogoSrc(flight.airline)!}
                                  alt={`${flight.airline.name} logo`}
                                  className="w-full h-full object-contain p-1"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.currentTarget
                                    target.style.display = 'none'
                                  }}
                                />
                              ) : null}
                              <span className="text-sm font-bold text-gray-700">
                                {airlineInitials(flight.airline.name)}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-lg font-bold text-gray-900 leading-tight">
                                    {flight.flightNumber}
                                  </div>
                                  <div className="text-sm text-gray-600 truncate">
                                    {flight.airline.name}
                                  </div>
                                </div>

                                <div className="flex items-center justify-center w-10 h-10 text-blue-600 bg-blue-50 rounded-xl flex-shrink-0">
                                  <span className="text-lg">→</span>
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="text-base font-bold text-gray-900 tabular-nums whitespace-nowrap">
                                  {dep} <span className="text-gray-400 font-semibold">–</span> {arr}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tablet/Desktop layout */}
                          <div className="hidden sm:flex items-center justify-between gap-4 min-w-0">
                            {/* Left: Flight Number & Airline */}
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center overflow-hidden flex-shrink-0">
                                {airlineLogoSrc(flight.airline) ? (
                                  <img
                                    src={airlineLogoSrc(flight.airline)!}
                                    alt={`${flight.airline.name} logo`}
                                    className="w-full h-full object-contain p-1"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.currentTarget
                                      target.style.display = 'none'
                                    }}
                                  />
                                ) : null}
                                <span className="text-sm font-bold text-gray-700">
                                  {airlineInitials(flight.airline.name)}
                                </span>
                              </div>

                              <div className="flex flex-col min-w-0">
                                <div className="text-lg font-bold text-gray-900">
                                  {flight.flightNumber}
                                </div>
                                <div className="text-sm text-gray-600 truncate">
                                  {flight.airline.name}
                                </div>
                              </div>
                            </div>

                            {/* Center: Times and Duration */}
                            <div className="flex-1 min-w-0 flex items-center justify-center">
                              <div className="text-xl md:text-2xl font-bold text-gray-900 tabular-nums whitespace-nowrap">
                                {dep}{' '}
                                <span className="text-gray-400 font-semibold">–</span>{' '}
                                {arr}
                              </div>
                            </div>

                            {/* Right: View Forecast Button */}
                            <div className="flex items-center flex-shrink-0">
                              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                                View Forecast
                                <span>→</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )
                    })()}
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
