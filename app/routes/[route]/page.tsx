import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { JsonLd } from "@/components/seo/JsonLd";

type PageProps = {
  params: Promise<{ route: string }>;
};

function parseRouteSlug(slug: string) {
  const m = slug.match(/^([a-zA-Z]{3})-to-([a-zA-Z]{3})$/);
  if (!m) return null;
  return { origin: m[1].toUpperCase(), destination: m[2].toUpperCase() };
}

async function safeGetAirport(iata: string) {
  try {
    return await prisma.airport.findUnique({ where: { iata } });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { route } = await params;
  const parsed = parseRouteSlug(route);
  if (!parsed) return {};

  const { origin, destination } = parsed;

  const [o, d] = await Promise.all([safeGetAirport(origin), safeGetAirport(destination)]);
  const originLabel = o?.city ? `${o.city} (${origin})` : origin;
  const destinationLabel = d?.city ? `${d.city} (${destination})` : destination;

  const title = `${originLabel} to ${destinationLabel} turbulence forecast`;
  const description =
    `Check expected turbulence for flights from ${originLabel} to ${destinationLabel}. ` +
    "A calm, route-specific view to help you feel more prepared before you fly.";

  const canonical = `/routes/${route.toLowerCase()}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonical}`,
    },
  };
}

export default async function RouteLandingPage({ params }: PageProps) {
  const { route } = await params;
  const parsed = parseRouteSlug(route);
  if (!parsed) notFound();

  const { origin, destination } = parsed;
  const [o, d] = await Promise.all([safeGetAirport(origin), safeGetAirport(destination)]);

  const originName =
    o?.city && o?.country ? `${o.city}, ${o.country}` : o?.name || origin;
  const destinationName =
    d?.city && d?.country ? `${d.city}, ${d.country}` : d?.name || destination;

  const canonicalPath = `/routes/${route.toLowerCase()}`;

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: SITE_URL,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Routes",
                item: `${SITE_URL}/routes/${route.toLowerCase()}`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: `${origin} to ${destination}`,
                item: `${SITE_URL}${canonicalPath}`,
              },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${origin} to ${destination} turbulence forecast`,
            url: `${SITE_URL}${canonicalPath}`,
            isPartOf: {
              "@type": "WebSite",
              name: "TurbCast",
              url: SITE_URL,
            },
          },
        ]}
      />
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-2">
            Route turbulence forecast
          </p>
          <h1 className="text-4xl font-bold text-gray-900">
            {origin} to {destination} turbulence forecast
          </h1>
          <p className="text-gray-700 mt-3">
            {originName} → {destinationName}
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">What you’ll get</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-gray-700">
              <p>
                TurbCast estimates where turbulence is more likely along this
                route using aviation weather data. It’s designed to be clear
                and calming — especially if you’re a nervous flyer.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Route-specific turbulence levels along the flight path</li>
                <li>Data-source confidence signals (where available)</li>
                <li>A quick summary for “what to expect”</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Check today’s flights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                To generate a detailed forecast, use the flight search and
                select your flight.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/results?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  Search today’s flights
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Read the turbulence FAQ
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="font-semibold text-blue-900 mb-2">
              Helpful reminder
            </h2>
            <p className="text-sm text-blue-800">
              Turbulence is typically uncomfortable rather than dangerous.
              The most common risk is injury from not wearing a seatbelt — so
              keep it fastened when seated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


