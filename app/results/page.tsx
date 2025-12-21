import { Suspense } from 'react'
import { ResultsContent } from '@/components/search/ResultsContent'
import type { Metadata } from "next"
import { FullPageLoader } from "@/components/ui/FullPageLoader"

export const metadata: Metadata = {
  title: "Flight search results",
  description:
    "Flight search results for your selected route. Use the homepage search to choose departure and arrival airports.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <FullPageLoader label="Loading results..." sublabel="Finding flights for your route." />
    }>
      <ResultsContent />
    </Suspense>
  )
}
