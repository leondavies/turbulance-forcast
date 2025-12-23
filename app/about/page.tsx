import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import type { Metadata } from "next"
import { SITE_URL } from "@/lib/site"

export const metadata: Metadata = {
  title: "About TurbCast (how it works)",
  description:
    "Learn how TurbCast creates turbulence forecasts using aviation weather data, route calculations, and aircraft-specific adjustments.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About TurbCast (how it works)",
    description:
      "How TurbCast creates route-specific turbulence forecasts using aviation weather data.",
    url: `${SITE_URL}/about`,
  },
}

export default function About() {
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          About TurbCast
        </h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">What is TurbCast?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                TurbCast is a turbulence forecast tool designed for curious or nervous flyers.
                It provides detailed turbulence predictions for flights up to 36 hours in advance,
                using aviation weather data from NOAA’s Aviation Weather Center and route-based modelling.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-gray-700">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">1. Enter Your Flight Details</h3>
                  <p>Provide your departure and arrival airports, along with your departure time.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">2. We Calculate Your Route</h3>
                  <p>Our system determines the most likely flight path using Great Circle calculations.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">3. Weather Data Analysis</h3>
                  <p>We pull official aviation advisories and pilot reports (SIGMETs, AIRMETs, PIREPs) from NOAA’s Aviation Weather Center and apply them along your route.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">4. Aircraft-Specific Forecast</h3>
                  <p>Turbulence is experienced differently based on aircraft size. We adjust predictions for your aircraft type.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Data Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700">
                <li>
                  <strong>Turbulence forecast model:</strong> NOAA WAFS (World Area Forecast System) — Global turbulence forecasts
                </li>
                <li>
                  <strong>Aviation weather advisories:</strong> NOAA Aviation Weather Center — SIGMETs, AIRMETs, and G-AIRMETs
                </li>
                <li>
                  <strong>Pilot reports:</strong> NOAA Aviation Weather Center — Real-time PIREPs from aircraft near your route
                </li>
                <li>
                  <strong>International coverage:</strong> Worldwide turbulence forecasts for all commercial routes
                </li>
                <li>
                  <strong>Flight schedules:</strong> AirLabs
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Understanding Turbulence Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-turbulence-smooth mt-1"></div>
                  <div>
                    <strong>Smooth:</strong> No turbulence felt
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-turbulence-light mt-1"></div>
                  <div>
                    <strong>Light:</strong> Slight, erratic changes in altitude. Items may move slightly.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-turbulence-moderate mt-1"></div>
                  <div>
                    <strong>Moderate:</strong> Noticeable changes in altitude. Unsecured objects move around.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-turbulence-severe mt-1"></div>
                  <div>
                    <strong>Severe:</strong> Large, abrupt changes in altitude. Difficult to walk. Objects tossed about.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-turbulence-extreme mt-1"></div>
                  <div>
                    <strong>Extreme:</strong> Aircraft may be momentarily out of control. Very rare.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Important Disclaimer</h3>
            <p className="text-sm text-blue-800">
              Turbulence forecasts are for informational purposes only and should not replace
              official airline guidance or pilot judgment. Weather conditions can change rapidly.
              Always follow the instructions of your flight crew and keep your seatbelt fastened when seated.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
