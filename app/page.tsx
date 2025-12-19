import { FlightSearchForm } from '@/components/search/FlightSearchForm'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient */}
      <div className="relative min-h-[700px] overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800">
        {/* Animated Background Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        {/* Cloud Shapes */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute top-20 left-10 w-32 h-16" viewBox="0 0 200 100" fill="white">
            <ellipse cx="100" cy="70" rx="80" ry="30" />
            <ellipse cx="70" cy="50" rx="50" ry="30" />
            <ellipse cx="130" cy="50" rx="50" ry="30" />
          </svg>
          <svg className="absolute top-40 right-20 w-40 h-20" viewBox="0 0 200 100" fill="white">
            <ellipse cx="100" cy="70" rx="80" ry="30" />
            <ellipse cx="70" cy="50" rx="50" ry="30" />
            <ellipse cx="130" cy="50" rx="50" ry="30" />
          </svg>
          <svg className="absolute bottom-40 left-1/3 w-36 h-18" viewBox="0 0 200 100" fill="white">
            <ellipse cx="100" cy="70" rx="80" ry="30" />
            <ellipse cx="70" cy="50" rx="50" ry="30" />
            <ellipse cx="130" cy="50" rx="50" ry="30" />
          </svg>
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-5xl mx-auto">
            {/* Airplane Icon */}
            <div className="text-8xl mb-8 animate-float">
              ✈️
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight">
              TurbCast
            </h1>
            <p className="text-3xl md:text-4xl text-white mb-6 font-bold">
              Know Before You Fly
            </p>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-12 leading-relaxed">
              Get real-time turbulence forecasts for your flight with accurate NOAA weather data
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
                <span className="text-white font-semibold">⚡ Real-Time Updates</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
                <span className="text-white font-semibold">🌍 6,000+ Airports</span>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full border border-white/30">
                <span className="text-white font-semibold">📊 NOAA Data</span>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="animate-bounce mt-8">
              <svg className="w-8 h-8 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div id="search" className="relative -mt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Search Your Flight
              </h2>
              <p className="text-gray-600 text-lg">
                Get turbulence forecasts for 6,000+ airports worldwide
              </p>
            </div>
            <FlightSearchForm />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black text-gray-900 mb-6">
              Why TurbCast?
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
              Fly with confidence using real-time weather data and accurate turbulence predictions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

              <div className="relative">
                <div className="text-6xl mb-6">⚡</div>
                <h3 className="text-3xl font-black text-white mb-4">
                  Real-Time Data
                </h3>
                <p className="text-blue-100 text-lg leading-relaxed">
                  Live flight tracking from 10,000+ airports with up-to-the-minute turbulence forecasts
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 to-purple-700 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

              <div className="relative">
                <div className="text-6xl mb-6">🌦️</div>
                <h3 className="text-3xl font-black text-white mb-4">
                  NOAA Weather Data
                </h3>
                <p className="text-purple-100 text-lg leading-relaxed">
                  Accurate turbulence predictions powered by official NOAA/NWS weather forecasts
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

              <div className="relative">
                <div className="text-6xl mb-6">🎯</div>
                <h3 className="text-3xl font-black text-white mb-4">
                  Route-Specific
                </h3>
                <p className="text-indigo-100 text-lg leading-relaxed">
                  Detailed turbulence forecasts tailored to your exact flight path and altitude
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-10 left-10 w-20 h-20 border-4 border-white/20 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 border-4 border-white/20 rounded-full"></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 border-4 border-white/20 rotate-45"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-center text-white">
            <div className="transform hover:scale-110 transition-transform duration-300">
              <div className="text-7xl md:text-8xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                6,000+
              </div>
              <div className="text-2xl md:text-3xl font-bold">Airports Worldwide</div>
              <div className="text-blue-100 mt-2">Search from any airport</div>
            </div>
            <div className="transform hover:scale-110 transition-transform duration-300">
              <div className="text-7xl md:text-8xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                100%
              </div>
              <div className="text-2xl md:text-3xl font-bold">NOAA Weather Data</div>
              <div className="text-blue-100 mt-2">Official forecasts</div>
            </div>
            <div className="transform hover:scale-110 transition-transform duration-300">
              <div className="text-7xl md:text-8xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200">
                24/7
              </div>
              <div className="text-2xl md:text-3xl font-bold">Real-Time Updates</div>
              <div className="text-blue-100 mt-2">Always up to date</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready for a Smoother Flight?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Start tracking turbulence on your next flight today
          </p>
          <a
            href="#search"
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200"
          >
            <span>Search Flights Now</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
