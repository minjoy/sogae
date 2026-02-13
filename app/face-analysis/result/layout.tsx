import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mytype.co.kr'

export const metadata: Metadata = {
  title: '관상 분석 결과 | 언연이',
  description: '당신의 관상 분석 결과를 확인하세요. 얼굴에 담긴 운명과 성격 특성을 알아보세요.',
  openGraph: {
    title: '관상 분석 결과 | 언연이',
    description: '당신의 관상 분석 결과를 확인하세요. 얼굴에 담긴 운명과 성격 특성을 알아보세요.',
    type: 'website',
    url: `${baseUrl}/face-analysis/result`,
    images: [
      {
        url: `${baseUrl}/D70AA339-A120-4BA2-8ABD-EB70D2D0B791.png`,
        width: 1200,
        height: 630,
        alt: '관상 분석 결과',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '관상 분석 결과 | 언연이',
    description: '당신의 관상 분석 결과를 확인하세요. 얼굴에 담긴 운명과 성격 특성을 알아보세요.',
    images: [`${baseUrl}/D70AA339-A120-4BA2-8ABD-EB70D2D0B791.png`],
  },
}

export default function FaceResultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
