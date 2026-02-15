'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
  ChevronRight,
  Search,
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
  const { data: session, status } = useSession();
  const [completedTests, setCompletedTests] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isLoading = status === 'loading';
  const isLoggedIn = status === 'authenticated' && !!session?.user;

  useEffect(() => {
    if (isLoggedIn) {
      loadCompletedTests();
    }
  }, [isLoggedIn]);

  const loadCompletedTests = async () => {
    try {
      const response = await fetch('/api/test/results');
      const data = await response.json();

      if (data.success) {
        setCompletedTests(data.results.map((r: { testType: number }) => r.testType));
      }
    } catch (error) {
      console.error('Failed to load completed tests:', error);
    }
  };

  const handleDeleteAllTests = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch('/api/test/results', {
        method: 'DELETE',
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 상단: 왜 테스트 해야 하는지 */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
            5가지 마음 테스트
          </h1>
          <p className="text-center text-gray-500 text-sm mb-5">
            총 9분이면 나를 완전히 파악할 수 있어요
          </p>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Search className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">왜 이 테스트를 해야 할까요?</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  감정, 소비, 일, 갈등, 에너지 — 5가지 영역을 분석하면
                  <strong className="text-gray-700"> 나도 몰랐던 내 패턴</strong>이 보입니다.
                  반복되는 실수, 관계 문제, 번아웃의 원인을 정확히 짚어드려요.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 pl-11">
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> 과학 기반 분석
              </span>
              <span className="flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" /> 5개 완료 시 사용설명서 카드
              </span>
            </div>
          </div>
        </div>

        {/* 진행 상황 (로그인 시) */}
        {!isLoading && isLoggedIn && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">진행 상황</span>
              <span className="text-sm font-bold text-primary-600">{completedCount}/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {completedCount === 5 && (
              <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <p className="text-green-700 font-semibold text-xs flex items-center gap-1.5">
                  <PartyPopper className="w-4 h-4" />
                  모든 테스트 완료! 통합 카드를 만들 수 있어요
                </p>
              </div>
            )}
          </div>
        )}

        {/* 비로그인 안내 */}
        {!isLoading && !isLoggedIn && (
          <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-blue-800">
              로그인 없이 가능! 5개 완료 후 <strong>통합 카드</strong>는 로그인 필요
            </p>
            <Button
              onClick={() => router.push('/signup')}
              variant="primary"
              className="px-3 py-1.5 text-xs flex-shrink-0 ml-3"
            >
              가입
            </Button>
          </div>
        )}

        {/* 테스트 목록 - 컴팩트 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100 mb-6">
          {tests.map((test) => {
            const isCompleted = isLoggedIn && completedTests.includes(test.id);

            return (
              <div
                key={test.id}
                className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => router.push(`/test/${test.id}`)}
              >
                {/* 아이콘 + 완료 표시 */}
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isCompleted ? 'bg-green-100' : 'bg-primary-50'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <test.icon className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                </div>

                {/* 텍스트 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-semibold ${isCompleted ? 'text-green-700' : 'text-gray-900'}`}>
                      {test.title}
                    </h3>
                    {isCompleted && (
                      <span className="bg-green-100 text-green-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        완료
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{test.desc}</p>
                </div>

                {/* 소요시간 + 화살표 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[11px] text-gray-400">{test.duration}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            );
          })}
        </div>

        {/* 완료 혜택 안내 - 컴팩트 */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white mb-5">
          <h3 className="font-bold text-base mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5" /> 5개 완료 시 특별 혜택
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5 text-center">
              <Heart className="w-4 h-4 mx-auto mb-1" />
              <p className="text-[11px] font-semibold leading-tight">나 사용설명서<br/>카드</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5 text-center">
              <Link2 className="w-4 h-4 mx-auto mb-1" />
              <p className="text-[11px] font-semibold leading-tight">4글자<br/>성격코드</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-lg p-2.5 text-center">
              <Lightbulb className="w-4 h-4 mx-auto mb-1" />
              <p className="text-[11px] font-semibold leading-tight">맞춤 상대<br/>분석</p>
            </div>
          </div>

          {!isLoading && (isLoggedIn ? (
            <Button
              variant="secondary"
              className="w-full bg-white text-orange-600 hover:bg-gray-50 font-bold text-sm"
              onClick={() => router.push('/my')}
            >
              내 진행 상황 보기
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 bg-white text-orange-600 hover:bg-gray-50 font-bold text-sm"
                onClick={() => router.push('/signup')}
              >
                무료 회원가입
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-2 border-white/60 text-white hover:bg-white/20 font-semibold text-sm"
                onClick={() => router.push('/login')}
              >
                로그인
              </Button>
            </div>
          ))}
        </div>

        {/* 하단 안내 + 삭제 */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-400">
            모든 테스트는 무료이며, 언제든지 다시 할 수 있어요
          </p>
          {isLoggedIn && completedCount > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-red-400 hover:text-red-600 underline"
            >
              전체 테스트 삭제
            </button>
          )}
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
