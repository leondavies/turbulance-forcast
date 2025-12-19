import { Suspense } from 'react'
import { ForecastContent } from '@/components/forecast/ForecastContent'
import { Loading } from '@/components/ui'

export default function ForecastPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Loading text="Loading forecast..." size="lg" />
      </div>
    }>
      <ForecastContent />
    </Suspense>
  )
}
