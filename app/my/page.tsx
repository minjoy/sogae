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
  const [activeCard, setActiveCard] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

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
        // 활성 카드 찾기 (isActive === true)
        const active = data.cards.find((c: Record<string, any>) => c.isActive);
        setActiveCard(active || null);
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

  // 카드 생성 이후 테스트 결과가 변경되었는지 확인
  const hasResultsChanged = () => {
    if (!activeCard) return true; // 카드가 없으면 생성 필요

    const cardCreatedAt = new Date(activeCard.createdAt);

    // 카드 생성 이후 업데이트된 테스트 결과가 있는지 확인
    const hasNewerResults = results.some((result) => {
      if (!result.createdAt) return false;
      const resultCreatedAt = new Date(result.createdAt);
      return resultCreatedAt > cardCreatedAt;
    });

    return hasNewerResults;
  };

  const shouldShowViewCard = allTestsCompleted && activeCard && !hasResultsChanged();
  const shouldShowGenerateCard = allTestsCompleted && (!activeCard || hasResultsChanged());

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

        {/* 진행 상황 or 회원가입 유도 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          {user ? (
            <>
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

              {shouldShowViewCard ? (
                <div className="space-y-3">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-xl transition-all"
                    onClick={() => router.push(`/card/${activeCard!.shareSlug}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">{activeCard!.personalityType?.emoji || '✨'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-bold">
                            {activeCard!.personalityType?.code}
                          </span>
                          <span className="text-sm opacity-80">{activeCard!.datingMode}</span>
                        </div>
                        <h3 className="text-xl font-bold">{activeCard!.personalityType?.name}</h3>
                      </div>
                      <div className="text-3xl">→</div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push('/test')}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <span>🔄</span>
                    <span>테스트 다시하기</span>
                  </button>
                </div>
              ) : shouldShowGenerateCard ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    {activeCard ? '테스트 결과가 업데이트되었어요!' : '모든 테스트를 완료했습니다!'}
                  </h3>
                  <p className="text-green-700 mb-4">
                    {activeCard ? '새로운 결과로 카드를 다시 만들어보세요' : '이제 나만의 사용설명서 카드를 만들 수 있어요'}
                  </p>
                  <Button onClick={handleGenerateCard} isLoading={isGenerating}>
                    {activeCard ? '카드 새로 만들기' : '카드 생성하기'}
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
            </>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                회원가입하고 나만의 사용설명서를 영구 보관하세요
              </h3>
              <p className="text-gray-600 mb-6">
                무료 회원가입 시 모든 테스트 결과를 저장하고<br />
                언제든지 확인할 수 있습니다
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => router.push('/signup')}
                  variant="primary"
                  className="px-8 py-3 text-lg"
                >
                  무료 회원가입
                </Button>
                <Button
                  onClick={() => router.push('/login')}
                  variant="outline"
                  className="px-8 py-3 text-lg"
                >
                  로그인
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 테스트 결과 목록 - 로그인 시에만 표시 */}
        {user && (
          <>
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
          </>
        )}

        {/* 나만의 사용설명서 카드 히스토리 */}
        {user && cards.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">히스토리</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 border-b">
                <div className="col-span-4">날짜</div>
                <div className="col-span-3 text-center">코드</div>
                <div className="col-span-5 text-center">연애 준비 점수</div>
              </div>
              {(showAllHistory ? cards : cards.slice(0, 10)).map((card) => (
                <div
                  key={card.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b last:border-b-0 hover:bg-gray-50"
                >
                  <div className="col-span-4 text-xs text-gray-500">
                    {new Date(card.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="inline-block bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-xs font-bold">
                      {card.personalityType?.code || '-'}
                    </span>
                  </div>
                  <div className="col-span-5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            (card.datingScore || 0) >= 80 ? 'bg-green-500' :
                            (card.datingScore || 0) >= 55 ? 'bg-yellow-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${card.datingScore || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-600 w-8">
                        {card.datingScore || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {cards.length > 10 && (
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="w-full py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  {showAllHistory ? (
                    <>
                      <span>접기</span>
                      <span>▲</span>
                    </>
                  ) : (
                    <>
                      <span>더보기 ({cards.length - 10}개)</span>
                      <span>▼</span>
                    </>
                  )}
                </button>
              )}
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
