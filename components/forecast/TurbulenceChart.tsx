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
  const width = 1000
  const height = 300
  const padding = { top: 20, right: 20, bottom: 50, left: 60 }
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
  // Ordered from low to high severity
  const levels = [
    { level: 'smooth', label: 'Smooth', color: '#10b981', desc: 'EDR < 0.15', min: 0.00, max: 0.15 },
    { level: 'light', label: 'Light', color: '#fbbf24', desc: 'EDR 0.15-0.25', min: 0.15, max: 0.25 },
    { level: 'moderate', label: 'Moderate', color: '#f97316', desc: 'EDR 0.25-0.40', min: 0.25, max: 0.40 },
    { level: 'severe', label: 'Severe', color: '#ef4444', desc: 'EDR ≥ 0.40', min: 0.40, max: 0.60 },
  ]

  // Flight duration in hours
  const durationHours = Math.ceil(route.estimatedDuration / 60)

  // Determine maximum turbulence level for warning banner
  const maxTurbulenceLevel = forecast.reduce((max, point) => {
    const levelPriority: Record<string, number> = {
      'severe': 4,
      'moderate': 3,
      'light': 2,
      'smooth': 1
    }
    const currentPriority = levelPriority[point.turbulence.level] || 0
    const maxPriority = levelPriority[max] || 0
    return currentPriority > maxPriority ? point.turbulence.level : max
  }, 'smooth')

  // Banner styling based on turbulence level
  const bannerConfig: Record<string, { bg: string, border: string, text: string, icon: string, iconColor: string, message: string }> = {
    severe: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      icon: '●',
      iconColor: 'text-red-500',
      message: 'Severe turbulence expected - fasten seatbelts'
    },
    moderate: {
      bg: 'bg-orange-50',
      border: 'border-orange-400',
      text: 'text-orange-900',
      icon: '●',
      iconColor: 'text-orange-400',
      message: 'Episodes of moderate turbulence, bumpy flight ahead'
    },
    light: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-900',
      icon: '●',
      iconColor: 'text-yellow-400',
      message: 'Light turbulence possible, mostly smooth flight'
    },
    smooth: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-900',
      icon: '●',
      iconColor: 'text-green-400',
      message: 'Smooth flight conditions expected'
    }
  }

  const banner = bannerConfig[maxTurbulenceLevel] || bannerConfig.smooth

  return (
    <div className="relative bg-white rounded-xl overflow-hidden">
      {/* Warning banner */}
      <div className={`mb-4 flex items-center gap-3 p-3 sm:p-4 ${banner.bg} border-l-4 ${banner.border} rounded-lg`}>
        <div className={`text-xl sm:text-2xl flex-shrink-0 ${banner.iconColor}`}>{banner.icon}</div>
        <div>
          <div className={`font-semibold ${banner.text} text-sm sm:text-base`}>
            {banner.message}
          </div>
        </div>
      </div>

      {/* Chart container */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Turbulence level legend - horizontal on mobile, vertical on desktop */}
        <div className="lg:w-24 flex-shrink-0">
          {/* On desktop, reverse the vertical order so it matches the chart bands (severe at top → smooth at bottom). */}
          <div className="flex lg:flex-col-reverse gap-2 lg:gap-0">
            {levels.map((lvl) => {
              return (
                <div
                  key={lvl.level}
                  className="group cursor-pointer relative flex-1 lg:flex-none"
                >
                  <div className="flex lg:flex-col items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 rounded flex-shrink-0"
                      style={{ backgroundColor: lvl.color }}
                    />
                    <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                      {lvl.label}
                    </span>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 lg:left-full lg:translate-x-0 lg:ml-4 top-full mt-2 lg:top-1/2 lg:-translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 text-sm">
                    <div className="font-bold">{lvl.label} turbulence</div>
                    <div className="text-xs">{lvl.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main chart */}
        <div className="flex-1 overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[300px] sm:max-h-[400px]"
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Turbulence level background zones */}
              {levels.map((lvl) => {
                // Calculate Y position and height based on EDR thresholds
                const yTop = chartHeight - ((lvl.max - minEDR) / (maxEDR - minEDR)) * chartHeight
                const yBottom = chartHeight - ((lvl.min - minEDR) / (maxEDR - minEDR)) * chartHeight
                const height = yBottom - yTop

                return (
                  <rect
                    key={lvl.level}
                    x={0}
                    y={yTop}
                    width={chartWidth}
                    height={height}
                    fill={lvl.color}
                    opacity={0.15}
                  />
                )
              })}

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
      <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
        <div className="flex items-start gap-3">
          <svg width="60" height="3" className="mt-2 flex-shrink-0">
            <line x1="0" y1="1.5" x2="60" y2="1.5" stroke="#3b82f6" strokeWidth="3" />
          </svg>
          <div className="text-xs sm:text-sm text-gray-700">
            Turbulence along the expected route.
          </div>
        </div>
        <div className="flex items-start gap-3">
          <svg width="60" height="10" className="mt-1 flex-shrink-0">
            <rect x="0" y="0" width="60" height="10" fill="#d1d5db" opacity="0.5" />
          </svg>
          <div className="text-xs sm:text-sm text-gray-700">
            Turbulence along other routes that your pilot might deviate to, ranging between ±2000 ft (±600 m) from the expected altitude, and ±40 miles (±65 km) from the expected latitude and longitude points.
          </div>
        </div>
      </div>
    </div>
  )
}
