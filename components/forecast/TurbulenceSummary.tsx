import { getTurbulenceColor, getTurbulenceDescription } from '@/services/weather/aviationWeather'

interface TurbulenceSummaryProps {
  summary: {
    maxEDR: number
    maxTurbulenceLevel: string
    smoothPercentage: number
    levelCounts: Record<string, number>
  }
  route: {
    cruiseAltitude: number
  }
}

export function TurbulenceSummary({ summary, route }: TurbulenceSummaryProps) {
  const maxColor = getTurbulenceColor(summary.maxTurbulenceLevel as any)
  const description = getTurbulenceDescription(summary.maxTurbulenceLevel as any)

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-white/20">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Turbulence Forecast Summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Condition */}
        <div className="text-center p-6 rounded-2xl" style={{ backgroundColor: `${maxColor}20` }}>
          <div className="text-sm font-medium text-gray-600 mb-2">Expected Conditions</div>
          <div
            className="text-3xl font-bold mb-2 capitalize"
            style={{ color: maxColor }}
          >
            {summary.maxTurbulenceLevel}
          </div>
          <div className="text-sm text-gray-600">{description}</div>
        </div>

        {/* Max EDR */}
        <div className="text-center p-6 rounded-2xl bg-blue-50">
          <div className="text-sm font-medium text-gray-600 mb-2">Peak Turbulence (EDR)</div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {summary.maxEDR.toFixed(3)}
          </div>
          <div className="text-sm text-gray-600">Maximum along route</div>
        </div>

        {/* Smooth Flight */}
        <div className="text-center p-6 rounded-2xl bg-green-50">
          <div className="text-sm font-medium text-gray-600 mb-2">Smooth Flight</div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {summary.smoothPercentage}%
          </div>
          <div className="text-sm text-gray-600">of route is smooth</div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-3">Route Breakdown</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { level: 'smooth', label: 'Smooth' },
            { level: 'light', label: 'Light' },
            { level: 'moderate', label: 'Moderate' },
            { level: 'severe', label: 'Severe' },
          ].map(({ level, label }) => {
            const count = summary.levelCounts[level] || 0
            const color = getTurbulenceColor(level as any)

            return (
              <div key={level} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <div className="text-xs text-gray-600">{label}</div>
                  <div className="text-sm font-semibold text-gray-900">{count} segments</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Flight Info */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-gray-500">Cruise Altitude</div>
          <div className="text-lg font-semibold text-gray-900">
            {route.cruiseAltitude.toLocaleString()} ft (FL{Math.round(route.cruiseAltitude / 100)})
          </div>
        </div>
        <div className="text-xs text-gray-500 max-w-md flex items-center gap-2">
          <span className="text-green-500">✓</span>
          <span>Using real Aviation Weather Center data including SIGMET, AIRMET, and PIREP turbulence reports</span>
        </div>
      </div>
    </div>
  )
}
