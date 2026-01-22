import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "두쫀쿠맵 | 내 주변 두바이 초콜릿 쫀득 쿠키 매장 찾기",
  description: "두바이 초콜릿 쫀득 쿠키(두쫀쿠) 파는 곳을 지도에서 한눈에! 내 주변 두쫀쿠 매장 위치, 가격, 메뉴 정보를 확인하세요.",
  keywords: ["두쫀쿠", "두바이 초콜릿", "쫀득 쿠키", "두바이 쿠키", "디저트 맛집", "두쫀쿠 맵"],
  openGraph: {
    title: "두쫀쿠맵 | 내 주변 두바이 초콜릿 쫀득 쿠키 매장 찾기",
    description: "두바이 초콜릿 쫀득 쿠키(두쫀쿠) 파는 곳을 지도에서 한눈에! 내 주변 두쫀쿠 매장 위치, 가격, 메뉴 정보를 확인하세요.",
    url: "https://unyeoni.com/dujjonku-map",
    siteName: "언연이",
    images: [
      {
        url: "/images/og-image-dubai.png",
        width: 1200,
        height: 630,
        alt: "두쫀쿠맵 - 두바이 초콜릿 쫀득 쿠키 매장 지도",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "두쫀쿠맵 | 내 주변 두바이 초콜릿 쫀득 쿠키 매장 찾기",
    description: "두바이 초콜릿 쫀득 쿠키(두쫀쿠) 파는 곳을 지도에서 한눈에!",
    images: ["/images/og-image-dubai.png"],
  },
};

export default function DujjonkuMapLayout({
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
