import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Clock, Database, CloudRain, Plane } from 'lucide-react'

interface DataSourcesProps {
  metadata: {
    pirepCount: number
    sigmetCount: number
    airmetCount: number
    dataQuality: 'high' | 'medium' | 'low'
    lastUpdated: string
    usingFallback: boolean
  }
  cached?: boolean
}

export function DataSources({ metadata, cached }: DataSourcesProps) {
  const { pirepCount, sigmetCount, airmetCount, dataQuality, lastUpdated, usingFallback } = metadata

  // Calculate how long ago the data was updated
  const minutesAgo = Math.round((Date.now() - new Date(lastUpdated).getTime()) / 60000)
  const timeAgoText = minutesAgo < 1 ? 'Just now' :
                      minutesAgo === 1 ? '1 minute ago' :
                      minutesAgo < 60 ? `${minutesAgo} minutes ago` :
                      `${Math.round(minutesAgo / 60)} hours ago`

  const qualityColor = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-orange-100 text-orange-800 border-orange-200'
  }[dataQuality]

  const qualityIcon = {
    high: '🟢',
    medium: '🟡',
    low: '🟠'
  }[dataQuality]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data Sources & Confidence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Badge */}
        <div className="flex items-center justify-between p-3 rounded-lg border-2" style={{ borderColor: qualityColor.split(' ')[2] }}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{qualityIcon}</span>
            <div>
              <div className="font-semibold text-sm">Forecast Confidence</div>
              <div className="text-xs text-gray-600 capitalize">{dataQuality} quality data</div>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${qualityColor}`}>
            {dataQuality.toUpperCase()}
          </div>
        </div>

        {/* Data Sources Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
            <div className="flex items-center justify-center mb-1">
              <Plane className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{pirepCount}</div>
            <div className="text-xs text-gray-600">PIREPs</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100">
            <div className="flex items-center justify-center mb-1">
              <CloudRain className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-700">{sigmetCount}</div>
            <div className="text-xs text-gray-600">SIGMETs</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-100">
            <div className="flex items-center justify-center mb-1">
              <CloudRain className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-700">{airmetCount}</div>
            <div className="text-xs text-gray-600">AIRMETs</div>
          </div>

          <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-200">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-700">{minutesAgo < 60 ? `${minutesAgo}m` : `${Math.round(minutesAgo/60)}h`}</div>
            <div className="text-xs text-gray-600">Updated</div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-2 text-xs text-gray-600">
          {cached && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-100">
              <span>⚡</span>
              <span>Cached forecast - last generated {timeAgoText}</span>
            </div>
          )}
          {usingFallback && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-md border border-yellow-100">
              <span>⚠️</span>
              <span>Using atmospheric model (real-time weather data unavailable)</span>
            </div>
          )}
          {!usingFallback && pirepCount > 0 && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-100">
              <span>✓</span>
              <span>Based on recent pilot reports and official aviation weather advisories</span>
            </div>
          )}
        </div>

        {/* Data Explanation */}
        <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
          <p className="mb-2"><strong>PIREPs:</strong> Pilot reports of actual turbulence encountered</p>
          <p className="mb-2"><strong>SIGMETs:</strong> Significant meteorological information from NOAA</p>
          <p><strong>AIRMETs:</strong> Airmen's meteorological information for moderate conditions</p>
        </div>
      </CardContent>
    </Card>
  )
}
