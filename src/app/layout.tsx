import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteUrl, siteDescription } from '@/utils/site';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  robots: { index: true, follow: true },
  title: "Sun Direction | Bus & Train Seat Sun Calculator",
  description: "Calculate the sun's position relative to your transit route and find the best side of the bus or train to sit on to avoid the sun and glare.",
  keywords: ["bus seat sun calculator", "avoid sun on train", "which side of the bus to sit to avoid sun", "sun direction route planner", "shade travel app"],
  openGraph: {
    url: siteUrl,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Sun Direction — find your shadier seat' }],
    title: "Sun Direction | Bus & Train Seat Sun Calculator",
    description: "Calculate the sun's position relative to your transit route and find the best side to sit on to avoid the sun.",
    type: "website",
    siteName: "Sun Direction",
  },
  twitter: {
    images: ['/opengraph-image'],
    card: "summary_large_image",
    title: "Sun Direction | Bus & Train Seat Sun Calculator",
    description: "Find the best side of the bus or train to sit on to avoid the sun.",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SunDir",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafbf7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Sun Direction",
    "description": siteDescription,
    "url": siteUrl,
    "inLanguage": "en",
    "applicationCategory": "TravelApplication",
    "operatingSystem": "Any",
    "featureList": ["Bus and train seat sunlight estimates", "Departure timezone selection", "Sun bearing and elevation along a route"],
  };

  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      </body>
    </html>
  );
}
