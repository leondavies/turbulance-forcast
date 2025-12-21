import { Suspense } from 'react'
import { ForecastContent } from '@/components/forecast/ForecastContent'
import type { Metadata } from "next"
import { FullPageLoader } from "@/components/ui/FullPageLoader"

export const metadata: Metadata = {
  title: "Turbulence forecast",
  description:
    "Turbulence forecast for a selected flight. This page is generated from your query parameters.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function ForecastPage() {
  return (
    <Suspense fallback={
      <FullPageLoader label="Loading forecast..." sublabel="Preparing your route and charts." />
    }>
      <ForecastContent />
    </Suspense>
  )
}
