'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/Button';

const tests = [
  {
    id: 1,
    title: '감정 타입',
    emoji: '💭',
    desc: '불안/회피/몰입/완벽주의 패턴 파악',
    duration: '2분'
  },
  {
    id: 2,
    title: '소비 성향',
    emoji: '💰',
    desc: '위로/인정/통제/충동 소비 이해',
    duration: '2분'
  },
  {
    id: 3,
    title: '일 처리 방식',
    emoji: '⚡',
    desc: '계획/탐색/즉흥/마감 성향 분석',
    duration: '2분'
  },
  {
    id: 4,
    title: '갈등 스타일',
    emoji: '💬',
    desc: '회피/공격/설득/수용 대화법 확인',
    duration: '2분'
  },
  {
    id: 5,
    title: '번아웃 위험도',
    emoji: '🔋',
    desc: '현재 에너지 상태 측정',
    duration: '1분'
  },
];

export default function TestListPage() {
  const router = useRouter();
  const [completedTests, setCompletedTests] = useState<number[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCompletedTests();
  }, []);

  const loadCompletedTests = async () => {
    try {
      const token = localStorage.getItem('token');

      if (token) {
        setIsLoggedIn(true);
        // 로그인 사용자: API에서 가져오기
        const response = await fetch('/api/test/results', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setCompletedTests(data.results.map((r: { testType: number }) => r.testType));
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Failed to load completed tests:', error);
    }
  };

  const handleDeleteAllTests = async () => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/test/results', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setCompletedTests([]);
        setShowDeleteConfirm(false);
        alert('모든 테스트가 삭제되었습니다.');
      } else {
        alert(data.error || '삭제 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete tests:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const completedCount = completedTests.length;
  const progressPercent = (completedCount / 5) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            5가지 마음 테스트
          </h1>
          <p className="text-gray-600 mb-6">
            각 테스트는 1~2분이면 완료됩니다
          </p>

          {/* 진행 상황 or 회원가입 유도 */}
          <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 shadow-sm mb-8">
            {isLoggedIn ? (
              <>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    진행 상황
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    {completedCount} / 5
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {completedCount === 5 ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-green-800 font-semibold">
                      🎉 모든 테스트 완료! 이제 통합 카드를 만들 수 있어요
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-blue-900 text-sm">
                      <strong>{5 - completedCount}개</strong> 남았어요! 완료하면 <strong>나만의 사용설명서 카드</strong>를 받아볼 수 있어요
                    </p>
                  </div>
                )}

                {completedCount > 0 && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mt-4 text-sm text-red-500 hover:text-red-700 underline"
                  >
                    전체 테스트 삭제하기
                  </button>
                )}
              </>
            ) : (
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  회원가입하고 나만의 사용설명서를 저장하세요
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  무료 회원가입 시 진행 상황 저장, 히스토리 관리, 영구 보관이 가능합니다
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => router.push('/signup')}
                    variant="primary"
                  >
                    무료 회원가입
                  </Button>
                  <Button
                    onClick={() => router.push('/login')}
                    variant="outline"
                  >
                    로그인
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 테스트 목록 */}
        <div className="space-y-4 mb-8">
          {tests.map((test) => {
            const isCompleted = isLoggedIn && completedTests.includes(test.id);

            return (
              <div
                key={test.id}
                className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border-2 ${
                  isCompleted
                    ? 'border-green-300 bg-green-50/30'
                    : 'border-gray-100'
                }`}
                onClick={() => router.push(`/test/${test.id}`)}
              >
                {/* Desktop Layout */}
                <div className="hidden md:flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl relative">
                      {test.emoji}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {test.title}
                        </h3>
                        {isCompleted && (
                          <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                            완료
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{test.desc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-2">{test.duration}</div>
                    <Button variant={isCompleted ? 'outline' : 'primary'}>
                      {isCompleted ? '다시하기' : '시작하기'}
                    </Button>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-5xl relative flex-shrink-0">
                      {test.emoji}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {test.title}
                        </h3>
                        {isCompleted && (
                          <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                            완료
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{test.desc}</p>
                      <div className="text-xs text-gray-500">{test.duration}</div>
                    </div>
                  </div>
                  <Button
                    variant={isCompleted ? 'outline' : 'primary'}
                    className="w-full"
                  >
                    {isCompleted ? '다시하기' : '시작하기'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 완료 혜택 안내 */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-center text-white shadow-xl mb-6">
          <div className="text-5xl mb-4">🎁</div>
          <h3 className="text-2xl font-bold mb-3">
            5개 테스트 완료 시 받는 혜택
          </h3>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-3xl mb-2">💝</div>
              <p className="font-semibold mb-1">나 사용설명서 카드</p>
              <p className="text-sm opacity-90">5가지 테스트 통합 분석</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-3xl mb-2">🔗</div>
              <p className="font-semibold mb-1">공유 가능한 링크</p>
              <p className="text-sm opacity-90">친구나 파트너와 공유</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-3xl mb-2">💡</div>
              <p className="font-semibold mb-1">맞춤 관계 조언</p>
              <p className="text-sm opacity-90">성향 기반 실천 가이드</p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="bg-white text-primary-600 hover:bg-gray-50"
            onClick={() => router.push('/my')}
          >
            내 진행 상황 보기
          </Button>
        </div>

        {/* 안내 */}
        <div className="bg-white rounded-xl p-6 text-center shadow-sm">
          <p className="text-sm text-gray-600">
            💡 모든 테스트는 무료이며, 언제든지 다시 할 수 있어요
          </p>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                전체 테스트를 삭제할까요?
              </h3>
              <p className="text-gray-600 text-sm">
                모든 테스트 결과가 삭제되며, 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAllTests}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '삭제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
