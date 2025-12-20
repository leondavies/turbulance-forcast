'use client'

import { getTurbulenceColor } from '@/services/weather/aviationWeather'

interface TurbulenceChartProps {
  forecast: Array<{
    distanceFromOrigin: number
    altitude: number
    turbulence: {
      edr: number
      level: string
    }
  }>
  route: {
    totalDistance: number
    estimatedDuration: number
  }
  origin: string
  destination: string
}

export function TurbulenceChart({ forecast, route, origin, destination }: TurbulenceChartProps) {
  const width = 800
  const height = 400
  const padding = { top: 20, right: 20, bottom: 60, left: 80 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate climb and descent boundaries (as percentages)
  const climbEnd = 0.15 // First 15% is climb
  const descentStart = 0.80 // Last 20% is descent

  // Use fixed EDR scale (0-0.6) to match turbulence thresholds
  const maxEDR = 0.6
  const minEDR = 0

  // Create path data for turbulence line
  const pathPoints = forecast.map((point, i) => {
    const x = (i / (forecast.length - 1)) * chartWidth
    const y = chartHeight - ((point.turbulence.edr - minEDR) / (maxEDR - minEDR)) * chartHeight
    return { x, y, ...point }
  })

  const linePath = pathPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  // Create area path (for uncertainty band)
  const areaPath = `
    M 0 ${chartHeight}
    ${pathPoints.map(p => `L ${p.x} ${p.y + 20}`).join(' ')}
    L ${chartWidth} ${chartHeight}
    Z
  `

  // Turbulence levels for sidebar (matching actual EDR thresholds)
  const levels = [
    { level: 'severe', label: 'Severe', color: '#ef4444', desc: 'EDR ≥ 0.40', min: 0.40, max: 0.60 },
    { level: 'moderate', label: 'Moderate', color: '#f97316', desc: 'EDR 0.25-0.40', min: 0.25, max: 0.40 },
    { level: 'light', label: 'Light', color: '#fbbf24', desc: 'EDR 0.15-0.25', min: 0.15, max: 0.25 },
    { level: 'smooth', label: 'Smooth', color: '#10b981', desc: 'EDR < 0.15', min: 0.00, max: 0.15 },
  ]

  // Flight duration in hours
  const durationHours = Math.ceil(route.estimatedDuration / 60)

  return (
    <div className="relative bg-white rounded-2xl p-6">
      {/* Warning banner */}
      <div className="mb-6 flex items-center gap-3 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg">
        <div className="text-2xl">⚠️</div>
        <div>
          <div className="font-semibold text-orange-900">
            {forecast.some(f => f.turbulence.level === 'moderate' || f.turbulence.level === 'severe')
              ? 'Episodes of moderate turbulence, bumpy flight ahead'
              : 'Smooth flight conditions expected'}
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Turbulence level sidebar */}
        <div className="flex flex-col" style={{ width: '120px', height: `${chartHeight}px`, marginTop: `${padding.top}px` }}>
          {levels.map((lvl, idx) => {
            // Calculate height based on EDR range
            const rangeSize = lvl.max - lvl.min
            const heightPx = (rangeSize / maxEDR) * chartHeight

            return (
              <div
                key={lvl.level}
                className="relative group cursor-pointer"
                style={{
                  height: `${heightPx}px`,
                  backgroundColor: lvl.color,
                  opacity: 0.8,
                }}
              >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-800 transform -rotate-90 whitespace-nowrap">
                  {lvl.label}
                </span>
              </div>

              {/* Tooltip */}
              <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <div className="font-bold">{lvl.label} turbulence</div>
                <div className="text-sm">{lvl.desc}</div>
              </div>
            </div>
            )
          })}
        </div>

        {/* Main chart */}
        <div className="flex-1">
          <svg width={width} height={height} className="overflow-visible">
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Climb/Descent boundary lines */}
              <line
                x1={climbEnd * chartWidth}
                y1={0}
                x2={climbEnd * chartWidth}
                y2={chartHeight}
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <line
                x1={descentStart * chartWidth}
                y1={0}
                x2={descentStart * chartWidth}
                y2={chartHeight}
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="5,5"
              />

              {/* Area under the curve (uncertainty band) */}
              <path
                d={areaPath}
                fill="#d1d5db"
                opacity="0.3"
              />

              {/* Turbulence line */}
              <path
                d={linePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {/* Plane icons */}
              {/* Climb phase */}
              <g transform={`translate(${climbEnd * chartWidth / 2}, ${chartHeight - 10})`}>
                <text fontSize="24" opacity="0.4">✈️</text>
              </g>

              {/* Cruise phase */}
              <g transform={`translate(${(climbEnd + descentStart) * chartWidth / 2}, ${chartHeight - 10})`}>
                <text fontSize="24" opacity="0.4">✈️</text>
              </g>

              {/* Descent phase */}
              <g transform={`translate(${(descentStart + 1) * chartWidth / 2}, ${chartHeight - 10})`}>
                <text fontSize="24" opacity="0.4">✈️</text>
              </g>

              {/* X-Axis (time) */}
              <line
                x1={0}
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="#000"
                strokeWidth="1"
              />

              {/* X-Axis labels (hours) */}
              {Array.from({ length: durationHours + 1 }).map((_, i) => {
                const x = (i / durationHours) * chartWidth
                return (
                  <g key={i}>
                    <line
                      x1={x}
                      y1={chartHeight}
                      x2={x}
                      y2={chartHeight + 6}
                      stroke="#000"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={chartHeight + 20}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#000"
                    >
                      {i}
                    </text>
                  </g>
                )
              })}

              {/* X-Axis label */}
              <text
                x={chartWidth / 2}
                y={chartHeight + 45}
                textAnchor="middle"
                fontSize="14"
                fill="#000"
              >
                Flight hours
              </text>

              {/* Y-Axis */}
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={chartHeight}
                stroke="#000"
                strokeWidth="1"
              />

              {/* Y-Axis labels (EDR values) */}
              {Array.from({ length: 7 }).map((_, i) => {
                const value = ((6 - i) * 0.1).toFixed(1)
                const y = (i / 6) * chartHeight
                return (
                  <g key={i}>
                    <line
                      x1={-6}
                      y1={y}
                      x2={0}
                      y2={y}
                      stroke="#000"
                      strokeWidth="1"
                    />
                    <text
                      x={-10}
                      y={y + 4}
                      textAnchor="end"
                      fontSize="12"
                      fill="#000"
                    >
                      {value}
                    </text>
                  </g>
                )
              })}

              {/* Airport labels */}
              <text
                x={0}
                y={chartHeight + 45}
                textAnchor="start"
                fontSize="14"
                fontWeight="bold"
                fill="#000"
              >
                {origin}
              </text>
              <text
                x={chartWidth}
                y={chartHeight + 45}
                textAnchor="end"
                fontSize="14"
                fontWeight="bold"
                fill="#000"
              >
                {destination}
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
        <div className="flex items-start gap-3">
          <svg width="60" height="3" className="mt-2">
            <line x1="0" y1="1.5" x2="60" y2="1.5" stroke="#3b82f6" strokeWidth="3" />
          </svg>
          <div className="text-sm text-gray-700">
            Turbulence along the expected route.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <svg width="60" height="10" className="mt-1">
            <rect x="0" y="0" width="60" height="10" fill="#d1d5db" opacity="0.5" />
          </svg>
          <div className="text-sm text-gray-700">
            Turbulence along other routes that your pilot might deviate to, ranging between ±2000 ft (±600 m) from the expected altitude, and ±40 miles (±65 km) from the expected latitude and longitude points.
          </div>
        </div>
      </div>
    </div>
  )
}
