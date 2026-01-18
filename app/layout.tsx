import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mytype.co.kr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "언연이 - 언제 연애하는게 이득일까",
  description: "현재의 마음 상태를 분석해서 연애할 타이밍인지, 어떤 상태의 상대방이 잘 어울리는지 분석하는 서비스입니다.",
  keywords: "심리테스트, 연애타이밍, 연애준비, 궁합분석, 마음상태, 번아웃체크, 감정패턴, 언연이",
  openGraph: {
    title: "언연이 - 언제 연애하는게 이득일까",
    description: "현재의 마음 상태를 분석해서 연애할 타이밍인지, 어떤 상대방이 잘 어울리는지 알려드려요.",
    type: "website",
    siteName: "언연이",
    url: siteUrl,
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
    description: "현재의 마음 상태를 분석해서 연애할 타이밍인지, 어떤 상대방이 잘 어울리는지 알려드려요.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-warm-50 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
