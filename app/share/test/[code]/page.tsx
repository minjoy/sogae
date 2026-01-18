'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { decodeTestResult, TEST_INFO } from '@/lib/share-code';
import Button from '@/components/Button';

interface DecodedResult {
  t: number;
  p: string;
  s?: string;
  c?: string;
  sc?: { n: string; v: number }[];
}

export default function SharedTestResultPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;

  const [result, setResult] = useState<DecodedResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (code) {
      const decoded = decodeTestResult(code);
      if (decoded) {
        setResult(decoded);
      } else {
        setError(true);
      }
    }
  }, [code]);

  // 메타태그 동적 업데이트
  useEffect(() => {
    if (result) {
      const testInfo = TEST_INFO[result.t];
      const title = `${testInfo?.title || '테스트'} 결과 | 마이타입`;
      const description = `나의 유형: ${result.p}${result.s ? ` - ${result.s}` : ''}`;

      document.title = title;

      // Open Graph
      updateMetaTag('property', 'og:title', title);
      updateMetaTag('property', 'og:description', description);
      updateMetaTag('property', 'og:type', 'article');
      updateMetaTag('property', 'og:site_name', '마이타입 - 나만의 연애 사용설명서');
    }
  }, [result]);

  const updateMetaTag = (attr: string, key: string, content: string) => {
    let element = document.querySelector(`meta[${attr}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">😅</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            잘못된 링크입니다
          </h1>
          <p className="text-gray-600 mb-6">
            공유 링크가 올바르지 않거나 만료되었습니다.
          </p>
          <Button onClick={() => router.push('/test')}>
            나도 테스트 해보기
          </Button>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const testInfo = TEST_INFO[result.t];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">{testInfo?.emoji || '📋'}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {testInfo?.title || '테스트'} 결과
          </h1>
          <p className="text-gray-500">친구가 공유한 결과예요!</p>
        </div>

        {/* 결과 카드 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* 타입 배지 */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-center text-white">
            <div className="text-6xl mb-4">{testInfo?.emoji || '📋'}</div>
            <div className="inline-block bg-white/20 backdrop-blur px-6 py-3 rounded-full text-2xl font-bold mb-2">
              {result.p}
            </div>
            {result.s && (
              <div className="inline-block bg-white/10 px-4 py-2 rounded-full text-lg ml-2">
                {result.s}
              </div>
            )}
          </div>

          {/* 코멘트 */}
          {result.c && (
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💬</span>
                <p className="text-gray-700 leading-relaxed">
                  {result.c}...
                </p>
              </div>
            </div>
          )}

          {/* 하위척도 점수 */}
          {result.sc && result.sc.length > 0 && (
            <div className="p-8">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-xl">📊</span>
                세부 점수
              </h3>
              <div className="space-y-5">
                {result.sc.map((subscale, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {subscale.n}
                      </span>
                      <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
                        {subscale.v}점
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${subscale.v}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-center text-white shadow-xl mb-8">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-xl md:text-2xl font-bold mb-3">
            나도 테스트 해볼까?
          </h3>
          <p className="text-sm md:text-base text-white/90 mb-6">
            5가지 심리 테스트로 나만의 연애 사용설명서를 만들어보세요!
          </p>
          <Button
            variant="secondary"
            className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 text-lg font-semibold"
            onClick={() => router.push('/test')}
          >
            무료로 테스트하기 →
          </Button>
        </div>
      </div>
    </div>
  );
}
