'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/Button';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleStart = () => {
    if (isLoggedIn) {
      router.push('/test');
    } else {
      router.push('/signup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <nav className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">소개</div>
          <div className="flex gap-3">
            {isLoggedIn ? (
              <Button onClick={() => router.push('/my')}>
                마이페이지
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => router.push('/login')}>
                  로그인
                </Button>
                <Button onClick={() => router.push('/signup')}>
                  회원가입
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            나를 이해하면,<br />관계가 쉬워진다
          </h1>
          <p className="text-lg md:text-xl text-gray-600">
            5가지 테스트로 나를 이해하고, 관계를 준비하세요
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {[
            { title: "감정 타입", emoji: "💭", desc: "불안/회피/몰입/완벽주의 패턴 파악" },
            { title: "소비 성향", emoji: "💰", desc: "위로/인정/통제/충동 소비 이해" },
            { title: "일 처리 방식", emoji: "⚡", desc: "계획/탐색/즉흥/마감 성향 분석" },
            { title: "갈등 스타일", emoji: "💬", desc: "회피/공격/설득/수용 대화법 확인" },
            { title: "번아웃 위험도", emoji: "🔋", desc: "현재 에너지 상태 측정" },
          ].map((test, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-3">{test.emoji}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {test.title}
              </h3>
              <p className="text-sm text-gray-600">{test.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button onClick={handleStart} className="px-8 py-4 text-lg">
            테스트 시작하기
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            5분이면 완성되는 나만의 사용설명서
          </p>
        </div>

        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            어떻게 작동하나요?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-3">📝</div>
              <h3 className="font-semibold text-gray-900 mb-2">1. 테스트</h3>
              <p className="text-sm text-gray-600">
                5가지 테스트를 통해 나의 패턴을 파악
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💳</div>
              <h3 className="font-semibold text-gray-900 mb-2">2. 카드 생성</h3>
              <p className="text-sm text-gray-600">
                결과를 통합한 나 사용설명서 카드 생성
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📤</div>
              <h3 className="font-semibold text-gray-900 mb-2">3. 공유</h3>
              <p className="text-sm text-gray-600">
                링크로 간편하게 공유하고 관계 개선
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 max-w-4xl text-center text-sm text-gray-500">
        <p>이 결과는 참고용이며, 전문 상담을 대체하지 않습니다.</p>
      </footer>
    </div>
  );
}
