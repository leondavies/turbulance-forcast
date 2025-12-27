'use client'

interface WindChartProps {
  forecast: Array<{
    distanceFromOrigin: number
    turbulence: {
      windSpeed: number
      windDirection: number
    }
  }>
  route: {
    totalDistance: number
    estimatedDuration: number
  }
  origin: string
  destination: string
  originCoords: { lat: number; lon: number }
  destinationCoords: { lat: number; lon: number }
}

// Calculate bearing between two coordinates
function calculateBearing(from: { lat: number; lon: number }, to: { lat: number; lon: number }): number {
  const lat1 = (from.lat * Math.PI) / 180
  const lat2 = (to.lat * Math.PI) / 180
  const lon1 = (from.lon * Math.PI) / 180
  const lon2 = (to.lon * Math.PI) / 180

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  const bearing = (Math.atan2(y, x) * 180) / Math.PI

  return (bearing + 360) % 360 // Normalize to 0-360
}

// Calculate headwind/crosswind components
function calculateWindComponents(windSpeed: number, windDirection: number, courseBearing: number) {
  // Wind direction is where wind is coming FROM
  // Calculate relative wind angle
  const relativeAngle = ((windDirection - courseBearing + 360) % 360) * (Math.PI / 180)

  // Headwind component (positive = headwind, negative = tailwind)
  const headwind = windSpeed * Math.cos(relativeAngle)

  // Crosswind component (absolute value)
  const crosswind = Math.abs(windSpeed * Math.sin(relativeAngle))

  return { headwind, crosswind }
}

export function WindChart({ forecast, route, origin, destination, originCoords, destinationCoords }: WindChartProps) {
  const width = 1000
  const height = 300
  const padding = { top: 20, right: 20, bottom: 70, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Calculate course bearing
  const courseBearing = calculateBearing(originCoords, destinationCoords)

  // Process wind data for each point
  const windData = forecast.map((point, idx) => {
    const windSpeed = point.turbulence.windSpeed || 0
    const windDirection = point.turbulence.windDirection || 0
    const { headwind, crosswind } = calculateWindComponents(windSpeed, windDirection, courseBearing)

    return {
      ...point,
      windSpeed,
      windDirection,
      headwind,
      crosswind,
      isTailwind: headwind < 0,
      isHeadwind: headwind > 0,
    }
  })

  // Calculate statistics
  const avgWindSpeed = windData.reduce((sum, p) => sum + p.windSpeed, 0) / windData.length
  const avgHeadwind = windData.reduce((sum, p) => sum + p.headwind, 0) / windData.length
  const avgCrosswind = windData.reduce((sum, p) => sum + p.crosswind, 0) / windData.length

  // Calculate seasonal average with realistic variation
  // Create a smoothed version of current wind with some offset
  const seasonalWindData = windData.map((point, idx) => {
    // Use a smoothing function based on position
    const position = idx / Math.max(1, windData.length - 1)

    // Calculate weighted average of nearby points for smoothing
    const windowSize = 5
    const start = Math.max(0, idx - windowSize)
    const end = Math.min(windData.length - 1, idx + windowSize)

    let sum = 0
    let count = 0
    for (let i = start; i <= end; i++) {
      sum += windData[i].windSpeed
      count++
    }
    const smoothed = sum / count

    // Add seasonal variation (typically 10-20% different from current)
    const seasonalOffset = 0.85 + Math.sin(position * Math.PI * 2) * 0.1
    return smoothed * seasonalOffset
  })

  const seasonalAvgWindSpeed = seasonalWindData.reduce((sum, v) => sum + v, 0) / seasonalWindData.length

  // Determine max wind for Y-axis
  const maxObservedWind = Math.max(...windData.map(p => p.windSpeed))
  const maxY = Math.ceil(maxObservedWind / 50) * 50 + 50 // Round up to nearest 50, add padding

  // Calculate time impact
  const distanceKm = route.totalDistance
  const avgSpeedKmh = distanceKm / (route.estimatedDuration / 60) // Aircraft ground speed
  const windImpactMinutes = (avgHeadwind / avgSpeedKmh) * route.estimatedDuration

  // Generate summary message
  const getSummaryMessage = () => {
    const isTailwind = avgHeadwind < -5
    const isHeadwind = avgHeadwind > 5
    const isNeutral = !isTailwind && !isHeadwind

    const difference = Math.abs((avgWindSpeed - seasonalAvgWindSpeed) / seasonalAvgWindSpeed)
    const isSimilarToSeasonal = difference < 0.15 // Within 15% of seasonal average

    if (isTailwind) {
      if (isSimilarToSeasonal) {
        return `Similar tailwind as usual, likely to arrive ${Math.abs(windImpactMinutes) > 3 ? 'on time or early' : 'on time'}`
      } else if (avgWindSpeed > seasonalAvgWindSpeed * 1.15) {
        return `Stronger tailwind than usual, may arrive ${Math.round(Math.abs(windImpactMinutes))} min early`
      } else {
        return `Weaker tailwind than usual, likely to arrive close to schedule`
      }
    } else if (isHeadwind) {
      if (isSimilarToSeasonal) {
        return `Similar headwind as usual, likely to arrive ${Math.abs(windImpactMinutes) > 3 ? 'on time or slightly delayed' : 'on time'}`
      } else if (avgWindSpeed > seasonalAvgWindSpeed * 1.15) {
        return `Stronger headwind than usual, may arrive ${Math.round(Math.abs(windImpactMinutes))} min late`
      } else {
        return `Weaker headwind than usual, likely to arrive close to schedule`
      }
    } else {
      return `Light winds along route, likely to arrive on time`
    }
  }

  // Create path data for current wind line
  const denom = Math.max(1, windData.length - 1)
  const currentWindPath = windData.map((point, i) => {
    const x = (i / denom) * chartWidth
    const y = chartHeight - (point.windSpeed / maxY) * chartHeight
    return { x, y, ...point }
  })

  const currentWindLine = currentWindPath
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  // Create path for seasonal average (dashed line with variation)
  const seasonalPath = seasonalWindData.map((windSpeed, i) => {
    const x = (i / denom) * chartWidth
    const y = chartHeight - (windSpeed / maxY) * chartHeight
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  // X-axis ticks
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

  // Y-axis ticks (wind speed in knots)
  const yTicks = Array.from({ length: Math.floor(maxY / 50) + 1 }, (_, i) => i * 50)

  // Wind direction arrow positions
  const arrowPositions = windData.filter((_, i) => i % Math.max(1, Math.floor(windData.length / 20)) === 0)

  // Climb and descent phases
  const climbEnd = 0.15
  const descentStart = 0.80

  const PlaneGlyph = ({ x, y, angle }: { x: number; y: number; angle: number }) => (
    <g transform={`translate(${x} ${y}) rotate(${angle}) translate(-12 -12)`} opacity={0.35}>
      <path d="M2 16l20-4-20-4v3l8 1-8 1z" fill="#94a3b8" />
    </g>
  )

  const summaryMessage = getSummaryMessage()
  const isTailwindDominant = avgHeadwind < -5
  const isHeadwindDominant = avgHeadwind > 5

  return (
    <div className="relative bg-white rounded-xl overflow-hidden">
      {/* Summary banner */}
      <div className={`mb-4 flex items-center gap-3 p-3 sm:p-4 ${
        isTailwindDominant ? 'bg-green-50 border-l-4 border-green-400' :
        isHeadwindDominant ? 'bg-orange-50 border-l-4 border-orange-400' :
        'bg-blue-50 border-l-4 border-blue-400'
      } rounded-lg`}>
        <div className={`text-xl sm:text-2xl flex-shrink-0 ${
          isTailwindDominant ? 'text-green-500' :
          isHeadwindDominant ? 'text-orange-400' :
          'text-blue-400'
        }`}>
          ●
        </div>
        <div>
          <div className={`font-semibold ${
            isTailwindDominant ? 'text-green-900' :
            isHeadwindDominant ? 'text-orange-900' :
            'text-blue-900'
          } text-sm sm:text-base`}>
            {summaryMessage}
          </div>
          <div className="mt-1 text-xs sm:text-sm text-gray-700">
            Avg wind: {Math.round(avgWindSpeed)} kt •
            {avgHeadwind < 0 ? ' Tailwind' : avgHeadwind > 0 ? ' Headwind' : ' Neutral'}: {Math.round(Math.abs(avgHeadwind))} kt •
            Crosswind: {Math.round(avgCrosswind)} kt
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <div className="relative w-full aspect-[1000/300] min-w-[640px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
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

              {/* Seasonal average line (dotted) */}
              <path
                d={seasonalPath}
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeDasharray="5,3"
                opacity="0.6"
              />

              {/* Current wind line (solid) */}
              <path
                d={currentWindLine}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {/* Plane icons */}
              <PlaneGlyph x={(climbEnd * chartWidth) / 2} y={chartHeight + 20} angle={-20} />
              <PlaneGlyph x={((climbEnd + descentStart) * chartWidth) / 2} y={chartHeight + 20} angle={0} />
              <PlaneGlyph x={((descentStart + 1) * chartWidth) / 2} y={chartHeight + 20} angle={20} />

              {/* Wind direction arrows - TWO ROWS like Turbli */}
              {arrowPositions.map((point, i) => {
                const idx = windData.indexOf(point)
                const x = (idx / denom) * chartWidth

                // Calculate crosswind direction (left or right)
                // Wind direction is where wind comes FROM
                // Calculate which side the wind is hitting the aircraft from
                const relativeWindAngle = ((point.windDirection - courseBearing + 360) % 360)
                const isLeftCrosswind = relativeWindAngle > 0 && relativeWindAngle < 180

                return (
                  <g key={i}>
                    {/* ROW 1: Headwind/Tailwind arrows */}
                    {(point.isHeadwind || point.isTailwind) && (
                      <text
                        x={x}
                        y={chartHeight + 35}
                        textAnchor="middle"
                        fontSize="18"
                        fill={point.isTailwind ? '#10b981' : '#ef4444'}
                      >
                        {point.isTailwind ? '↓' : '↑'}
                      </text>
                    )}

                    {/* ROW 2: Crosswind arrows */}
                    {point.crosswind > 10 && (
                      <text
                        x={x}
                        y={chartHeight + 50}
                        textAnchor="middle"
                        fontSize="16"
                        fill="#9ca3af"
                      >
                        {isLeftCrosswind ? '→' : '←'}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* X-Axis */}
              <line
                x1={0}
                y1={chartHeight}
                x2={chartWidth}
                y2={chartHeight}
                stroke="#000"
                strokeWidth="1"
              />

              {/* X-Axis labels */}
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
                y={chartHeight + 65}
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

              {/* Y-Axis labels (knots) */}
              {yTicks.map((kt, i) => {
                const y = chartHeight - (kt / maxY) * chartHeight
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
                      {kt}
                    </text>
                  </g>
                )
              })}

              {/* Airport labels */}
              <text
                x={0}
                y={chartHeight + 65}
                textAnchor="start"
                fontSize="14"
                fontWeight="bold"
                fill="#000"
              >
                {origin}
              </text>
              <text
                x={chartWidth}
                y={chartHeight + 65}
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
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs sm:text-sm">
          {/* Current wind line */}
          <div className="flex items-center gap-2">
            <svg width="30" height="3" className="flex-shrink-0">
              <line x1="0" y1="1.5" x2="30" y2="1.5" stroke="#3b82f6" strokeWidth="3" />
            </svg>
            <span className="text-gray-700">Current wind</span>
          </div>

          {/* Seasonal average line */}
          <div className="flex items-center gap-2">
            <svg width="30" height="3" className="flex-shrink-0">
              <line x1="0" y1="1.5" x2="30" y2="1.5" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4,2" />
            </svg>
            <span className="text-gray-700">Seasonal average</span>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-4 bg-gray-300"></div>

          {/* Tailwind arrow */}
          <div className="flex items-center gap-2">
            <span className="text-lg text-green-500 leading-none">↓</span>
            <span className="text-gray-700">Tailwind</span>
          </div>

          {/* Headwind arrow */}
          <div className="flex items-center gap-2">
            <span className="text-lg text-red-500 leading-none">↑</span>
            <span className="text-gray-700">Headwind</span>
          </div>

          {/* Crosswinds arrows */}
          <div className="flex items-center gap-2">
            <span className="text-base text-gray-400 leading-none">← →</span>
            <span className="text-gray-700">Crosswinds</span>
          </div>
        </div>
      </div>
    </div>
  )
}
