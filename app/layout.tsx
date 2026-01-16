import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "나지연 - 나, 지금 연애할 때?",
  description: "지금의 나를 제대로 알고 있나요? 5가지 심리 테스트로 진짜 나의 마음을 발견하고, 연애 준비 상태를 확인하세요.",
  keywords: "심리테스트, 연애준비, 자기분석, MBTI, 마음진단, 번아웃체크, 감정패턴",
  openGraph: {
    title: "나지연 - 나, 지금 연애할 때?",
    description: "지금의 나를 제대로 알고 있나요? 5분이면 완성되는 나만의 마음 진단",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased bg-warm-50">
        <Header />
        {children}
      </body>
    </html>
  );
}
