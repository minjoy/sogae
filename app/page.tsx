'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/components/Button';

export default function Home() {
  const router = useRouter();
  const [participantCount, setParticipantCount] = useState(12847);

  useEffect(() => {
    // 참여자 수 가져오기
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.success) {
          setParticipantCount(data.count);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  const handleStart = () => {
    // 로그인 없이도 테스트 시작 가능
    router.push('/test');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 via-primary-50 to-white">
      {/* 히어로 섹션 */}
      <main className="container mx-auto px-4 py-12 md:py-20 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            ✨ 이미 {participantCount.toLocaleString()}명이 자신의 마음을 발견했어요
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            언제 연애하는게<br />
            <span className="text-primary-600">이득일까?</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-4 leading-relaxed">
            <span className="block sm:inline">현재의 마음 상태를 분석해서</span>
            <span className="block sm:inline sm:ml-1">연애할 타이밍인지 알려드려요</span>
          </p>
          <p className="text-lg text-gray-500 mb-10">
            <span className="block sm:inline">어떤 상태의 상대방이</span>
            <span className="block sm:inline sm:ml-1">잘 어울리는지도 분석해드려요</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Button
              onClick={handleStart}
              className="px-10 py-5 text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all"
            >
              무료로 시작하기 →
            </Button>
            <p className="text-sm text-gray-500">
              ⏱️ 5분이면 완성되는 나만의 연애 타이밍 분석
            </p>
          </div>

          <p className="text-sm text-primary-600 font-medium">
            💝 회원가입 없이도 바로 시작할 수 있어요
          </p>
        </div>

        {/* 주요 가치 제안 */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-6">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-primary-100 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
              🔍
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              나를 정확하게
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              심리학 기반의 5가지 테스트로 <br />
              진짜 나의 모습을 발견해요
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-primary-100 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
              💌
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              솔직하게
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              &ldquo;마음이 준비되면 시작하세요&rdquo;<br />
              진실된 조언을 드려요
            </p>
          </div>

          <div className="text-center p-6">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-primary-100 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">
              🎁
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              따뜻하게
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              비난이 아닌 이해,<br />
              케어하고 보호하는 마음으로
            </p>
          </div>
        </div>

        {/* 5가지 테스트 소개 */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              5가지 테스트로 알아보는<br />
              <span className="text-primary-600">나의 연애 준비 상태</span>
            </h2>
            <p className="text-gray-600">
              각 테스트는 1~2분이면 완료돼요
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "감정 반응 패턴",
                emoji: "💭",
                desc: "불안할 때, 피하고 싶을 때, 과몰입할 때... 나의 감정 패턴은?",
              },
              {
                title: "소비 심리",
                emoji: "💰",
                desc: "스트레스받을 때 쇼핑하나요? 인정받고 싶어서 사나요?",
              },
              {
                title: "일 처리 방식",
                emoji: "⚡",
                desc: "계획형? 즉흥형? 마감 직전형? 일할 때의 나는",
              },
              {
                title: "갈등 대처법",
                emoji: "💬",
                desc: "싸울 때 나는 회피? 공격? 설득? 수용?",
              },
              {
                title: "번아웃 체크",
                emoji: "🔋",
                desc: "마음의 에너지, 지금 충분한가요?",
              },
            ].map((test, idx) => (
              <div
                key={idx}
                className="bg-gray-50 rounded-2xl p-6 cursor-pointer transition-all duration-200
                  border border-gray-200
                  shadow-[6px_6px_12px_#d1d5db,-6px_-6px_12px_#ffffff]
                  hover:shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff]
                  active:shadow-[inset_4px_4px_8px_#d1d5db,inset_-4px_-4px_8px_#ffffff]"
                onClick={() => router.push(`/test/${idx + 1}`)}
              >
                <div className="text-5xl mb-4">{test.emoji}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {test.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{test.desc}</p>
                <div className="mt-4 text-primary-600 font-semibold text-sm flex items-center gap-1">
                  테스트 시작 <span className="text-lg">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            나는 어떤 사람일까요?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            지금 바로 시작해보세요. 5분이면 충분해요.
          </p>
          <Button
            onClick={handleStart}
            variant="secondary"
            className="bg-white text-primary-600 hover:bg-gray-50 px-10 py-5 text-lg shadow-xl"
          >
            무료로 테스트 시작하기
          </Button>
        </div>
      </main>
    </div>
  );
}
