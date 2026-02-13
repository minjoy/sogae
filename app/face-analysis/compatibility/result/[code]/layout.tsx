import { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mytype.co.kr'

export const metadata: Metadata = {
  title: '궁합 분석 결과 | 언연이',
  description: '친구들의 관상 궁합을 구경하세요! 두 사람의 운명적 인연을 확인해보세요.',
  openGraph: {
    title: '친구들의 관상 궁합을 구경하세요!',
    description: '두 사람의 운명적 인연을 확인해보세요. 전통 관상학과 오행 이론을 바탕으로 분석한 궁합 결과입니다.',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/D70AA339-A120-4BA2-8ABD-EB70D2D0B791.png`,
        width: 1200,
        height: 630,
        alt: '궁합 분석 결과',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '친구들의 관상 궁합을 구경하세요!',
    description: '두 사람의 운명적 인연을 확인해보세요. 전통 관상학과 오행 이론을 바탕으로 분석한 궁합 결과입니다.',
    images: [`${baseUrl}/D70AA339-A120-4BA2-8ABD-EB70D2D0B791.png`],
  },
}

export default function CompatibilityResultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
