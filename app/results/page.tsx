import { Suspense } from 'react'
import { ResultsContent } from '@/components/search/ResultsContent'
import { Card, CardContent } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-lg font-medium text-gray-700">Loading results...</p>
              <div className="w-full space-y-2 mt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}
