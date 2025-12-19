'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Autocomplete } from '@/components/ui'
import type { FlightSearchParams } from '@/types'

export function FlightSearchForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FlightSearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    aircraftType: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const searchAirports = async (query: string) => {
    const res = await fetch(`/api/airports?q=${encodeURIComponent(query)}`)
    const data = await res.json()

    if (!data.success) return []

    return data.airports.map((airport: any) => ({
      value: airport.iata,
      label: `${airport.iata} - ${airport.city}, ${airport.country} (${airport.name})`,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        origin: formData.origin,
        destination: formData.destination,
      })

      if (formData.departureDate) {
        const date = formData.departureDate.split('T')[0]
        params.set('date', date)
      }

      if (formData.aircraftType) {
        params.set('aircraft', formData.aircraftType)
      }

      router.push(`/results?${params.toString()}`)
    } catch (err) {
      setError('Failed to search flights. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Origin & Destination */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Autocomplete
          label="From"
          placeholder="Search airport, city, or code..."
          icon="🛫"
          value={formData.origin}
          onChange={(value) => {
            setFormData((prev) => ({ ...prev, origin: value }))
            setError('')
          }}
          onSearch={searchAirports}
          required
        />

        <Autocomplete
          label="To"
          placeholder="Search airport, city, or code..."
          icon="🛬"
          value={formData.destination}
          onChange={(value) => {
            setFormData((prev) => ({ ...prev, destination: value }))
            setError('')
          }}
          onSearch={searchAirports}
          required
        />
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-4">
        <button
          type="button"
          onClick={() => {
            setFormData((prev) => ({
              ...prev,
              origin: prev.destination,
              destination: prev.origin,
            }))
          }}
          disabled={!formData.origin || !formData.destination}
          className="p-3 bg-white rounded-full shadow-lg border-2 border-gray-200
                     hover:border-blue-500 hover:shadow-xl hover:scale-110
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                     transition-all duration-200 group"
          aria-label="Swap airports"
        >
          <svg
            className="w-6 h-6 text-gray-600 group-hover:text-blue-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
            />
          </svg>
        </button>
      </div>

      {/* Optional Filters */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span>⚙️</span>
          Optional Filters
        </h3>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departure Date (Optional)
            </label>
            <input
              type="date"
              value={formData.departureDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, departureDate: e.target.value }))
              }
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl shadow-sm
                         focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                         transition-all duration-200 bg-white/80 backdrop-blur-sm"
            />
            <p className="mt-2 text-xs text-yellow-700 flex items-center gap-2">
              <span>💡</span>
              Showing real-time flights only (date filter requires paid plan)
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          disabled={!formData.origin || !formData.destination}
          className="min-w-[320px] text-xl py-5 rounded-2xl shadow-2xl
                     bg-gradient-to-r from-blue-600 to-purple-600
                     hover:from-blue-700 hover:to-purple-700
                     transform hover:scale-105 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching Flights...
            </span>
          ) : (
            <span className="flex items-center gap-3">
              <span>✈️</span>
              Search Real-Time Flights
              <span>→</span>
            </span>
          )}
        </Button>
      </div>

      {/* Info Text */}
      <p className="text-center text-sm text-gray-500">
        Search from <strong>6,000+</strong> airports worldwide
      </p>
    </form>
  )
}
