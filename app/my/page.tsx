'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_TESTS } from '@/lib/tests/test-data';
import Button from '@/components/Button';

export default function MyPage() {
  const router = useRouter();
  const [results, setResults] = useState<Record<string, any>[]>([]);
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchResults();
  }, [router]);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/test/results', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setResults(data.results);
      }
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCard = async () => {
    if (results.length < 5) {
      alert('5개 테스트를 모두 완료해주세요');
      return;
    }

    setIsGenerating(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/card/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '카드 생성 실패');
      }

      // 카드 페이지로 이동
      router.push(`/card/${data.card.shareSlug}`);
    } catch (error: any) {
      console.error('Card generation error:', error);
      alert(error.message || '카드 생성 중 오류가 발생했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const completedTests = results.length;
  const allTestsCompleted = completedTests === 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              마이페이지
            </h1>
            <p className="text-gray-600">안녕하세요, {user?.nickname}님</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            로그아웃
          </Button>
        </div>

        {/* 진행 상황 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              테스트 진행 상황
            </h2>
            <span className="text-2xl font-bold text-blue-600">
              {completedTests}/5
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${(completedTests / 5) * 100}%` }}
            />
          </div>

          {allTestsCompleted ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                모든 테스트를 완료했습니다!
              </h3>
              <p className="text-green-700 mb-4">
                이제 나만의 사용설명서 카드를 만들 수 있어요
              </p>
              <Button onClick={handleGenerateCard} isLoading={isGenerating}>
                카드 생성하기
              </Button>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
              <p className="text-blue-900 mb-4">
                {5 - completedTests}개의 테스트가 남았어요
              </p>
              <Button onClick={() => router.push('/test')}>
                테스트 계속하기
              </Button>
            </div>
          )}
        </div>

        {/* 테스트 결과 목록 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">테스트 결과</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((testType) => {
            const testDef = ALL_TESTS[testType];
            const result = results.find((r) => r.testType === testType);
            const isCompleted = !!result;

            return (
              <div
                key={testType}
                className={`bg-white rounded-xl p-6 shadow-sm border ${
                  isCompleted
                    ? 'border-green-200 cursor-pointer hover:shadow-md'
                    : 'border-gray-200'
                } transition-all`}
                onClick={() => {
                  if (isCompleted) {
                    router.push(`/test/${testType}/result`);
                  } else {
                    router.push(`/test/${testType}`);
                  }
                }}
              >
                <div className="text-4xl mb-3">{testDef.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {testDef.title}
                </h3>

                {isCompleted ? (
                  <div>
                    <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium mb-2">
                      완료
                    </div>
                    <p className="text-sm text-gray-600">
                      {result.label}
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium mb-2">
                      미완료
                    </div>
                    <p className="text-sm text-gray-600">
                      {testDef.duration}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 안내 문구 */}
        <div className="mt-8 bg-gray-50 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-2">💡 안내</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• 테스트는 언제든지 다시 진행할 수 있습니다</li>
            <li>• 최신 결과가 자동으로 업데이트됩니다</li>
            <li>• 5개 테스트 완료 시 통합 카드를 생성할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
