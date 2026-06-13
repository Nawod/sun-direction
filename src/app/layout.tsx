import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sun Direction | Bus & Train Seat Sun Calculator",
  description: "Calculate the sun's position relative to your transit route and find the best side of the bus or train to sit on to avoid the sun and glare.",
  keywords: ["bus seat sun calculator", "avoid sun on train", "which side of the bus to sit to avoid sun", "sun direction route planner", "shade travel app"],
  openGraph: {
    title: "Sun Direction | Bus & Train Seat Sun Calculator",
    description: "Calculate the sun's position relative to your transit route and find the best side to sit on to avoid the sun.",
    type: "website",
    siteName: "Sun Direction",
  },
  twitter: {
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
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
    "description": "Calculate the sun's position relative to your transit route and find the best side of the bus or train to sit on to avoid the sun and glare.",
    "applicationCategory": "TravelApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
    },
  };

  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
