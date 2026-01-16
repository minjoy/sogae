'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_TESTS } from '@/lib/tests/test-data';
import Button from '@/components/Button';

export default function MyPage() {
  const router = useRouter();
  const [results, setResults] = useState<Record<string, any>[]>([]);
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [cards, setCards] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchResults();
      fetchCards();
    } else {
      // 비회원: localStorage에서 결과 불러오기
      loadGuestResults();
    }
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

  const loadGuestResults = () => {
    try {
      const guestResults = JSON.parse(localStorage.getItem('guestResults') || '[]');

      // localStorage 결과를 API 결과 형식으로 변환
      const convertedResults = guestResults.map((r: Record<string, any>) => ({
        testType: r.testType,
        label: ALL_TESTS[r.testType]?.title || '',
      }));

      setResults(convertedResults);
    } catch (error) {
      console.error('Failed to load guest results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/card/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setCards(data.cards);
      }
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    }
  };

  const handleGenerateCard = async () => {
    if (results.length < 5) {
      alert('5개 테스트를 모두 완료해주세요');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('카드를 생성하려면 로그인이 필요합니다.\n회원가입하고 나만의 사용설명서를 만들어보세요!');
      router.push('/signup');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/card/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
        }
        throw new Error(data.error || '카드 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }

      // 카드 페이지로 이동
      router.push(`/card/${data.card.shareSlug}`);
    } catch (error) {
      console.error('Card generation error:', error);
      const message = error instanceof Error ? error.message : '카드 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      alert(message);
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
              {user ? '마이페이지' : '테스트 진행 상황'}
            </h1>
            <p className="text-gray-600">
              {user ? `안녕하세요, ${user.nickname}님` : '회원가입하고 결과를 저장하세요'}
            </p>
          </div>
          {user ? (
            <Button variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
          ) : (
            <Button onClick={() => router.push('/signup')}>
              회원가입
            </Button>
          )}
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
            <div className="space-y-4">
              {!user && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚠️</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-1">
                        주의! 카드 생성을 위해 회원가입이 필요합니다
                      </h4>
                      <p className="text-sm text-yellow-800 mb-3">
                        비회원은 나만의 사용설명서 카드를 생성하거나 저장할 수 없습니다.
                        지금 무료로 회원가입하고 영구적으로 저장하세요!
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                          onClick={() => router.push('/signup')}
                        >
                          무료 회원가입
                        </Button>
                        <Button
                          variant="outline"
                          className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                          onClick={() => router.push('/login')}
                        >
                          로그인
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">
                  모든 테스트를 완료했습니다!
                </h3>
                <p className="text-green-700 mb-4">
                  {user ? '이제 나만의 사용설명서 카드를 만들 수 있어요' : '회원가입 후 나만의 사용설명서 카드를 만들 수 있어요'}
                </p>
                <Button onClick={handleGenerateCard} isLoading={isGenerating}>
                  카드 생성하기
                </Button>
              </div>
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

        {/* 비회원 가입 유도 */}
        {!user && (
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-center text-white shadow-xl mb-8">
            <div className="text-5xl mb-4">💝</div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              지금 가입하고<br />나만의 사용설명서를 만드세요
            </h3>
            <p className="text-lg mb-6 opacity-90">
              5개 테스트를 모두 완료하면<br />
              심리학 기반의 <strong>나 사용설명서 카드</strong>를 무료로 받아볼 수 있어요
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                className="bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 text-lg"
                onClick={() => router.push('/signup')}
              >
                무료 회원가입하기
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
                onClick={() => router.push('/login')}
              >
                로그인
              </Button>
            </div>
          </div>
        )}

        {/* 테스트 결과 목록 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">테스트 결과</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5].map((testType) => {
            const testDef = ALL_TESTS[testType];
            const result = results.find((r) => r.testType === testType);
            const isCompleted = !!result;

            return (
              <div
                key={testType}
                className={`bg-white rounded-xl p-4 md:p-5 shadow-sm border-2 ${
                  isCompleted
                    ? 'border-green-200 cursor-pointer hover:shadow-lg hover:scale-105'
                    : 'border-gray-200 cursor-pointer hover:shadow-md'
                } transition-all duration-200`}
                onClick={() => {
                  if (isCompleted) {
                    router.push(`/test/${testType}/result`);
                  } else {
                    router.push(`/test/${testType}`);
                  }
                }}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="text-3xl md:text-4xl mb-2 relative">
                    {testDef.emoji}
                    {isCompleted && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 text-sm md:text-base mb-2 line-clamp-2">
                    {testDef.title}
                  </h3>

                  {isCompleted ? (
                    <div className="w-full">
                      <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold mb-2">
                        완료
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 min-h-[2rem]">
                        {result.label}
                      </p>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium mb-2">
                        미완료
                      </div>
                      <p className="text-xs text-gray-500 min-h-[2rem]">
                        {testDef.duration}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 나만의 사용설명서 카드 히스토리 */}
        {user && cards.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">나만의 사용설명서 히스토리</h2>
            <div className="space-y-4">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200"
                  onClick={() => router.push(`/card/${card.shareSlug}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {card.personalityType && (
                          <>
                            <span className="text-3xl">{card.personalityType.emoji}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="inline-block bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-bold">
                                  {card.personalityType.code}
                                </span>
                                <h3 className="font-semibold text-gray-900">
                                  {card.personalityType.name}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {card.datingMode}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">
                        {new Date(card.createdAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(card.createdAt).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
