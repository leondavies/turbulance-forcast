import { getTurbulenceColor } from '@/services/weather/mockTurbulence'

interface RouteSegmentsProps {
  forecast: Array<{
    distanceFromOrigin: number
    altitude: number
    turbulence: {
      edr: number
      level: string
      windSpeed: number
      windDirection: number
    }
  }>
  origin: string
  destination: string
}

export function RouteSegments({ forecast, origin, destination }: RouteSegmentsProps) {
  // Group consecutive segments with same turbulence level
  const segments: Array<{
    start: number
    end: number
    level: string
    avgEDR: number
    avgWind: number
  }> = []

  let currentSegment = {
    start: 0,
    end: 0,
    level: forecast[0].turbulence.level,
    edrs: [forecast[0].turbulence.edr],
    winds: [forecast[0].turbulence.windSpeed],
  }

  for (let i = 1; i < forecast.length; i++) {
    if (forecast[i].turbulence.level === currentSegment.level) {
      currentSegment.end = i
      currentSegment.edrs.push(forecast[i].turbulence.edr)
      currentSegment.winds.push(forecast[i].turbulence.windSpeed)
    } else {
      segments.push({
        start: Math.round(forecast[currentSegment.start].distanceFromOrigin),
        end: Math.round(forecast[currentSegment.end].distanceFromOrigin),
        level: currentSegment.level,
        avgEDR: currentSegment.edrs.reduce((a, b) => a + b, 0) / currentSegment.edrs.length,
        avgWind: Math.round(currentSegment.winds.reduce((a, b) => a + b, 0) / currentSegment.winds.length),
      })

      currentSegment = {
        start: i,
        end: i,
        level: forecast[i].turbulence.level,
        edrs: [forecast[i].turbulence.edr],
        winds: [forecast[i].turbulence.windSpeed],
      }
    }
  }

  // Push final segment
  segments.push({
    start: Math.round(forecast[currentSegment.start].distanceFromOrigin),
    end: Math.round(forecast[currentSegment.end].distanceFromOrigin),
    level: currentSegment.level,
    avgEDR: currentSegment.edrs.reduce((a, b) => a + b, 0) / currentSegment.edrs.length,
    avgWind: Math.round(currentSegment.winds.reduce((a, b) => a + b, 0) / currentSegment.winds.length),
  })

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-white/20">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Route Segments</h2>
      <p className="text-gray-600 mb-6">Detailed turbulence forecast by flight segment</p>

      <div className="space-y-3">
        {segments.map((segment, index) => {
          const color = getTurbulenceColor(segment.level as any)

          return (
            <div
              key={index}
              className="flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-md"
              style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}
            >
              {/* Color indicator */}
              <div
                className="w-2 h-16 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />

              {/* Segment info */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Distance</div>
                  <div className="font-semibold text-gray-900">
                    {segment.start} - {segment.end} km
                  </div>
                  <div className="text-xs text-gray-500">
                    from {origin}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Turbulence</div>
                  <div className="font-semibold capitalize" style={{ color }}>
                    {segment.level}
                  </div>
                  <div className="text-xs text-gray-500">
                    EDR: {segment.avgEDR.toFixed(3)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Wind Speed</div>
                  <div className="font-semibold text-gray-900">
                    {segment.avgWind} kts
                  </div>
                  <div className="text-xs text-gray-500">
                    Average
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Length</div>
                  <div className="font-semibold text-gray-900">
                    {segment.end - segment.start} km
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round((segment.end - segment.start) / forecast[forecast.length - 1].distanceFromOrigin * 100)}% of route
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
