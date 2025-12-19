import { Suspense } from 'react'
import { ResultsContent } from '@/components/search/ResultsContent'
import { Loading } from '@/components/ui'

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Loading text="Loading..." size="lg" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}
