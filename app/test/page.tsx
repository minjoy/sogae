'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/Button';
import {
  MessageCircle,
  Wallet,
  Zap,
  MessageSquare,
  Battery,
  Target,
  PartyPopper,
  Gift,
  Heart,
  Link2,
  Lightbulb,
  AlertTriangle,
  Check,
} from 'lucide-react';

const tests = [
  {
    id: 1,
    title: '감정 타입',
    icon: MessageCircle,
    desc: '불안/회피/몰입/완벽주의 패턴 파악',
    duration: '2분'
  },
  {
    id: 2,
    title: '소비 성향',
    icon: Wallet,
    desc: '위로/인정/통제/충동 소비 이해',
    duration: '2분'
  },
  {
    id: 3,
    title: '일 처리 방식',
    icon: Zap,
    desc: '계획/탐색/즉흥/마감 성향 분석',
    duration: '2분'
  },
  {
    id: 4,
    title: '갈등 스타일',
    icon: MessageSquare,
    desc: '회피/공격/설득/수용 대화법 확인',
    duration: '2분'
  },
  {
    id: 5,
    title: '번아웃 위험도',
    icon: Battery,
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
          <div className="max-w-xl mx-auto mb-8">
            {isLoggedIn ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
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
                    <p className="text-green-800 font-semibold flex items-center justify-center gap-2">
                      <PartyPopper className="w-5 h-5" />
                      모든 테스트 완료! 이제 통합 카드를 만들 수 있어요
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
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                <p className="text-center text-gray-900 font-semibold mb-1">
                  로그인 없이 테스트 가능!
                </p>
                <p className="text-center text-sm text-gray-500 mb-4">
                  단, 5개 완료 후 <strong className="text-primary-600">통합 결과 · 사용설명서 카드</strong>는 로그인이 필요해요
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => router.push('/signup')}
                    variant="primary"
                    className="px-4 py-2 text-sm"
                  >
                    무료 회원가입
                  </Button>
                  <Button
                    onClick={() => router.push('/login')}
                    variant="outline"
                    className="px-4 py-2 text-sm"
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
                    <div className="relative">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                        <test.icon className="w-7 h-7 text-primary-600" />
                      </div>
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
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
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                        <test.icon className="w-7 h-7 text-primary-600" />
                      </div>
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
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
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 rounded-2xl p-8 text-center text-white shadow-2xl mb-6 border-4 border-yellow-300">
          {/* 반짝이는 효과 */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-2 left-4 text-2xl animate-pulse">✨</div>
            <div className="absolute top-4 right-6 text-xl animate-pulse delay-100">⭐</div>
            <div className="absolute bottom-8 left-8 text-lg animate-pulse delay-200">✨</div>
            <div className="absolute bottom-4 right-4 text-2xl animate-pulse delay-300">🌟</div>
          </div>

          <div className="relative z-10">
            <div className="text-5xl mb-3 animate-bounce">🎁</div>
            <h3 className="text-2xl font-black mb-4 drop-shadow-lg">
              5개 테스트 완료 시 특별 혜택!
            </h3>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-black/20 backdrop-blur rounded-xl p-4">
                <div className="w-10 h-10 mx-auto mb-2 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Heart className="w-5 h-5 text-amber-900" />
                </div>
                <p className="font-bold mb-1">나 사용설명서 카드</p>
                <p className="text-sm opacity-90">5가지 테스트 통합 분석</p>
              </div>
              <div className="bg-black/20 backdrop-blur rounded-xl p-4">
                <div className="w-10 h-10 mx-auto mb-2 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-amber-900" />
                </div>
                <p className="font-bold mb-1">4글자 성격코드</p>
                <p className="text-sm opacity-90">MBTI처럼 공유 가능!</p>
              </div>
              <div className="bg-black/20 backdrop-blur rounded-xl p-4">
                <div className="w-10 h-10 mx-auto mb-2 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-900" />
                </div>
                <p className="font-bold mb-1">맞춤 상대 분석</p>
                <p className="text-sm opacity-90">나와 딱 맞는 유형 추천</p>
              </div>
            </div>

            {!isLoggedIn && (
              <div className="bg-red-600/80 border-2 border-white/50 rounded-xl p-4 mb-4">
                <p className="font-bold text-base flex items-center justify-center gap-2">
                  <span className="text-xl">🔐</span>
                  이 혜택은 로그인 후에만 받을 수 있어요!
                </p>
                <p className="text-xs mt-1 opacity-90">
                  로그인하면 진행 상황이 저장되고, 5개 완료 시 통합 결과를 확인할 수 있습니다
                </p>
              </div>
            )}

            {isLoggedIn ? (
              <Button
                variant="secondary"
                className="bg-white text-orange-600 hover:bg-gray-50 font-bold shadow-lg"
                onClick={() => router.push('/my')}
              >
                내 진행 상황 보기
              </Button>
            ) : (
              <div className="flex gap-3 justify-center">
                <Button
                  variant="secondary"
                  className="bg-white text-orange-600 hover:bg-gray-50 font-bold shadow-lg"
                  onClick={() => router.push('/signup')}
                >
                  무료 회원가입
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/20 font-semibold"
                  onClick={() => router.push('/login')}
                >
                  로그인
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-white rounded-xl p-6 text-center shadow-sm">
          <p className="text-sm text-gray-600 flex items-center justify-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-primary-500" />
            모든 테스트는 무료이며, 언제든지 다시 할 수 있어요
          </p>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
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
