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

  const minEDR = 0

  // Dynamic Y scale:
  // - If there is no severe turbulence, don't waste vertical space rendering the severe band.
  // - For short/smooth flights, tighten further so light/moderate changes are readable.
  const observedMaxEDR = forecast.reduce((m, p) => Math.max(m, p.turbulence.edr || 0), 0)
  const hasSevere = observedMaxEDR >= 0.4
  const hasModerate = observedMaxEDR >= 0.25
  const maxEDR = hasSevere ? 0.6 : hasModerate ? 0.4 : 0.25

  // Turbulence levels for sidebar (matching actual EDR thresholds)
  // Ordered from low to high severity
  const levels = [
    { level: 'smooth', label: 'Smooth', color: '#10b981', desc: 'EDR < 0.15', min: 0.00, max: 0.15 },
    { level: 'light', label: 'Light', color: '#fbbf24', desc: 'EDR 0.15-0.25', min: 0.15, max: 0.25 },
    { level: 'moderate', label: 'Moderate', color: '#f97316', desc: 'EDR 0.25-0.40', min: 0.25, max: 0.40 },
    { level: 'severe', label: 'Severe', color: '#ef4444', desc: 'EDR ≥ 0.40', min: 0.40, max: 0.60 },
  ]

  const activeLevels = levels.filter((lvl) => (hasSevere ? true : lvl.level !== 'severe'))

  // X-axis ticks:
  // - < 3 hours: show 30 minute increments
  // - otherwise: hourly is fine
  const durationMinutes = Math.max(0, route.estimatedDuration || 0)
  const totalHoursExact = durationMinutes / 60
  const tickStepHours = totalHoursExact > 0 && totalHoursExact < 3 ? 0.5 : 1
  const tickMaxHours = Math.ceil(totalHoursExact / tickStepHours) * tickStepHours

  const formatHourTick = (h: number) => {
    if (tickStepHours === 1) return `${h}`
    const totalM = Math.round(h * 60)
    const hh = Math.floor(totalM / 60)
    const mm = totalM % 60
    return `${hh}:${mm.toString().padStart(2, '0')}`
  }

  const hourTicks = Array.from(
    { length: Math.floor(tickMaxHours / tickStepHours) + 1 },
    (_, i) => i * tickStepHours
  )

  // Create path data for turbulence line (uses dynamic maxEDR)
  const denom = Math.max(1, forecast.length - 1)
  const pathPoints = forecast.map((point, i) => {
    const x = (i / denom) * chartWidth
    const y =
      chartHeight - ((point.turbulence.edr - minEDR) / (maxEDR - minEDR)) * chartHeight
    return { x, y, ...point }
  })

  const linePath = pathPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const PlaneGlyph = ({
    x,
    y,
    angle,
  }: {
    x: number
    y: number
    angle: number
  }) => {
    // Simple plane glyph (SVG path) so orientation is consistent across OS/browser.
    // Designed in a 24x24 box and centered via translate(-12,-12).
    return (
      <g
        transform={`translate(${x} ${y}) rotate(${angle}) translate(-12 -12)`}
        opacity={0.35}
      >
        <path
          d="M2 16l20-4-20-4v3l8 1-8 1z"
          fill="#94a3b8"
        />
      </g>
    )
  }

  // Create area path (for uncertainty band)
  const areaPath = `
    M 0 ${chartHeight}
    ${pathPoints.map(p => `L ${p.x} ${p.y + 20}`).join(' ')}
    L ${chartWidth} ${chartHeight}
    Z
  `

  const levelPriority: Record<string, number> = {
    severe: 4,
    moderate: 3,
    light: 2,
    smooth: 1,
  }

  const normalizeLevel = (lvl: string) =>
    (lvl || '').toLowerCase() as 'smooth' | 'light' | 'moderate' | 'severe'

  const clampLevel = (lvl: string): 'smooth' | 'light' | 'moderate' | 'severe' => {
    const n = normalizeLevel(lvl)
    if (n === 'smooth' || n === 'light' || n === 'moderate' || n === 'severe') return n
    return 'smooth'
  }

  const formatMinutes = (minutes: number) => {
    const m = Math.max(0, Math.round(minutes))
    const h = Math.floor(m / 60)
    const mm = m % 60
    if (h <= 0) return `${mm}m`
    if (mm === 0) return `${h}h`
    return `${h}h ${mm}m`
  }

  // Duration-weighted breakdown by turbulence level (prevents a single brief spike from dominating the copy)
  const totalMinutes = Math.max(0, route.estimatedDuration || 0)
  const levelMinutes: Record<'smooth' | 'light' | 'moderate' | 'severe', number> = {
    smooth: 0,
    light: 0,
    moderate: 0,
    severe: 0,
  }

  if (forecast.length >= 2 && totalMinutes > 0) {
    const totalDistance = route.totalDistance || forecast[forecast.length - 1]?.distanceFromOrigin || 0
    for (let i = 0; i < forecast.length - 1; i++) {
      const a = forecast[i]
      const b = forecast[i + 1]
      const level = clampLevel(a.turbulence.level)

      let segmentMinutes = 0
      if (totalDistance > 0) {
        const dA = Math.max(0, a.distanceFromOrigin || 0)
        const dB = Math.max(0, b.distanceFromOrigin || 0)
        const segmentDistance = Math.max(0, dB - dA)
        segmentMinutes = (segmentDistance / totalDistance) * totalMinutes
      } else {
        // Fallback: evenly distribute time across segments
        segmentMinutes = totalMinutes / (forecast.length - 1)
      }
      levelMinutes[level] += segmentMinutes
    }
  }

  const pct = (lvl: keyof typeof levelMinutes) =>
    totalMinutes > 0 ? (levelMinutes[lvl] / totalMinutes) * 100 : 0

  const dominantLevel = (Object.keys(levelMinutes) as Array<keyof typeof levelMinutes>).reduce(
    (best, lvl) => (levelMinutes[lvl] > levelMinutes[best] ? lvl : best),
    'smooth'
  )

  // "Sustained" means it’s a meaningful portion of the flight, not a brief patch.
  // Tuned to produce calmer, more accurate messaging for long-haul flights.
  const SUSTAINED_MINUTES = 25
  const SUSTAINED_PCT = 8
  const BRIEF_MINUTES = 10

  const isSustained = (lvl: keyof typeof levelMinutes) =>
    levelMinutes[lvl] >= SUSTAINED_MINUTES || pct(lvl) >= SUSTAINED_PCT

  const isBrief = (lvl: keyof typeof levelMinutes) =>
    levelMinutes[lvl] > 0 && levelMinutes[lvl] < BRIEF_MINUTES && pct(lvl) < 4

  // Choose banner severity based on sustained severity rather than max single point.
  const bannerLevel: 'smooth' | 'light' | 'moderate' | 'severe' =
    (isSustained('severe') ? 'severe' :
    isSustained('moderate') ? 'moderate' :
    isSustained('light') ? 'light' :
    // If nothing is sustained, fall back to the dominant level (usually smooth)
    (dominantLevel as any)) || 'smooth'

  const breakdownParts = (['smooth', 'light', 'moderate', 'severe'] as const)
    .filter((lvl) => levelMinutes[lvl] >= 1)
    .map((lvl) => `${lvl[0].toUpperCase()}${lvl.slice(1)} ${formatMinutes(levelMinutes[lvl])}`)

  const breakdownText = breakdownParts.length ? breakdownParts.join(' • ') : null

  const makeMessage = () => {
    // Build a calmer, duration-aware headline.
    const severeMin = levelMinutes.severe
    const moderateMin = levelMinutes.moderate
    const lightMin = levelMinutes.light

    if (isSustained('severe')) {
      return `Severe turbulence possible for parts of the flight`
    }
    if (severeMin > 0) {
      return `Brief pockets of severe turbulence possible`
    }

    if (isSustained('moderate')) {
      return `Moderate turbulence likely at times`
    }
    if (isBrief('moderate')) {
      return `Mostly smooth, with a brief patch of moderate turbulence possible`
    }
    if (moderateMin > 0) {
      return `Some moderate turbulence possible, otherwise mostly ${dominantLevel}`
    }

    if (isSustained('light')) {
      return `Light turbulence likely at times, otherwise mostly smooth`
    }
    if (lightMin > 0) {
      return `Occasional light bumps possible, mostly smooth`
    }

    return `Smooth flight conditions expected`
  }

  // Banner styling based on turbulence level
  const bannerConfig: Record<string, { bg: string, border: string, text: string, icon: string, iconColor: string, message: string }> = {
    severe: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      icon: '●',
      iconColor: 'text-red-500',
      message: makeMessage()
    },
    moderate: {
      bg: 'bg-orange-50',
      border: 'border-orange-400',
      text: 'text-orange-900',
      icon: '●',
      iconColor: 'text-orange-400',
      message: makeMessage()
    },
    light: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-900',
      icon: '●',
      iconColor: 'text-yellow-400',
      message: makeMessage()
    },
    smooth: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-900',
      icon: '●',
      iconColor: 'text-green-400',
      message: makeMessage()
    }
  }

  const banner = bannerConfig[bannerLevel] || bannerConfig.smooth

  return (
    <div className="relative bg-white rounded-xl overflow-hidden">
      {/* Warning banner */}
      <div className={`mb-4 flex items-center gap-3 p-3 sm:p-4 ${banner.bg} border-l-4 ${banner.border} rounded-lg`}>
        <div className={`text-xl sm:text-2xl flex-shrink-0 ${banner.iconColor}`}>{banner.icon}</div>
        <div>
          <div className={`font-semibold ${banner.text} text-sm sm:text-base`}>
            {banner.message}
          </div>
          {breakdownText ? (
            <div className="mt-1 text-xs sm:text-sm text-gray-700">
              {breakdownText}
            </div>
          ) : null}
        </div>
      </div>

      {/* Chart container */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Turbulence level legend - horizontal on mobile, vertical on desktop */}
        <div className="lg:w-24 flex-shrink-0 lg:self-stretch">
          {/* On desktop, reverse the vertical order so it matches the chart bands (severe at top → smooth at bottom). */}
          {/* Align legend bottom with the chart's x-axis line by padding to match the SVG's plot area.
              SVG viewBox is 1000x300 with paddingTop=20 and paddingBottom=50:
              - top offset = 20/300 = 6.666%
              - bottom label area = 50/300 = 16.666% */}
          <div className="flex lg:flex-col-reverse gap-2 lg:gap-0 lg:h-full lg:pt-[6.666%] lg:pb-[16.666%] lg:justify-start">
            {activeLevels.map((lvl) => {
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
          {/* Use an aspect-ratio wrapper so the legend can align to the x-axis line reliably. */}
          <div className="relative w-full aspect-[1000/300] min-w-[640px]">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Turbulence level background zones */}
              {activeLevels.map((lvl) => {
                // Calculate Y position and height based on EDR thresholds
                const clampedMax = Math.min(lvl.max, maxEDR)
                const clampedMin = Math.min(lvl.min, maxEDR)
                const yTop = chartHeight - ((clampedMax - minEDR) / (maxEDR - minEDR)) * chartHeight
                const yBottom = chartHeight - ((clampedMin - minEDR) / (maxEDR - minEDR)) * chartHeight
                const height = yBottom - yTop

                if (height <= 0) return null

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
              {/* Climb phase (tilt up) */}
              <PlaneGlyph
                x={(climbEnd * chartWidth) / 2}
                y={chartHeight - 10}
                angle={-20}
              />

              {/* Cruise phase (level) */}
              <PlaneGlyph
                x={((climbEnd + descentStart) * chartWidth) / 2}
                y={chartHeight - 10}
                angle={0}
              />

              {/* Descent phase (tilt down) */}
              <PlaneGlyph
                x={((descentStart + 1) * chartWidth) / 2}
                y={chartHeight - 10}
                angle={20}
              />

              {/* X-Axis (time) */}
              <line
                x1={0}
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="#000"
                strokeWidth="1"
              />

              {/* X-Axis labels (time) */}
              {hourTicks.map((h, i) => {
                const x = tickMaxHours > 0 ? (h / tickMaxHours) * chartWidth : 0
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
                      {formatHourTick(h)}
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
                Flight time
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
              {(() => {
                const step = maxEDR <= 0.25 ? 0.05 : 0.1
                const steps = Math.max(1, Math.round(maxEDR / step))
                return Array.from({ length: steps + 1 }).map((_, i) => {
                  const value = maxEDR - i * step
                  const y = (i / steps) * chartHeight
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
                        {value.toFixed(step < 0.1 ? 2 : 1)}
                      </text>
                    </g>
                  )
                })
              })()}

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
