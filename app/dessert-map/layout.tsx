import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "디저트맵 | 내 주변 디저트 맛집 찾기",
  description: "쿠키, 초콜릿, 케이크, 마카롱 등 디저트 파는 곳을 지도에서 한눈에! 내 주변 디저트 맛집 위치, 가격, 메뉴 정보를 확인하세요.",
  keywords: ["디저트맵", "디저트", "쿠키", "초콜릿", "케이크", "마카롱", "디저트 맛집", "두바이 초콜릿", "쫀득 쿠키"],
  openGraph: {
    title: "디저트맵 | 내 주변 디저트 맛집 찾기",
    description: "쿠키, 초콜릿, 케이크, 마카롱 등 디저트 파는 곳을 지도에서 한눈에! 내 주변 디저트 맛집 위치, 가격, 메뉴 정보를 확인하세요.",
    url: "https://unyeoni.com/dessert-map",
    siteName: "언연이",
    images: [
      {
        url: "/images/og-image-dessert.png",
        width: 1200,
        height: 630,
        alt: "디저트맵 - 디저트 맛집 지도",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "디저트맵 | 내 주변 디저트 맛집 찾기",
    description: "쿠키, 초콜릿, 케이크, 마카롱 등 디저트 파는 곳을 지도에서 한눈에!",
    images: ["/images/og-image-dessert.png"],
  },
};

export default function DessertMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
      {children}
    </>
  );
}
