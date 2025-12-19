import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { FlightSearchForm } from '@/components/search/FlightSearchForm'

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block text-7xl mb-6 animate-bounce-slow">✈️</div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-lg">
            TurbCast
          </h1>
          <p className="text-2xl md:text-3xl text-blue-100 mb-4 font-medium">
            Real-Time Flight Turbulence Forecast
          </p>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto">
            Live flight tracking with turbulence predictions powered by NOAA weather data
          </p>
        </div>

        {/* Search Card */}
        <div className="max-w-5xl mx-auto animate-slide-up">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
            <div className="mb-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Find Your Flight
              </h2>
              <p className="text-gray-600 text-lg">
                Search 6,000+ airports worldwide for real-time turbulence predictions
              </p>
            </div>

            <FlightSearchForm />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { icon: '✈️', title: 'Real-Time Flights', desc: 'Live flight data from 10,000+ airports worldwide' },
            { icon: '📊', title: 'Weather Data', desc: 'Powered by NOAA/NWS weather forecasts' },
            { icon: '🎯', title: 'Route-Specific', desc: 'Turbulence forecasts for your exact flight path' }
          ].map((item, idx) => (
            <div
              key={idx}
              className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-xl text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-semibold text-lg animate-pulse">
            <span className="inline-block w-3 h-3 bg-white rounded-full animate-ping"></span>
            Live Flight Data Connected
          </div>
        </div>
      </div>
    </div>
  )
}
