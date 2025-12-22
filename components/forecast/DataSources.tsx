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
  const hasAnyReports = pirepCount > 0 || sigmetCount > 0 || airmetCount > 0

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

  const supportLabel = {
    high: 'Strong',
    medium: 'Some',
    low: 'Limited',
  }[dataQuality]

  const supportSummary = usingFallback
    ? 'Model-based forecast (reports unavailable)'
    : dataQuality === 'high'
      ? 'Strong support from recent reports/advisories'
      : dataQuality === 'medium'
        ? 'Some support from recent reports/advisories'
        : 'No recent reports found near this route'

  const supportDetail = usingFallback
    ? "Forecast generated from atmospheric models. Recent pilot reports/advisories weren’t available at the time of this forecast."
    : dataQuality === 'high'
      ? 'Multiple recent reports/advisories support this route.'
      : dataQuality === 'medium'
        ? 'Some reports/advisories were available near this route.'
        : "No recent reports were found near this route right now. That can mean conditions are uneventful — or simply that fewer reports were available."

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="h-5 w-5" />
          Data sources (optional)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <details className="group rounded-xl border bg-white overflow-hidden">
          <summary className="cursor-pointer list-none p-4 sm:p-5">
            {/* Mobile: 3-row layout so the summary can use full width */}
            <div className="sm:hidden space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl leading-none">{qualityIcon}</span>
                  <div className="font-semibold text-base text-gray-900">
                    Data support: {supportLabel}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${qualityColor}`}>
                  {dataQuality.toUpperCase()}
                </span>
              </div>

              <div className="text-sm text-gray-600">
                {supportSummary}
              </div>

              <div className="flex items-center justify-start gap-1.5 text-xs text-gray-600">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Updated {timeAgoText}</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform leading-none">
                  ▾
                </span>
              </div>
            </div>

            {/* Tablet/Desktop: compact two-column layout */}
            <div className="hidden sm:flex items-stretch justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{qualityIcon}</span>
                  <div className="font-semibold text-sm sm:text-base text-gray-900">
                    Data support: {supportLabel}
                  </div>
                </div>

                <div className="mt-1 text-xs sm:text-sm text-gray-600">
                  {supportSummary}
                </div>
              </div>

              <div className="self-stretch flex flex-col items-end justify-between flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${qualityColor}`}>
                  {dataQuality.toUpperCase()}
                </span>
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-600">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Updated {timeAgoText}</span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform leading-none">
                    ▾
                  </span>
                </div>
              </div>
            </div>
          </summary>

          <div className="px-4 pb-4 pt-0 space-y-4">
            {/* What this means */}
            <div className="text-sm text-gray-700 leading-relaxed">
              {supportDetail}
            </div>

            {/* Data Sources Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center justify-center mb-1">
                  <Plane className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-700">{pirepCount}</div>
                <div className="text-xs text-gray-600">PIREPs near route</div>
              </div>

              <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-center justify-center mb-1">
                  <CloudRain className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-red-700">{sigmetCount}</div>
                <div className="text-xs text-gray-600">SIGMETs (turb.)</div>
              </div>

              <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-100">
                <div className="flex items-center justify-center mb-1">
                  <CloudRain className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-700">{airmetCount}</div>
                <div className="text-xs text-gray-600">AIRMETs (turb.)</div>
              </div>

              <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-center mb-1">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-700">
                  {minutesAgo < 60 ? `${minutesAgo}m` : `${Math.round(minutesAgo / 60)}h`}
                </div>
                <div className="text-xs text-gray-600">Generated</div>
              </div>
            </div>

            {/* Status Messages */}
            <div className="space-y-2 text-xs text-gray-600">
              {cached && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                  <span>⚡</span>
                  <span>Cached forecast — last generated {timeAgoText}</span>
                </div>
              )}
              {usingFallback && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-md border border-yellow-100">
                  <span>⚠️</span>
                  <span>Model-based forecast (recent reports/advisories unavailable for this run)</span>
                </div>
              )}
              {!usingFallback && hasAnyReports && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-100">
                  <span>✓</span>
                  <span>Includes official advisories and any nearby pilot reports available</span>
                </div>
              )}
              {!usingFallback && !hasAnyReports && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
                  <span>ℹ️</span>
                  <span>
                    No recent reports were found near this route right now. That can mean conditions are uneventful — or simply that fewer reports were available.
                  </span>
                </div>
              )}
            </div>

            {/* Data Explanation */}
            <div className="pt-3 border-t border-gray-200 text-xs text-gray-500">
              <p className="mb-2">
                <strong>PIREPs:</strong> Pilot reports of turbulence encountered (often sparse).
              </p>
              <p className="mb-2">
                <strong>SIGMETs:</strong> Official NOAA advisories for significant weather (including turbulence).
              </p>
              <p>
                <strong>AIRMETs:</strong> Official advisories for more widespread moderate conditions.
              </p>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}
