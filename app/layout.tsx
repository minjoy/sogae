import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "나마진 - 나의 마음 진단",
  description: "지금의 나를 제대로 알고 있나요? 5가지 심리 테스트로 진짜 나의 마음을 발견하고, 마음 준비가 된 후 건강한 연애를 시작하세요.",
  keywords: "심리테스트, 마음진단, 자기분석, MBTI, 연애준비, 번아웃체크, 감정패턴",
  openGraph: {
    title: "나마진 - 나의 마음 진단",
    description: "마음 준비가 됐을 때 시작하는 건강한 연애. 5분이면 완성되는 나만의 마음 사용설명서",
    type: "website",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "나마진 - 나의 마음 진단",
      },
    ],
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
