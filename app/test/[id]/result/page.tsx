'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ALL_TESTS } from '@/lib/tests/test-data';
import { scoreTest } from '@/lib/tests/scoring';
import { encodeTestResult } from '@/lib/share-code';
import Button from '@/components/Button';

export default function TestResultPage() {
  const router = useRouter();
  const params = useParams();
  const testId = parseInt(params?.id as string);

  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allTestsCompleted, setAllTestsCompleted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const testDef = ALL_TESTS[testId];

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    fetchResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 메타태그 동적 업데이트
  useEffect(() => {
    if (result && testDef) {
      const title = `${testDef.title} 결과 | 언연이`;
      const description = `나의 ${testDef.title}: ${result.scores?.primaryLabel || ''} - ${testDef.description}`;
      const url = window.location.href;

      // 기본 메타태그
      document.title = title;
      updateMetaTag('name', 'description', description);

      // Open Graph
      updateMetaTag('property', 'og:title', title);
      updateMetaTag('property', 'og:description', description);
      updateMetaTag('property', 'og:url', url);
      updateMetaTag('property', 'og:type', 'article');
      updateMetaTag('property', 'og:site_name', '언연이 - 언제 연애하는게 이득일까');
      updateMetaTag('property', 'og:image', window.location.origin + '/images/og-test-result.png');

      // Twitter Card
      updateMetaTag('name', 'twitter:card', 'summary_large_image');
      updateMetaTag('name', 'twitter:title', title);
      updateMetaTag('name', 'twitter:description', description);
      updateMetaTag('name', 'twitter:image', window.location.origin + '/images/og-test-result.png');
    }
  }, [result, testDef]);

  const updateMetaTag = (attr: string, key: string, content: string) => {
    let element = document.querySelector(`meta[${attr}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  const fetchResult = async () => {
    try {
      const token = localStorage.getItem('token');

      if (token) {
        // 로그인된 사용자: API에서 가져오기
        const response = await fetch('/api/test/results', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          const testResult = data.results.find((r: Record<string, any>) => r.testType === testId);
          // 로그인 사용자도 compatibility 정보를 위해 점수 재계산
          if (testResult && testResult.rawAnswers) {
            const calculatedScore = scoreTest(testId, testResult.rawAnswers);
            testResult.compatibility = calculatedScore.compatibility;
          }
          setResult(testResult);
          // 로그인 사용자만 5개 테스트 완료 확인
          setAllTestsCompleted(data.results.length >= 5);
        }
      } else {
        // 비회원: localStorage에서 가져오기 및 점수 계산
        const guestResults = JSON.parse(localStorage.getItem('guestResults') || '[]');
        const guestResult = guestResults.find((r: Record<string, any>) => r.testType === testId);

        // 비회원은 "모든 테스트 완료" 표시하지 않음
        setAllTestsCompleted(false);

        if (guestResult && guestResult.answers) {
          // 점수 계산
          const calculatedScore = scoreTest(testId, guestResult.answers);

          setResult({
            testType: testId,
            label: calculatedScore.primaryLabel,
            scores: {
              primaryLabel: calculatedScore.primaryLabel,
              secondaryLabel: calculatedScore.secondaryLabel,
              subscales: calculatedScore.subscales,
            },
            comment: calculatedScore.comment,
            recommendations: calculatedScore.recommendations,
            compatibility: calculatedScore.compatibility,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch result:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    // 결과를 인코딩하여 공유 URL 생성
    const scores = result?.scores as Record<string, any>;
    const shareCode = encodeTestResult(
      testId,
      scores?.primaryLabel || '',
      scores?.secondaryLabel,
      result?.comment,
      scores?.subscales
    );
    const shareUrl = `${window.location.origin}/share/test/${shareCode}`;

    if (navigator.share) {
      // 모바일에서 네이티브 공유 기능 사용
      try {
        await navigator.share({
          title: `${testDef.title} 결과`,
          text: `나의 ${testDef.title} 결과를 확인해보세요!`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // 데스크톱에서 클립보드 복사
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        console.error('Copy failed:', error);
        alert('링크를 복사하지 못했습니다.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!result || !testDef) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            결과를 찾을 수 없습니다
          </h1>
          <Button onClick={() => router.push('/test')}>
            테스트 목록으로
          </Button>
        </div>
      </div>
    );
  }

  const scores = result.scores as Record<string, any>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4">{testDef.emoji}</div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {testDef.title} 결과
          </h1>
        </div>

        {/* 결과 카드 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* 타입 배지 */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-center text-white">
            <div className="text-6xl mb-4">{testDef.emoji}</div>
            <div className="inline-block bg-white/20 backdrop-blur px-6 py-3 rounded-full text-2xl font-bold mb-2">
              {scores.primaryLabel}
            </div>
            {scores.secondaryLabel && (
              <div className="inline-block bg-white/10 px-4 py-2 rounded-full text-lg ml-2">
                {scores.secondaryLabel}
              </div>
            )}
          </div>

          {/* 코멘트 */}
          {result.comment && (
            <div className="p-8 border-b border-gray-100">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl">💬</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">전문가 코멘트</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {result.comment}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 하위척도 점수 */}
          {scores.subscales && scores.subscales.length > 0 && (
            <div className="p-8 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-xl">📊</span>
                세부 점수 분석
              </h3>
              <div className="space-y-5">
                {scores.subscales.map((subscale: Record<string, any>, index: number) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-800">
                        {subscale.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {subscale.score.toFixed(1)} / 5.0
                        </span>
                        <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
                          {subscale.percentile}점
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${subscale.percentile}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 추천사항 */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="p-8 bg-blue-50">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">💡</span>
                실천 가이드
              </h3>
              <ul className="space-y-3">
                {result.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="inline-block w-6 h-6 bg-primary-500 text-white rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed flex-1">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 연애 궁합 정보 */}
          {result.compatibility && (
            <div className="p-8 bg-gradient-to-br from-pink-50 to-purple-50">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">💕</span>
                나와 어울리는 연애 상대
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
                      {result.compatibility.myType}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
                      {result.compatibility.idealPartner}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">
                    {result.compatibility.idealPartnerDesc}
                  </p>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <span className="font-semibold">💡 Tip: </span>
                      {result.compatibility.datingTip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5개 테스트 완료 시 사용설명서 안내 */}
        {allTestsCompleted && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-center text-white shadow-xl mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              모든 테스트 완료!
            </h3>
            <p className="text-lg mb-6 opacity-90">
              5가지 테스트 결과를 종합한<br />
              <strong>나만의 사용설명서 카드</strong>를 확인해보세요
            </p>
            <Button
              variant="secondary"
              className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 text-lg font-semibold"
              onClick={() => router.push('/my')}
            >
              나만의 사용설명서 보러가기 →
            </Button>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          <button
            onClick={() => router.push('/test')}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-white border-2 border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <span className="text-2xl">📝</span>
            <span className="text-xs font-semibold text-gray-700">다른 테스트</span>
          </button>
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-primary-600 rounded-xl hover:bg-primary-700 transition-all"
          >
            {isCopied ? (
              <>
                <span className="text-2xl">✓</span>
                <span className="text-xs font-semibold text-white">복사 완료</span>
              </>
            ) : (
              <>
                <span className="text-2xl">🔗</span>
                <span className="text-xs font-semibold text-white">공유하기</span>
              </>
            )}
          </button>
          <button
            onClick={() => router.push('/my')}
            className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-white border-2 border-gray-300 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all"
          >
            <span className="text-2xl">👤</span>
            <span className="text-xs font-semibold text-gray-700">마이페이지</span>
          </button>
        </div>

        {/* 비회원 가입 유도 */}
        {!isLoggedIn && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 md:p-8 text-white shadow-xl mb-8">
            <div className="text-5xl mb-4 text-center">🎯</div>
            <h3 className="text-xl md:text-2xl font-bold mb-3 text-center">
              더 정확한 연애 상대를 알고 싶다면?
            </h3>
            <p className="text-sm md:text-base text-white/90 mb-4 text-center">
              5가지 테스트를 모두 완료하면<br />
              <strong>나와 딱 맞는 상대 성격 유형</strong>을 정확하게 알려드려요!
            </p>

            <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4">
              <p className="text-sm md:text-base mb-3 font-semibold">🔮 5개 테스트 완료 시 받을 수 있는 것</p>
              <ul className="space-y-2 text-xs md:text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>나만의 4글자 성격코드 (MBTI처럼!)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>5가지 영역을 종합한 <strong>정확한 상대 궁합</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>연애 준비 상태 & 맞춤 연애 조언</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>공유 가능한 나만의 사용설명서 카드</span>
                </li>
              </ul>
            </div>

            <p className="text-sm opacity-90 mb-4 text-center">
              💝 회원가입하면 결과를 저장하고 카드를 만들 수 있어요
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                className="bg-white text-primary-600 hover:bg-gray-50 font-semibold"
                onClick={() => router.push('/signup')}
              >
                무료 회원가입
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => router.push('/login')}
              >
                로그인
              </Button>
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="bg-blue-50 rounded-xl p-6 text-center mb-8">
          <p className="text-sm text-gray-700">
            💡 지금은 1가지 테스트 결과만 본 거예요.<br />
            <strong>5개 모두 완료하면 더 정확한 상대 성격</strong>을 알 수 있어요!
          </p>
        </div>
      </div>
    </div>
  );
}
