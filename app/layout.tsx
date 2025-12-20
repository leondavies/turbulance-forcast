import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import Script from "next/script";
import { Suspense } from "react";
import GtmPageView from "@/components/analytics/GtmPageView";
import ConsentBanner from "@/components/analytics/ConsentBanner";
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
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const isProd = process.env.NODE_ENV === "production";

  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen">
        {gtmId && isProd ? (
          <>
            <Script id="gtm" strategy="afterInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
            </Script>
            <noscript
              dangerouslySetInnerHTML={{
                __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
              }}
            />
          </>
        ) : null}
        <Header />
        {gtmId && isProd ? (
          <Suspense fallback={null}>
            <GtmPageView />
          </Suspense>
        ) : null}
        {gtmId && isProd ? <ConsentBanner /> : null}
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
