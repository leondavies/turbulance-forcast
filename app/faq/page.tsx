import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Turbulence FAQ (for nervous flyers)",
  description:
    "Practical, reassuring answers about turbulence: safety, what causes it, and what you can do to feel more comfortable on bumpy flights.",
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Turbulence FAQ (for nervous flyers)",
    description:
      "Reassuring answers about turbulence: safety, what causes it, and tips for feeling more comfortable.",
    url: `${SITE_URL}/faq`,
  },
};

const faqs = [
  {
    q: "Is turbulence dangerous?",
    a: "Turbulence is usually uncomfortable rather than dangerous. Modern commercial aircraft are designed and tested to handle forces far beyond typical turbulence. The most common risk is injury from not wearing a seatbelt, so keeping your seatbelt fastened when seated is the best precaution.",
  },
  {
    q: "What causes turbulence?",
    a: "Most turbulence comes from changes in airflow: jet streams, storms and thunderstorm outflow, mountain waves, and temperature contrasts. Pilots and dispatch teams plan routes and altitudes to reduce exposure where possible.",
  },
  {
    q: "Can pilots see turbulence on radar?",
    a: "Weather radar is great for detecting precipitation and storm structure, but clear-air turbulence often isn’t visible. That’s why airlines use multiple sources, including forecasts and pilot reports, to anticipate where bumps are more likely.",
  },
  {
    q: "What should I do during turbulence?",
    a: "Stay seated if you can, keep your seatbelt fastened low and snug, and follow crew instructions. If you’re feeling anxious, slow breathing (a longer exhale than inhale) can help, and focusing on a fixed point can reduce motion discomfort.",
  },
  {
    q: "Does the time of year affect turbulence?",
    a: "Yes. Seasonal patterns can influence jet streams and storm tracks. Some routes are bumpier during certain months, but conditions also change day-to-day, which is why checking a route-specific forecast close to departure can be useful.",
  },
  {
    q: "How accurate are turbulence forecasts?",
    a: "Forecasts estimate where turbulence is more likely based on atmospheric conditions. They’re helpful for planning and setting expectations, but they aren’t perfect — turbulence can be localised and change quickly. Treat forecasts as guidance, not a guarantee.",
  },
];

export default function FaqPage() {
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a,
            },
          })),
        }}
      />

      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-3 text-center">
          Turbulence FAQ
        </h1>
        <p className="text-gray-700 text-center max-w-3xl mx-auto mb-10">
          Clear, reassuring answers for nervous flyers — plus practical tips you
          can use on the day.
        </p>

        <div className="grid gap-6">
          {faqs.map((f) => (
            <Card key={f.q}>
              <CardHeader>
                <CardTitle className="text-2xl">{f.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{f.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="font-semibold text-blue-900 mb-2">
            Want a route-specific forecast?
          </h2>
          <p className="text-sm text-blue-800 mb-4">
            If you share your departure and arrival airports, TurbCast can show
            what conditions are likely along your flight path.
          </p>
          <Link
            href="/#search"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            Search flights
          </Link>
        </div>
      </div>
    </div>
  );
}


