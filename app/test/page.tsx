'use client';

import { useRouter } from 'next/navigation';
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            5가지 테스트
          </h1>
          <p className="text-gray-600">
            각 테스트는 1~2분이면 완료됩니다
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100"
              onClick={() => router.push(`/test/${test.id}`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{test.emoji}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {test.title}
                    </h3>
                    <p className="text-sm text-gray-600">{test.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-2">{test.duration}</div>
                  <Button variant="outline">시작하기</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-700 mb-4">
            💡 5개 테스트를 모두 완료하면 <strong>나 사용설명서 카드</strong>가 생성됩니다
          </p>
          <Button onClick={() => router.push('/my')}>
            내 결과 보기
          </Button>
        </div>
      </div>
    </div>
  );
}
