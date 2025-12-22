'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Autocomplete } from '@/components/ui'
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

  const searchAirports = useCallback(async (query: string) => {
    const res = await fetch(`/api/airports?q=${encodeURIComponent(query)}`)
    const data = await res.json()

    if (!data.success) return []

    return data.airports.map((airport: any) => ({
      value: airport.iata,
      label: `${airport.iata} - ${airport.city}, ${airport.country} (${airport.name})`,
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Always search for today's flights
      const today = new Date()
      const dateString = today.toISOString().split('T')[0]

      const params = new URLSearchParams({
        origin: formData.origin,
        destination: formData.destination,
        date: dateString,
      })

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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-end">
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

        {/* Swap Button */}
        <div className="flex justify-center lg:pb-1">
          <button
            type="button"
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                origin: prev.destination,
                destination: prev.origin,
              }))
              setError('')
            }}
            disabled={!formData.origin && !formData.destination}
            className="p-3 bg-white rounded-full shadow-lg border-2 border-gray-200
                       hover:border-brand-blue hover:shadow-xl hover:scale-110
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                       transition-all duration-200 group"
            aria-label="Swap airports"
          >
            <svg
              className="w-6 h-6 text-gray-600 group-hover:text-brand-blue transition-colors"
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

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          size="lg"
          disabled={!formData.origin || !formData.destination || isLoading}
          className="min-w-[320px] text-xl py-6 rounded-2xl shadow-2xl
                     bg-gradient-to-r from-brand-blue to-brand-navy
                     hover:from-brand-blue hover:to-brand-navy
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
              Search today’s flights
              <span>→</span>
            </span>
          )}
        </Button>
      </div>

      {/* Helper text (keeps the UI calm and reduces visual noise) */}
      <p className="text-center text-xs text-gray-500 -mt-2">
        We currently search scheduled flights departing <strong>today</strong> (local time at your departure airport).
      </p>

      {/* Info Text */}
      <p className="text-center text-sm text-gray-500">
        Search from <strong>6,000+</strong> airports worldwide
      </p>
    </form>
  )
}
