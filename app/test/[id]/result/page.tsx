'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ALL_TESTS } from '@/lib/tests/test-data';
import { scoreTest } from '@/lib/tests/scoring';
import Button from '@/components/Button';

export default function TestResultPage() {
  const router = useRouter();
  const params = useParams();
  const testId = parseInt(params?.id as string);

  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const testDef = ALL_TESTS[testId];

  useEffect(() => {
    fetchResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          const testResult = data.results.find((r: any) => r.testType === testId);
          setResult(testResult);
        }
      } else {
        // 비회원: localStorage에서 가져오기 및 점수 계산
        const guestResults = JSON.parse(localStorage.getItem('guestResults') || '[]');
        const guestResult = guestResults.find((r: Record<string, any>) => r.testType === testId);

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
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch result:', error);
    } finally {
      setIsLoading(false);
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

  const scores = result.scores as any;

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
                {scores.subscales.map((subscale: any, index: number) => (
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
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => router.push('/test')}
            className="flex-1"
          >
            다른 테스트 하기
          </Button>
          <Button
            onClick={() => router.push('/my')}
            className="flex-1"
          >
            마이페이지
          </Button>
        </div>

        {/* 비회원 가입 유도 */}
        {!localStorage.getItem('token') && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-center text-white shadow-xl mb-8">
            <div className="text-4xl mb-4">💝</div>
            <h3 className="text-2xl font-bold mb-3">
              결과를 저장하고<br />더 자세히 알아보세요
            </h3>
            <p className="text-lg mb-6 opacity-90">
              회원가입하면 5개 테스트 결과를 통합한<br />
              <strong>나만의 사용설명서 카드</strong>를 만들 수 있어요
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                className="bg-white text-primary-600 hover:bg-gray-50"
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
        <div className="bg-blue-50 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-700">
            💡 5개 테스트를 모두 완료하면 <strong>통합 카드</strong>를 만들 수 있어요
          </p>
        </div>
      </div>
    </div>
  );
}
