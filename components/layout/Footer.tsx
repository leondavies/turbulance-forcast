import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <Image
                src="/turbcast-logo.png"
                alt="TurbCast"
                width={260}
                height={173}
                className="h-12 w-auto"
              />
            </div>
            <p className="text-gray-300 text-lg mb-6 max-w-md">
              Real-time turbulence forecasts for your flight. Plan your journey with confidence using NOAA weather data.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <span className="text-xl">𝕏</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <span className="text-xl">in</span>
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <span className="text-xl">f</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-6 text-lg">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <span>→</span> Home
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <span>→</span> FAQ
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <span>→</span> About
                </Link>
              </li>
              <li>
                <Link href="/#search" className="text-gray-300 hover:text-white transition-colors flex items-center gap-2">
                  <span>→</span> Search Flights
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-6 text-lg">Data Sources</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>NOAA Aviation Weather Center (PIREPs, SIGMETs, AIRMETs)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>AirLabs flight schedules</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">✓</span>
                <span>Airport & aircraft reference data (local database)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; {currentYear} TurbCast. All rights reserved.
            </p>
            <p className="text-gray-500 text-xs text-center md:text-right max-w-xl">
              Weather forecasts are for informational purposes only. Always follow official airline guidance.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
