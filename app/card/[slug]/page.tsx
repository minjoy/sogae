'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';

export default function CardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [card, setCard] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    // 로그인 상태 확인
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    fetchCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // 메타태그 동적 업데이트
  useEffect(() => {
    if (card) {
      const title = `${card.nickname}님의 연애 타이밍 분석 | 언연이`;
      const description = `${card.personalityType?.name || ''} - 지금 연애하면 좋을까?`;
      const url = window.location.href;

      // 기본 메타태그
      document.title = title;
      updateMetaTag('name', 'description', description);

      // Open Graph
      updateMetaTag('property', 'og:title', title);
      updateMetaTag('property', 'og:description', description);
      updateMetaTag('property', 'og:url', url);
      updateMetaTag('property', 'og:type', 'profile');
      updateMetaTag('property', 'og:site_name', '언연이 - 언제 연애하는게 이득일까');
      updateMetaTag('property', 'og:image', window.location.origin + '/images/og-card.png');

      // Twitter Card
      updateMetaTag('name', 'twitter:card', 'summary_large_image');
      updateMetaTag('name', 'twitter:title', title);
      updateMetaTag('name', 'twitter:description', description);
      updateMetaTag('name', 'twitter:image', window.location.origin + '/images/og-card.png');
    }
  }, [card]);

  const updateMetaTag = (attr: string, key: string, content: string) => {
    let element = document.querySelector(`meta[${attr}="${key}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, key);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  const fetchCard = async () => {
    try {
      const response = await fetch(`/api/card/${slug}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '카드를 찾을 수 없습니다');
        return;
      }

      setCard(data.card);
    } catch (error) {
      console.error('Failed to fetch card:', error);
      setError('카드를 불러오는 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!card) return;

    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('링크 복사에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">카드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || '카드를 찾을 수 없습니다'}
          </h1>
          <Button onClick={() => router.push('/')}>
            홈으로 가기
          </Button>
        </div>
      </div>
    );
  }

  const getReadinessColor = (emoji: string) => {
    if (emoji === '🔥') return 'bg-red-50 border-red-200 text-red-800';
    if (emoji === '🌿') return 'bg-green-50 border-green-200 text-green-800';
    if (emoji === '🧘') return 'bg-blue-50 border-blue-200 text-blue-800';
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {card.nickname}님의 사용설명서
          </h1>
          <p className="text-gray-600">언제 연애하는게 이득일까?</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          {/* 성격 유형 */}
          {card.personalityType && (
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-center text-white border-b-2 border-primary-700">
              <div className="text-6xl mb-3">{card.personalityType.emoji}</div>
              <div className="inline-block bg-white/20 backdrop-blur px-5 py-2 rounded-full text-sm font-semibold mb-2">
                {card.personalityType.code}
              </div>
              <h2 className="text-2xl font-bold mb-2">{card.personalityType.name}</h2>
              <p className="text-sm opacity-90">{card.personalityType.summary}</p>
            </div>
          )}

          {/* 연애 준비 상태 */}
          <div
            className={`p-6 border-b-2 ${getReadinessColor(card.datingEmoji)}`}
          >
            <h3 className="text-xs font-semibold text-center opacity-60 mb-4">
              나의 연애 준비상태
            </h3>
            <div className="text-center">
              <div className="text-4xl mb-2">{card.datingEmoji}</div>
              <h3 className="text-lg font-bold mb-2">{card.datingMode}</h3>
              {card.showScores && (
                <div className="text-sm opacity-75">
                  <p className="font-semibold mb-1">준비 점수: {card.datingScore}점</p>
                  <p className="text-xs">
                    {card.datingScore >= 80 && '(80점 이상: 연애 시작에 매우 좋은 상태)'}
                    {card.datingScore >= 55 && card.datingScore < 80 && '(55-79점: 천천히 진행하며 관계 발전 가능)'}
                    {card.datingScore < 55 && '(0-54점: 회복과 재충전이 우선 필요한 시기)'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 성격 유형 설명 */}
          {card.personalityType && card.personalityType.description && (
            <div className="p-6 border-b border-gray-100 bg-blue-50/30">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    성격 유형 설명
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {card.personalityType.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 타입 요약 */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
              세부 특성
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-2xl mb-2">💭</div>
                <p className="text-xs text-gray-600 mb-1">감정</p>
                <p className="font-semibold text-gray-900">
                  {card.emotionLabel}
                </p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="text-2xl mb-2">💰</div>
                <p className="text-xs text-gray-600 mb-1">소비</p>
                <p className="font-semibold text-gray-900">
                  {card.spendingLabel}
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-2xl mb-2">⚡</div>
                <p className="text-xs text-gray-600 mb-1">업무</p>
                <p className="font-semibold text-gray-900">
                  {card.workLabel}
                </p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <div className="text-2xl mb-2">💬</div>
                <p className="text-xs text-gray-600 mb-1">갈등</p>
                <p className="font-semibold text-gray-900">
                  {card.communicationLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Do's */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-green-600 mb-3 flex items-center">
              <span className="text-xl mr-2">✅</span>
              이런 것들이 좋아요
            </h3>
            <ul className="space-y-2">
              {card.doList?.map((item: string, index: number) => (
                <li key={index} className="text-gray-700 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Don'ts */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center">
              <span className="text-xl mr-2">❌</span>
              이런 건 힘들어요
            </h3>
            <ul className="space-y-2">
              {card.dontList?.map((item: string, index: number) => (
                <li key={index} className="text-gray-700 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 연애 조언 */}
          <div className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-xl mr-2">💕</span>
              {card.showScores && card.datingScore >= 55 ? '연애 조언' : '지금 나에게 필요한 것'}
            </h3>
            {card.showScores && card.datingScore >= 55 ? (
              <div className="space-y-3">
                <div className="bg-white/60 backdrop-blur rounded-lg p-4">
                  <p className="text-sm text-gray-800 leading-relaxed mb-2">
                    현재 당신은 연애를 시작할 수 있는 좋은 상태입니다.
                    {card.datingScore >= 80
                      ? ' 마음의 에너지가 충분하고, 건강한 관계를 만들어갈 준비가 되어 있어요.'
                      : ' 천천히 관계를 발전시켜 나가면서 서로를 알아가는 것을 추천해요.'
                    }
                  </p>
                  <p className="text-xs text-gray-600">
                    💡 상대방에게 나의 특성을 솔직하게 공유하고, 서로의 차이를 존중하는 관계를 만들어보세요.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white/60 backdrop-blur rounded-lg p-4">
                  <p className="text-sm text-gray-800 leading-relaxed mb-3 font-semibold">
                    지금은 나를 돌보는 시간이 필요해요
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed mb-3">
                    현재 마음의 에너지가 충분하지 않은 상태입니다. 무리하게 연애를 시작하기보다는, 먼저 나 자신을 회복하고 재충전하는 시간을 가져보세요.
                  </p>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-800 mb-2">추천 활동:</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• 충분한 휴식과 수면으로 에너지 회복하기</li>
                      <li>• 좋아하는 취미나 관심사에 시간 투자하기</li>
                      <li>• 친한 친구들과 가벼운 만남 갖기</li>
                      <li>• 필요하다면 전문가 상담 고려하기</li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-gray-600 text-center">
                  당신이 충분히 회복된 후, 더 건강하고 행복한 연애를 시작할 수 있을 거예요 💚
                </p>
              </div>
            )}
          </div>

          {/* 어울리는 연애 상대 */}
          {card.personalityType?.compatibleTypes && card.personalityType.compatibleTypes.length > 0 && (
            <div className="p-6 bg-blue-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-xl mr-2">💕</span>
                나와 잘 어울리는 연애 상대
              </h3>
              <div className="space-y-4">
                {card.personalityType.compatibleTypes.map((compatible: any, index: number) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-bold">
                        {compatible.code}
                      </div>
                      <h4 className="font-semibold text-gray-900">{compatible.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {compatible.reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 mb-8">
          <Button variant="outline" onClick={handleShare} className="flex-1">
            {isCopied ? '✓ 복사됨!' : '📤 공유하기'}
          </Button>
          <Button
            onClick={() => router.push(isLoggedIn ? '/my' : '/')}
            className="flex-1"
          >
            {isLoggedIn ? '마이페이지' : '나도 만들기'}
          </Button>
        </div>

        {/* 안내 */}
        <div className="bg-white rounded-xl p-6 text-center shadow-sm">
          <p className="text-sm text-gray-600 mb-2">
            이 결과는 참고용이며, 전문 상담을 대체하지 않습니다.
          </p>
          <Link
            href="/"
            className="text-sm text-blue-600 hover:underline font-semibold"
          >
            언연이 - 언제 연애하는게 이득일까
          </Link>
        </div>
      </div>
    </div>
  );
}
