import Link from 'next/link'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="text-2xl">✈️</div>
              <span className="text-lg font-bold text-gray-900">TurbCast</span>
            </div>
            <p className="text-sm text-gray-600">
              Real-time turbulence forecasts for your flight. Plan your journey with confidence.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-blue-600 transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Data Sources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>NOAA/NWS Weather Data</li>
              <li>Met Office Thunderstorm Forecasts</li>
              <li>AviationStack Flight Data</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>&copy; {currentYear} TurbCast. All rights reserved.</p>
          <p className="mt-2 text-xs">
            Weather forecasts are for informational purposes only. Always follow official airline guidance.
          </p>
        </div>
      </div>
    </footer>
  )
}
