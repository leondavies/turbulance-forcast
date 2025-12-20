'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Autocomplete } from '@/components/ui'
import type { FlightSearchParams } from '@/types'

type DateOption = 'today' | 'tomorrow'

export function FlightSearchForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FlightSearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    aircraftType: '',
  })
  const [dateOption, setDateOption] = useState<DateOption>('today')
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
      // Calculate the date based on selected option
      const today = new Date()
      let searchDate = new Date(today)

      if (dateOption === 'tomorrow') {
        searchDate.setDate(searchDate.getDate() + 1)
      }

      const dateString = searchDate.toISOString().split('T')[0]

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

      {/* Date Selection */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
        <h3 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <span>📅</span>
          Departure Date
        </h3>

        <div className="grid grid-cols-2 gap-4">
          {/* Today Option */}
          <button
            type="button"
            onClick={() => setDateOption('today')}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200
              ${dateOption === 'today'
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }
            `}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${dateOption === 'today'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
                }
              `}>
                {dateOption === 'today' && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <span className="text-3xl">🌅</span>
            </div>
            <div className={`
              text-lg font-bold
              ${dateOption === 'today' ? 'text-blue-700' : 'text-gray-700'}
            `}>
              Today
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </button>

          {/* Tomorrow Option */}
          <button
            type="button"
            onClick={() => setDateOption('tomorrow')}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200
              ${dateOption === 'tomorrow'
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
              }
            `}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${dateOption === 'tomorrow'
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
                }
              `}>
                {dateOption === 'tomorrow' && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              <span className="text-3xl">🌄</span>
            </div>
            <div className={`
              text-lg font-bold
              ${dateOption === 'tomorrow' ? 'text-blue-700' : 'text-gray-700'}
            `}>
              Tomorrow
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {(() => {
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                return tomorrow.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              })()}
            </div>
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          size="lg"
          disabled={!formData.origin || !formData.destination || isLoading}
          className="min-w-[320px] text-xl py-6 rounded-2xl shadow-2xl
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
