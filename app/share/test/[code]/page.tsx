import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { decodeTestResult, TEST_INFO } from '@/lib/share-code';
import ShareResultClient, { getTypeDetail } from './ShareResultClient';

interface PageProps {
  params: Promise<{ code: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mytype.co.kr';

// 서버에서 메타데이터 생성 (오픈그래프용)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const result = decodeTestResult(code);

  if (!result) {
    return {
      title: '잘못된 링크 | 언연이',
      description: '공유 링크가 올바르지 않습니다.',
    };
  }

  const testInfo = TEST_INFO[result.t];
  const typeDetail = getTypeDetail(result.t, result.p);
  const title = `${result.p} - ${testInfo?.title || '테스트'} 결과 | 언연이`;
  const description = typeDetail?.desc || `나의 ${testInfo?.title || '테스트'} 결과: ${result.p}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: '언연이',
      url: `${siteUrl}/share/test/${code}`,
      images: [
        {
          url: `${siteUrl}/images/og-test-result.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${siteUrl}/images/og-test-result.png`],
    },
  };
}

export default async function SharedTestResultPage({ params }: PageProps) {
  const { code } = await params;
  const result = decodeTestResult(code);

  if (!result) {
    notFound();
  }

  return <ShareResultClient result={result} />;
}
