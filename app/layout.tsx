import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import Script from "next/script";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { ScrollManager } from "@/components/layout/ScrollManager";
import GtmPageView from "@/components/analytics/GtmPageView";
import ConsentBanner from "@/components/analytics/ConsentBanner";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "TurbCast — Flight turbulence forecast",
    template: "%s | TurbCast",
  },
  description:
    "Check expected turbulence for your flight route using live aviation weather data. Clear, calm forecasts to help you feel more prepared before you fly.",
  applicationName: "TurbCast",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/turbcast-favicon-square.png", type: "image/png", sizes: "552x552" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "TurbCast — Flight turbulence forecast",
    description:
      "Check expected turbulence for your flight route using live aviation weather data.",
    url: SITE_URL,
    siteName: "TurbCast",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "TurbCast — Flight turbulence forecast",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TurbCast — Flight turbulence forecast",
    description:
      "Check expected turbulence for your flight route using live aviation weather data.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
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
        <Suspense fallback={null}>
          <ScrollManager />
        </Suspense>
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
        <Analytics />
      </body>
    </html>
  );
}
