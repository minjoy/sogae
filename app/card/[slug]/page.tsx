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

  useEffect(() => {
    fetchCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

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
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${card.nickname}님의 나 사용설명서`,
          text: '나를 이해하면, 관계가 쉬워진다',
          url: url,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // 클립보드 복사
      try {
        await navigator.clipboard.writeText(url);
        alert('링크가 복사되었습니다!');
      } catch (error) {
        console.error('Copy failed:', error);
      }
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
          <p className="text-gray-600">나를 이해하면, 관계가 쉬워진다</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          {/* 연애 준비 상태 */}
          <div
            className={`p-6 border-b-2 ${getReadinessColor(card.datingEmoji)}`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">{card.datingEmoji}</div>
              <h2 className="text-xl font-bold mb-1">{card.datingMode}</h2>
              {card.showScores && (
                <p className="text-sm opacity-75">
                  준비 점수: {card.datingScore}점
                </p>
              )}
            </div>
          </div>

          {/* 타입 요약 */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
              나의 타입
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

          {/* 파트너에게 */}
          <div className="p-6 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center">
              <span className="text-xl mr-2">💌</span>
              파트너에게
            </h3>
            <div className="space-y-2">
              {card.phraseForPartner?.map((phrase: string, index: number) => (
                <p key={index} className="text-gray-700 italic">
                  "{phrase}"
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 mb-8">
          <Button variant="outline" onClick={handleShare} className="flex-1">
            📤 공유하기
          </Button>
          <Button onClick={() => router.push('/')} className="flex-1">
            나도 만들기
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
            소개 - 나를 이해하면, 관계가 쉬워진다
          </Link>
        </div>
      </div>
    </div>
  );
}
