'use client'

import { useState } from 'react'
import { Button, Input, Select } from '@/components/ui'
import type { FlightSearchParams } from '@/types'

// Mock airport data for autocomplete
const mockAirports = [
  { value: 'JFK', label: 'JFK - New York (John F. Kennedy)' },
  { value: 'LAX', label: 'LAX - Los Angeles' },
  { value: 'ORD', label: 'ORD - Chicago (O\'Hare)' },
  { value: 'SFO', label: 'SFO - San Francisco' },
  { value: 'LHR', label: 'LHR - London (Heathrow)' },
  { value: 'CDG', label: 'CDG - Paris (Charles de Gaulle)' },
  { value: 'NRT', label: 'NRT - Tokyo (Narita)' },
  { value: 'SIN', label: 'SIN - Singapore (Changi)' },
]

// Mock aircraft data
const mockAircraft = [
  { value: '', label: 'Any Aircraft' },
  { value: 'B738', label: 'Boeing 737-800' },
  { value: 'A320', label: 'Airbus A320' },
  { value: 'B77W', label: 'Boeing 777-300ER' },
  { value: 'A359', label: 'Airbus A350-900' },
  { value: 'B788', label: 'Boeing 787-8' },
]

export function FlightSearchForm() {
  const [formData, setFormData] = useState<FlightSearchParams>({
    origin: '',
    destination: '',
    departureDate: '',
    aircraftType: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      console.log('Search params:', formData)
      setIsLoading(false)
      alert('Flight search coming soon! This is Phase 1 - UI only.')
    }, 1000)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Get tomorrow's date for min date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  // Max date is 36 hours from now
  const maxDateTime = new Date()
  maxDateTime.setHours(maxDateTime.getHours() + 36)
  const maxDate = maxDateTime.toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="From"
          name="origin"
          value={formData.origin}
          onChange={handleChange}
          options={[{ value: '', label: 'Select departure airport' }, ...mockAirports]}
          required
        />

        <Select
          label="To"
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          options={[{ value: '', label: 'Select arrival airport' }, ...mockAirports]}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Departure Date & Time"
          name="departureDate"
          type="datetime-local"
          value={formData.departureDate}
          onChange={handleChange}
          min={minDate}
          max={maxDate}
          helperText="Forecasts available for flights within 36 hours"
          required
        />

        <Select
          label="Aircraft Type (Optional)"
          name="aircraftType"
          value={formData.aircraftType}
          onChange={handleChange}
          options={mockAircraft}
          helperText="Different aircraft experience turbulence differently"
        />
      </div>

      <div className="flex justify-center">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          disabled={!formData.origin || !formData.destination || !formData.departureDate}
        >
          Get Turbulence Forecast
        </Button>
      </div>
    </form>
  )
}
