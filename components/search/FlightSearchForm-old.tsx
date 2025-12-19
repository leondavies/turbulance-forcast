'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Select } from '@/components/ui'
import type { FlightSearchParams } from '@/types'

export function FlightSearchForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<FlightSearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    aircraftType: '',
  })
  const [airports, setAirports] = useState<Array<{ value: string; label: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch airports from database
  useEffect(() => {
    async function fetchAirports() {
      try {
        const res = await fetch('/api/airports')
        const data = await res.json()
        if (data.success) {
          const airportOptions = data.airports.map((airport: any) => ({
            value: airport.iata,
            label: `${airport.iata} - ${airport.city} (${airport.name})`,
          }))
          setAirports(airportOptions)
        }
      } catch (err) {
        console.error('Failed to load airports:', err)
      }
    }
    fetchAirports()
  }, [])

  const aircraftOptions = [
    { value: '', label: 'Any Aircraft' },
    { value: 'B738', label: 'Boeing 737-800' },
    { value: 'A320', label: 'Airbus A320' },
    { value: 'B77W', label: 'Boeing 777-300ER' },
    { value: 'A359', label: 'Airbus A350-900' },
    { value: 'B788', label: 'Boeing 787-8' },
    { value: 'A388', label: 'Airbus A380-800' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Extract just the date part from datetime-local
      const date = formData.departureDate.split('T')[0]

      // Navigate to results page with query params
      const params = new URLSearchParams({
        origin: formData.origin,
        destination: formData.destination,
        date,
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  // Get today's date for min date
  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="From"
          name="origin"
          value={formData.origin}
          onChange={handleChange}
          options={[{ value: '', label: 'Select departure airport' }, ...airports]}
          required
        />

        <Select
          label="To"
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          options={[{ value: '', label: 'Select arrival airport' }, ...airports]}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="w-full">
          <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-1">
            Departure Date (Optional)
          </label>
          <input
            id="departureDate"
            name="departureDate"
            type="date"
            value={formData.departureDate}
            onChange={handleChange}
            min={today}
            className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300"
          />
          <p className="mt-1 text-sm text-yellow-600">
            📅 Showing real-time flights only (date filter requires paid plan)
          </p>
        </div>

        <Select
          label="Aircraft Type (Optional)"
          name="aircraftType"
          value={formData.aircraftType}
          onChange={handleChange}
          options={aircraftOptions}
          helperText="Different aircraft experience turbulence differently"
        />
      </div>

      <div className="flex justify-center">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          disabled={!formData.origin || !formData.destination}
          className="min-w-[280px]"
        >
          {isLoading ? 'Searching Flights...' : 'Search Real-Time Flights'}
        </Button>
      </div>
    </form>
  )
}
