import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "소개 - 나를 이해하면, 관계가 쉬워진다",
  description: "5가지 테스트로 나를 이해하고, 관계를 준비하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
