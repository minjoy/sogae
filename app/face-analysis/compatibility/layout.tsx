import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mytype.co.kr'

export const metadata: Metadata = {
  title: '두 사람 궁합 분석 | 언연이',
  description: '관상으로 보는 두 사람의 인연! 전통 관상학과 오행 이론을 바탕으로 두 분의 깊은 인연을 분석해드립니다.',
  openGraph: {
    title: '두 사람 궁합 분석 | 언연이',
    description: '관상으로 보는 두 사람의 인연! 전통 관상학과 오행 이론을 바탕으로 두 분의 깊은 인연을 분석해드립니다.',
    type: 'website',
    url: `${baseUrl}/face-analysis/compatibility`,
    images: [
      {
        url: `${baseUrl}/og-image-optimized.png?v=3`,
        width: 1200,
        height: 630,
        alt: '두 사람 궁합 분석',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '두 사람 궁합 분석 | 언연이',
    description: '관상으로 보는 두 사람의 인연! 전통 관상학과 오행 이론을 바탕으로 두 분의 깊은 인연을 분석해드립니다.',
    images: [`${baseUrl}/og-image-optimized.png?v=3`],
  },
}

export default function CompatibilityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
