import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "두쫀쿠맵 | 언연이",
  description: "불안한 마음을 달달하게 달래줄 두쫀쿠 매장을 찾아보세요",
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
