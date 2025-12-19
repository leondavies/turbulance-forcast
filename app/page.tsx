import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { FlightSearchForm } from '@/components/search/FlightSearchForm'

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white min-h-[calc(100vh-4rem)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block text-6xl mb-4">✈️</div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Turbli
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Flight Turbulence Forecast
          </p>
          <p className="text-gray-500">
            Real-time turbulence predictions for your flight
          </p>
        </div>

        {/* Search Card */}
        <Card padding="lg" className="shadow-xl">
          <CardHeader>
            <CardTitle>
              Check Your Flight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FlightSearchForm />
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-2">Real Data</h3>
            <p className="text-sm text-gray-600">
              Powered by NOAA/NWS weather forecasts
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-3xl mb-2">⏱️</div>
            <h3 className="font-semibold text-gray-900 mb-2">36-Hour Forecast</h3>
            <p className="text-sm text-gray-600">
              Advanced predictions for flights within 36 hours
            </p>
          </div>
          <div className="text-center p-6">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">Aircraft-Specific</h3>
            <p className="text-sm text-gray-600">
              Forecasts adjusted for your aircraft type
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 text-center">
            <strong>Note:</strong> Phase 1 - UI Demo. Actual weather data integration coming in later phases.
          </p>
        </div>
      </div>
    </div>
  )
}
