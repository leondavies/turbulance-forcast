'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, Loading, Button } from '@/components/ui'
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
      if (!origin || !destination || !date) {
        setError('Missing search parameters')
        setIsLoading(false)
        return
      }

      try {
        const params = new URLSearchParams({
          origin,
          destination,
          date,
        })

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

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDuration = (dep: Date, arr: Date) => {
    const diff = new Date(arr).getTime() - new Date(dep).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Loading text="Searching for flights..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-2xl mx-auto">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="mb-4"
          >
            ← Back to Search
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {origin} → {destination}
          </h1>
          <p className="text-gray-600">
            {new Date(date!).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
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

            <div className="space-y-4">
              {flights.map((flight) => (
                <Card
                  key={flight.id}
                  className="hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => {
                    alert(`Turbulence forecast for ${flight.flightNumber} coming in Phase 3-4!`)
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Flight Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-500">Flight</div>
                            <div className="text-xl font-bold text-gray-900">
                              {flight.flightNumber}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Airline</div>
                            <div className="text-lg font-semibold text-gray-800">
                              {flight.airline.name}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500">Aircraft</div>
                            <div className="text-lg text-gray-800">
                              {flight.aircraft.type || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* Flight Times */}
                        <div className="flex items-center gap-8">
                          <div>
                            <div className="text-3xl font-bold text-gray-900">
                              {formatTime(flight.departure.scheduled)}
                            </div>
                            <div className="text-sm text-gray-600">{origin}</div>
                          </div>

                          <div className="flex-1 flex items-center">
                            <div className="flex-1 border-t-2 border-gray-300 relative">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                <div className="text-2xl">✈️</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 ml-4">
                              {formatDuration(flight.departure.scheduled, flight.arrival.scheduled)}
                            </div>
                          </div>

                          <div>
                            <div className="text-3xl font-bold text-gray-900">
                              {formatTime(flight.arrival.scheduled)}
                            </div>
                            <div className="text-sm text-gray-600">{destination}</div>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="ml-6">
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            flight.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : flight.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : flight.status === 'landed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {flight.status.charAt(0).toUpperCase() + flight.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Click Hint */}
                    <div className="mt-4 text-center">
                      <div className="text-sm text-gray-500">
                        Click to view turbulence forecast →
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
