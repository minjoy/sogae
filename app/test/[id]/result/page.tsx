'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ALL_TESTS } from '@/lib/tests/test-data';
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
        // 비회원: localStorage에서 가져오기
        const guestResults = JSON.parse(localStorage.getItem('guestResults') || '[]');
        const guestResult = guestResults.find((r: Record<string, any>) => r.testType === testId);

        if (guestResult) {
          // 간단한 결과 변환 (실제 점수 계산은 추후 개선)
          setResult({
            testType: testId,
            label: testDef?.title || '',
            scores: {
              primaryLabel: '결과 분석 중',
              subscales: [],
            },
            avgScore: guestResult.avgScore,
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
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <div className="inline-block bg-blue-100 text-blue-800 px-6 py-3 rounded-full text-2xl font-bold mb-4">
              {scores.primaryLabel}
            </div>
            {scores.secondaryLabel && (
              <div className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-lg ml-2">
                {scores.secondaryLabel}
              </div>
            )}
          </div>

          {/* 하위척도 점수 */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">세부 점수</h3>
            {scores.subscales?.map((subscale: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {subscale.name}
                  </span>
                  <span className="text-sm text-gray-600">
                    {subscale.percentile}점
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${subscale.percentile}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
