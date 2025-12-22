import { getTurbulenceColor } from '@/services/weather/aviationWeather'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

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
  if (!forecast || forecast.length < 2) return null

  // Group consecutive *intervals* with the same turbulence level.
  // Each waypoint i represents the segment from distance[i] -> distance[i+1].
  const segments: Array<{
    startKm: number
    endKm: number
    level: string
    avgEDR: number
    avgWind: number
  }> = []

  const totalDistanceKm = forecast[forecast.length - 1].distanceFromOrigin

  let segStartIdx = 0
  let segEndIdx = 0 // inclusive, max forecast.length - 2
  let segLevel = forecast[0].turbulence.level
  let edrs: number[] = [forecast[0].turbulence.edr]
  let winds: number[] = [forecast[0].turbulence.windSpeed]

  for (let i = 1; i < forecast.length - 1; i++) {
    const lvl = forecast[i].turbulence.level
    if (lvl === segLevel) {
      segEndIdx = i
      edrs.push(forecast[i].turbulence.edr)
      winds.push(forecast[i].turbulence.windSpeed)
      continue
    }

    segments.push({
      startKm: forecast[segStartIdx].distanceFromOrigin,
      endKm: forecast[segEndIdx + 1].distanceFromOrigin,
      level: segLevel,
      avgEDR: edrs.reduce((a, b) => a + b, 0) / edrs.length,
      avgWind: Math.round(winds.reduce((a, b) => a + b, 0) / winds.length),
    })

    segStartIdx = i
    segEndIdx = i
    segLevel = lvl
    edrs = [forecast[i].turbulence.edr]
    winds = [forecast[i].turbulence.windSpeed]
  }

  // Push final segment (ending at total distance).
  segments.push({
    startKm: forecast[segStartIdx].distanceFromOrigin,
    endKm: forecast[Math.min(segEndIdx + 1, forecast.length - 1)].distanceFromOrigin,
    level: segLevel,
    avgEDR: edrs.reduce((a, b) => a + b, 0) / edrs.length,
    avgWind: Math.round(winds.reduce((a, b) => a + b, 0) / winds.length),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Route Segments</CardTitle>
        <CardDescription>Detailed turbulence forecast by flight segment</CardDescription>
      </CardHeader>
      <CardContent>
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
                    {Math.round(segment.startKm)} - {Math.round(segment.endKm)} km
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
                    {Math.max(0, Math.round(segment.endKm - segment.startKm))} km
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(((segment.endKm - segment.startKm) / Math.max(1, totalDistanceKm)) * 100)}% of route
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        </div>
      </CardContent>
    </Card>
  )
}
