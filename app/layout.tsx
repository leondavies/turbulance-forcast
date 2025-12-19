import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import "./globals.css";

export const metadata: Metadata = {
  title: "TurbCast - Flight Turbulence Forecast",
  description: "Real-time turbulence forecasts for your flight. Get accurate turbulence predictions along your exact route with live NOAA weather data.",
  keywords: "turbulence forecast, flight turbulence, turbcast, aviation weather, flight weather, turbulence prediction",
  openGraph: {
    title: "TurbCast - Flight Turbulence Forecast",
    description: "Real-time turbulence forecasts for your flight",
    url: "https://turbcast.com",
    siteName: "TurbCast",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TurbCast - Flight Turbulence Forecast",
    description: "Real-time turbulence forecasts for your flight",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
