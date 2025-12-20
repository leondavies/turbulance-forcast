import { FlightSearchForm } from '@/components/search/FlightSearchForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/badge'
import { Plane, CloudRain, MapPin, TrendingUp, Shield, Clock } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 py-24 md:py-32">
        <div className="container relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-white/20 text-white hover:bg-white/30" variant="secondary">
              <Plane className="mr-2 h-3 w-3" />
              Real-time Aviation Weather Data
            </Badge>

            <h1 className="mb-6 text-5xl font-black tracking-tight text-white md:text-7xl">
              TurbCast
            </h1>

            <p className="mb-4 text-2xl font-semibold text-blue-100 md:text-3xl">
              Know Before You Fly
            </p>

            <p className="mb-12 text-lg text-blue-100/90 md:text-xl">
              Get accurate turbulence forecasts for your flight with real-time NOAA weather data
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Badge className="bg-white/10 backdrop-blur-sm text-white" variant="outline">
                ⚡ Live Updates
              </Badge>
              <Badge className="bg-white/10 backdrop-blur-sm text-white" variant="outline">
                🌍 6,000+ Airports
              </Badge>
              <Badge className="bg-white/10 backdrop-blur-sm text-white" variant="outline">
                📊 Official NOAA Data
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section id="search" className="relative -mt-16 pb-24">
        <div className="container px-4 sm:px-6 lg:px-8">
          <Card className="mx-auto max-w-4xl shadow-2xl">
            <CardHeader>
              <CardTitle className="text-center text-3xl">Search Your Flight</CardTitle>
              <CardDescription className="text-center text-base">
                Enter your departure and arrival airports to get turbulence forecasts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FlightSearchForm />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Why Choose TurbCast?
            </h2>
            <p className="text-lg text-muted-foreground">
              Professional-grade turbulence forecasts powered by official aviation weather data
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card className="relative overflow-hidden border-2 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <CardTitle>Real-Time Data</CardTitle>
                <CardDescription>
                  Live turbulence reports from pilots and official NOAA weather forecasts updated every 10 minutes
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden border-2 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 mb-4">
                  <CloudRain className="h-6 w-6" />
                </div>
                <CardTitle>NOAA Weather Data</CardTitle>
                <CardDescription>
                  Official SIGMET, AIRMET, and PIREP data from the Aviation Weather Center for maximum accuracy
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden border-2 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 mb-4">
                  <MapPin className="h-6 w-6" />
                </div>
                <CardTitle>Route-Specific</CardTitle>
                <CardDescription>
                  Detailed forecasts tailored to your exact flight path with segment-by-segment turbulence levels
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 text-center md:grid-cols-3">
            <div>
              <div className="mb-2 text-6xl font-black md:text-7xl">
                6,000+
              </div>
              <div className="text-xl font-semibold opacity-90">Airports Worldwide</div>
              <p className="mt-2 text-sm text-blue-100">Search from any airport</p>
            </div>
            <div>
              <div className="mb-2 text-6xl font-black md:text-7xl">
                100%
              </div>
              <div className="text-xl font-semibold opacity-90">NOAA Weather Data</div>
              <p className="mt-2 text-sm text-blue-100">Official forecasts</p>
            </div>
            <div>
              <div className="mb-2 text-6xl font-black md:text-7xl">
                24/7
              </div>
              <div className="text-xl font-semibold opacity-90">Real-Time Updates</div>
              <p className="mt-2 text-sm text-blue-100">Always current</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container px-4 sm:px-6 lg:px-8">
          <Card className="mx-auto max-w-4xl border-2 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Shield className="h-8 w-8" />
              </div>
              <CardTitle className="text-4xl">Ready for a Smoother Flight?</CardTitle>
              <CardDescription className="text-lg">
                Start getting turbulence forecasts for your flights today
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <a
                href="#search"
                className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-8 text-base font-semibold text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1"
              >
                <Plane className="mr-2 h-4 w-4" />
                Search Flights Now
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
