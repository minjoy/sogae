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

// 테스트 타입별 상세 설명
const TYPE_DESCRIPTIONS: Record<number, Record<string, { desc: string; emoji: string; tip: string }>> = {
  1: { // 애착유형
    '안정형': { desc: '관계에서 편안함을 느끼고 파트너를 신뢰해요', emoji: '🤗', tip: '안정적인 연애가 가능한 타입!' },
    '불안형': { desc: '사랑받고 싶은 마음이 크고 관계에 민감해요', emoji: '💓', tip: '깊은 감정 교류를 원하는 타입' },
    '회피형': { desc: '독립적이고 자기만의 공간을 중요시해요', emoji: '🌿', tip: '천천히 다가가면 마음을 열어요' },
    '혼란형': { desc: '친밀함을 원하면서도 두려워하는 복잡한 마음', emoji: '🌀', tip: '이해와 인내가 필요한 타입' },
  },
  2: { // 갈등대처
    '대화형': { desc: '갈등을 대화로 해결하려고 노력해요', emoji: '💬', tip: '소통이 잘 되는 연애 스타일!' },
    '회피형': { desc: '갈등 상황을 피하고 시간이 해결해주길 바라요', emoji: '🚶', tip: '압박하지 않으면 스스로 다가와요' },
    '폭발형': { desc: '감정을 솔직하게 표현하고 즉각 반응해요', emoji: '🔥', tip: '쿨한 감정 처리가 필요해요' },
    '순응형': { desc: '상대방에게 맞추려고 노력하는 편이에요', emoji: '🕊️', tip: '본인 의견도 표현해야 건강해요' },
  },
  3: { // 연애가치관
    '로맨티스트': { desc: '사랑과 감정적 교류를 가장 중요시해요', emoji: '💕', tip: '로맨틱한 연애를 원해요!' },
    '현실주의자': { desc: '안정과 미래 계획을 중요하게 생각해요', emoji: '🏠', tip: '진지한 관계를 추구해요' },
    '자유주의자': { desc: '개인의 자유와 성장을 존중해요', emoji: '🦋', tip: '서로를 존중하는 관계가 이상적' },
    '열정주의자': { desc: '함께하는 경험과 모험을 중요시해요', emoji: '✨', tip: '함께 새로운 것을 도전해요!' },
  },
  4: { // 소비습관
    '계획형': { desc: '체계적으로 돈을 관리하고 저축해요', emoji: '📊', tip: '안정적인 미래를 준비하는 타입' },
    '즉흥형': { desc: '현재의 행복을 위해 기꺼이 소비해요', emoji: '🎉', tip: '함께 즐거운 경험을 만들어요' },
    '가치형': { desc: '의미 있는 곳에 투자하는 것을 좋아해요', emoji: '💎', tip: '퀄리티를 중시하는 타입' },
    '절약형': { desc: '필요한 것만 구매하는 실용주의자예요', emoji: '🐿️', tip: '알뜰하고 현명한 소비 스타일' },
  },
  5: { // 번아웃
    '활력 충만': { desc: '에너지가 넘치고 새로운 관계에 적극적!', emoji: '⚡', tip: '지금 연애 시작하기 좋은 상태!' },
    '안정적': { desc: '균형 잡힌 상태로 관계를 잘 유지할 수 있어요', emoji: '🌿', tip: '건강한 연애가 가능해요' },
    '주의 필요': { desc: '약간의 피로감이 있지만 관리 가능해요', emoji: '🔋', tip: '자기 관리와 함께 연애해요' },
    '회복 필요': { desc: '지금은 나를 돌보는 시간이 필요해요', emoji: '🧘', tip: '충분히 쉬고 에너지 충전!' },
  },
};

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
  const typeDetail = TYPE_DESCRIPTIONS[result.t]?.[result.p];

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 헤더 - 더 임팩트 있게 */}
        <div className="text-center mb-6">
          <div className="inline-block bg-primary-100 text-primary-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">
            친구의 테스트 결과
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            {testInfo?.title || '심리 테스트'}
          </h1>
        </div>

        {/* 메인 결과 카드 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6 border border-gray-100">
          {/* 타입 헤더 */}
          <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 p-8 text-center text-white relative overflow-hidden">
            {/* 배경 장식 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-white rounded-full translate-x-1/4 translate-y-1/4"></div>
            </div>

            <div className="relative">
              <div className="text-7xl mb-4">{typeDetail?.emoji || testInfo?.emoji || '✨'}</div>
              <div className="inline-block bg-white/25 backdrop-blur-sm px-8 py-4 rounded-2xl mb-3">
                <span className="text-3xl md:text-4xl font-bold">{result.p}</span>
              </div>
              {result.s && (
                <div className="inline-block bg-white/15 px-4 py-2 rounded-full text-lg ml-2">
                  {result.s}
                </div>
              )}
              {typeDetail?.desc && (
                <p className="mt-4 text-lg opacity-95 max-w-md mx-auto">
                  {typeDetail.desc}
                </p>
              )}
            </div>
          </div>

          {/* 연애 팁 */}
          {typeDetail?.tip && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-5 border-b border-yellow-100">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <p className="text-yellow-800 font-medium">{typeDetail.tip}</p>
              </div>
            </div>
          )}

          {/* 세부 점수 - 더 시각적으로 */}
          {result.sc && result.sc.length > 0 && (
            <div className="p-6 md:p-8">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
                <span className="text-xl">📊</span>
                세부 분석 결과
              </h3>
              <div className="space-y-4">
                {result.sc.map((subscale, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800">
                        {subscale.n}
                      </span>
                      <span className="inline-block bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {subscale.v}점
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-400 to-primary-600 h-3 rounded-full transition-all duration-700"
                        style={{ width: `${subscale.v}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 코멘트 */}
          {result.c && (
            <div className="px-6 md:px-8 pb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💬</span>
                  <p className="text-blue-800 leading-relaxed">
                    &ldquo;{result.c}...&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5가지 테스트 소개 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4 text-center">
            🎯 5가지 테스트로 나를 완벽히 분석!
          </h3>
          <div className="grid grid-cols-5 gap-2 mb-4">
            {Object.entries(TEST_INFO).map(([id, info]) => (
              <div
                key={id}
                className={`text-center p-3 rounded-xl ${
                  parseInt(id) === result.t
                    ? 'bg-primary-100 ring-2 ring-primary-500'
                    : 'bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1">{info.emoji}</div>
                <div className="text-xs text-gray-600 leading-tight">
                  {info.title.replace(' 테스트', '')}
                </div>
                {parseInt(id) === result.t && (
                  <div className="text-xs text-primary-600 font-bold mt-1">완료!</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">
            친구는 아직 1개만 완료했어요. 5개 모두 하면 더 정확한 결과가!
          </p>
        </div>

        {/* 메인 CTA */}
        <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 rounded-3xl p-8 text-center text-white shadow-xl mb-6 relative overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 translate-y-1/2"></div>
          </div>

          <div className="relative">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              나도 해볼까?
            </h3>
            <p className="text-lg text-white/90 mb-6">
              1분이면 나의 연애 유형을 알 수 있어요!
            </p>

            <Button
              variant="secondary"
              className="bg-white text-primary-600 hover:bg-gray-50 px-10 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              onClick={() => router.push('/test')}
            >
              무료로 테스트하기 →
            </Button>

            <p className="mt-4 text-sm text-white/70">
              ⏱️ 테스트당 1~2분 소요 · 완전 무료
            </p>
          </div>
        </div>

        {/* 5개 완료시 혜택 */}
        <div className="bg-gradient-to-r from-yellow-50 to-pink-50 rounded-2xl p-6 border border-yellow-100">
          <h4 className="font-bold text-gray-900 mb-4 text-center">
            🎁 5개 테스트 완료하면?
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <p className="text-gray-700"><strong>나만의 4글자 성격코드</strong> - MBTI처럼 나를 표현해요</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <p className="text-gray-700"><strong>연애 준비도 점수</strong> - 지금 연애해도 될까?</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <p className="text-gray-700"><strong>나와 맞는 상대 유형</strong> - 어떤 사람과 잘 맞을까?</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
              <p className="text-gray-700"><strong>공유용 사용설명서 카드</strong> - 친구, 연인에게 공유!</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              variant="primary"
              className="w-full py-4 text-lg font-bold"
              onClick={() => router.push('/test')}
            >
              지금 바로 시작하기 🚀
            </Button>
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>마이타입 - 나만의 연애 사용설명서</p>
        </div>
      </div>
    </div>
  );
}
