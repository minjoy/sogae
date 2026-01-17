'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

// 모든 성격 코드 조합 설명
const attachmentTypes = [
  { code: 'S', name: '안정형', emoji: '🌟', description: '관계에서 안정감을 느끼고, 적절한 거리와 친밀함을 자연스럽게 조절합니다. 상대를 믿고, 갈등이 생겨도 대화로 풀어갈 수 있어요.' },
  { code: 'A', name: '확인형', emoji: '💗', description: '상대의 마음을 자주 확인하고 싶어하며, 연락이 뜸하면 불안해집니다. 사랑이 깊다는 증거이기도 해요.' },
  { code: 'V', name: '독립형', emoji: '🦋', description: '독립성과 개인 공간을 중요하게 여깁니다. 너무 빨리 가까워지면 부담스럽고, 혼자만의 시간이 필요해요.' },
  { code: 'M', name: '밀당형', emoji: '🎭', description: '가까워지고 싶지만 동시에 부담스러운 복잡한 감정을 느낍니다. 밀고 당기기 패턴이 나타날 수 있어요.' },
];

const energyTypes = [
  { code: 'H', name: '활력 충만', emoji: '🔥', description: '에너지가 충만한 상태로, 새로운 관계를 시작하거나 깊게 발전시키기 좋은 시기입니다.' },
  { code: 'B', name: '균형 상태', emoji: '⚖️', description: '적절한 에너지 밸런스를 유지하고 있어, 관계에 안정적으로 집중할 수 있습니다.' },
  { code: 'L', name: '회복 중', emoji: '🌿', description: '에너지가 많이 소진된 상태입니다. 새로운 관계보다는 회복과 재충전이 우선이에요.' },
];

const conflictTypes = [
  { code: 'C', name: '대화형', emoji: '💬', description: '문제가 생기면 대화로 풀어가려는 협력형입니다. 상대의 입장도 이해하려 노력해요.' },
  { code: 'S', name: '솔직형', emoji: '⚡', description: '문제가 생기면 솔직하게 표현합니다. 명확한 소통을 선호하지만, 때로는 톤이 강해 보일 수 있어요.' },
  { code: 'P', name: '배려형', emoji: '🤝', description: '문제가 생기면 상대를 배려해 양보하는 편입니다. 관계를 부드럽게 유지하지만, 자신의 욕구를 억압할 수 있어요.' },
  { code: 'D', name: '정리형', emoji: '🚪', description: '문제가 생기면 일단 거리를 두고 혼자 정리하려는 편입니다. 시간이 필요하지만, 대화를 미루면 오해가 쌓일 수 있어요.' },
];

const lifestyleTypes = [
  { code: 'P', name: '계획형', emoji: '📅', description: '체계적으로 계획을 세우고 실행합니다. 약속 시간을 잘 지키고, 예상치 못한 변화에 스트레스를 받을 수 있어요.' },
  { code: 'E', name: '탐색형', emoji: '🔍', description: '신중하게 생각하고 결정합니다. 충분히 고민한 후 행동하지만, 결정이 느려 보일 수 있어요.' },
  { code: 'I', name: '즉흥형', emoji: '🎲', description: '떠오르면 바로 실행합니다. 유연하고 적응력이 좋지만, 상대에게 배려 없이 보일 수 있어요.' },
  { code: 'R', name: '마감형', emoji: '⏰', description: '마감이 다가와야 집중력이 폭발합니다. 효율적이지만, 바쁠 때 연락이 뜸해질 수 있어요.' },
];

type CategoryKey = 'attachment' | 'energy' | 'conflict' | 'lifestyle';

export default function PersonalityPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('attachment');

  const categories: { key: CategoryKey; name: string; position: string; types: typeof attachmentTypes }[] = [
    { key: 'attachment', name: '애착 스타일', position: '첫 번째 글자', types: attachmentTypes },
    { key: 'energy', name: '에너지 레벨', position: '두 번째 글자', types: energyTypes },
    { key: 'conflict', name: '갈등 스타일', position: '세 번째 글자', types: conflictTypes },
    { key: 'lifestyle', name: '생활 방식', position: '네 번째 글자', types: lifestyleTypes },
  ];

  const activeData = categories.find(c => c.key === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            📖 성격 코드 해석표
          </h1>
          <p className="text-gray-600">
            MBTI처럼 4글자로 나의 연애 성격을 알 수 있어요
          </p>
        </div>

        {/* 코드 예시 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">성격 코드 구조</h2>
          <div className="flex justify-center items-center gap-2 md:gap-4 mb-4">
            {categories.map((cat, index) => (
              <div key={cat.key} className="flex items-center">
                <button
                  onClick={() => setActiveCategory(cat.key)}
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold transition-all ${
                    activeCategory === cat.key
                      ? 'bg-primary-500 text-white scale-110 shadow-lg'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {index === 0 ? 'S' : index === 1 ? 'H' : index === 2 ? 'C' : 'P'}
                </button>
                {index < 3 && <span className="text-gray-300 mx-1">·</span>}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 md:gap-8 text-xs text-gray-500">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`text-center transition-all ${activeCategory === cat.key ? 'text-primary-600 font-semibold' : ''}`}
              >
                {cat.position}
              </button>
            ))}
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? 'bg-primary-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 타입 목록 */}
        {activeData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📍</span>
              <h2 className="text-xl font-bold text-gray-900">{activeData.name}</h2>
              <span className="text-sm text-gray-500">({activeData.position})</span>
            </div>

            {activeData.types.map(type => (
              <div
                key={type.code}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-primary-600">{type.code}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{type.emoji}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{type.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">나의 성격 코드가 궁금하다면?</h3>
          <p className="mb-6 opacity-90">5가지 테스트를 완료하고 나만의 4글자 코드를 받아보세요</p>
          <Button
            variant="secondary"
            className="bg-white text-primary-600 hover:bg-gray-50 font-semibold px-8"
            onClick={() => router.push('/test')}
          >
            테스트 시작하기
          </Button>
        </div>
      </div>
    </div>
  );
}
