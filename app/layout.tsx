import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TurbCast - Real-Time Flight Turbulence Forecast",
    template: "%s | TurbCast",
  },
  description: "Get real-time turbulence forecasts for your flight using official NOAA weather data. Know before you fly with accurate EDR predictions, pilot reports, and route-specific turbulence levels.",
  openGraph: {
    title: "TurbCast - Real-Time Flight Turbulence Forecast",
    description: "Real-time turbulence forecasts for your flight using official NOAA weather data",
    url: SITE_URL,
    siteName: "TurbCast",
    type: "website",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
        alt: "TurbCast - Flight Turbulence Forecast",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TurbCast - Real-Time Flight Turbulence Forecast",
    description: "Real-time turbulence forecasts for your flight",
    images: ["/opengraph.png"],
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TurbCast",
  url: SITE_URL,
  logo: `${SITE_URL}/opengraph.png`,
  description: "Real-time flight turbulence forecasts using official NOAA weather data",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TurbCast",
  url: SITE_URL,
  description: "Get real-time turbulence forecasts for your flight",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/results?origin={origin}&destination={destination}`,
    },
    "query-input": "required name=origin, required name=destination",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
