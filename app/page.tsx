import { FlightSearchForm } from '@/components/search/FlightSearchForm'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <div className="relative h-[600px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=80"
            alt="Airplane in clouds"
            fill
            className="object-cover brightness-50"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-900/50 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">
              TurbCast
            </h1>
            <p className="text-2xl md:text-3xl text-white/95 mb-4 font-semibold drop-shadow-lg">
              Know Before You Fly
            </p>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
              Real-time turbulence forecasts powered by NOAA weather data
            </p>

            {/* Scroll Indicator */}
            <div className="mt-12 animate-bounce">
              <svg className="w-6 h-6 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why TurbCast?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fly with confidence using real-time weather data and accurate turbulence predictions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="aspect-video relative">
                <Image
                  src="https://images.unsplash.com/photo-1583427979116-c96b28e8fec8?w=800&q=80"
                  alt="Airplane cockpit"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Real-Time Data
                </h3>
                <p className="text-gray-600">
                  Live flight tracking from 10,000+ airports with up-to-the-minute turbulence forecasts
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="aspect-video relative">
                <Image
                  src="https://images.unsplash.com/photo-1592210454359-9043e5bf40c6?w=800&q=80"
                  alt="Weather radar"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  NOAA Weather Data
                </h3>
                <p className="text-gray-600">
                  Accurate turbulence predictions powered by official NOAA/NWS weather forecasts
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="aspect-video relative">
                <Image
                  src="https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?w=800&q=80"
                  alt="Flight path"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  Route-Specific
                </h3>
                <p className="text-gray-600">
                  Detailed turbulence forecasts tailored to your exact flight path and altitude
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="https://images.unsplash.com/photo-1569629743817-70d8db6c323b?w=1920&q=80"
            alt="Airplane wing"
            fill
            className="object-cover"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center text-white">
            <div>
              <div className="text-5xl md:text-6xl font-black mb-3">6,000+</div>
              <div className="text-xl md:text-2xl font-semibold opacity-90">Airports Worldwide</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-black mb-3">100%</div>
              <div className="text-xl md:text-2xl font-semibold opacity-90">NOAA Weather Data</div>
            </div>
            <div>
              <div className="text-5xl md:text-6xl font-black mb-3">24/7</div>
              <div className="text-xl md:text-2xl font-semibold opacity-90">Real-Time Updates</div>
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
