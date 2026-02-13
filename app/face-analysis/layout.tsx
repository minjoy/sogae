import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mytype.co.kr'

export const metadata: Metadata = {
  title: '경험 기반 관상 풀이 | 언연이',
  description: '다년간의 관상학 연구와 고전 문헌을 바탕으로 얼굴 특징에 담긴 의미를 풀어드려요. 나의 얼굴에 담긴 운명을 확인해보세요!',
  openGraph: {
    title: '경험 기반 관상 풀이 | 언연이',
    description: '다년간의 관상학 연구와 고전 문헌을 바탕으로 얼굴 특징에 담긴 의미를 풀어드려요.',
    type: 'website',
    url: `${baseUrl}/face-analysis`,
    images: [
      {
        url: `${baseUrl}/og-image-optimized.png`,
        width: 1200,
        height: 630,
        alt: '관상 분석',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '경험 기반 관상 풀이 | 언연이',
    description: '다년간의 관상학 연구와 고전 문헌을 바탕으로 얼굴 특징에 담긴 의미를 풀어드려요.',
    images: [`${baseUrl}/og-image-optimized.png`],
  },
}

export default function FaceAnalysisLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
