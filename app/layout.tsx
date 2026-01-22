import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mytype.co.kr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "언연이 - 언제 연애하는게 이득일까",
    template: "%s | 언연이",
  },
  description: "애착유형, 연애심리, 번아웃 등 5가지 심리테스트로 나의 연애 타이밍과 어울리는 상대를 분석해드려요. 무료 연애 심리검사.",
  keywords: "애착테스트, 연애심리테스트, 언연이, 심리검사, 번아웃검사, 애착유형테스트, 연애타이밍, 연애준비, 궁합분석, 마음상태, 감정패턴, 무료심리테스트",
  authors: [{ name: "언연이" }],
  creator: "언연이",
  publisher: "언연이",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "SBM9a2rSyrSOUlRcc5RpldxSXMN8NSnyyJ74G5UrtjY",
    other: {
      "naver-site-verification": "4f2262309f9802881cb35ac02c396973ba1d34a9",
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "언연이 - 언제 연애하는게 이득일까",
    description: "애착유형, 연애심리, 번아웃 등 5가지 심리테스트로 나의 연애 타이밍과 어울리는 상대를 분석해드려요.",
    type: "website",
    siteName: "언연이",
    url: siteUrl,
    locale: "ko_KR",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "언연이 - 언제 연애하는게 이득일까",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "언연이 - 언제 연애하는게 이득일까",
    description: "애착유형, 연애심리, 번아웃 등 5가지 심리테스트로 나의 연애 타이밍과 어울리는 상대를 분석해드려요.",
    images: ["/images/og-image.png"],
  },
};

// JSON-LD 구조화 데이터
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "언연이",
  "description": "애착유형, 연애심리, 번아웃 등 5가지 심리테스트로 나의 연애 타이밍과 어울리는 상대를 분석해드려요.",
  "url": siteUrl,
  "applicationCategory": "LifestyleApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-warm-50 flex flex-col min-h-screen">
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3512251263610351"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7LK6RWFPHP"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7LK6RWFPHP');
          `}
        </Script>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
