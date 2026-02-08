'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';

interface FaceAnalysisResult {
  facecode: string;
  score: number;
  panAngle: number;
  tiltAngle: number;
  rollAngle: number;
  categories: {
    r1: number;
    r2: number;
    r3: number;
    r4: number;
  };
  analysis: {
    eyeAngle: { label: string; description: string };
    eyebrowDistance: { label: string; description: string };
    noseLength: { label: string; description: string };
    philtrumLength: { label: string; description: string };
    mouthWidth: { label: string; description: string };
    jawWidth: { label: string; description: string };
    eyeSize: { label: string; description: string };
  };
  summary: string;
  recommendations: string[];
  gender: 'male' | 'female';
}

// 점수에 따른 등급 반환
function getScoreGrade(score: number): { grade: string; color: string; emoji: string } {
  if (score >= 85) return { grade: '최상', color: 'from-yellow-400 to-amber-500', emoji: '👑' };
  if (score >= 70) return { grade: '상', color: 'from-purple-500 to-pink-500', emoji: '✨' };
  if (score >= 55) return { grade: '중상', color: 'from-blue-500 to-cyan-500', emoji: '💫' };
  if (score >= 40) return { grade: '중', color: 'from-green-500 to-emerald-500', emoji: '🍀' };
  return { grade: '하', color: 'from-gray-500 to-gray-600', emoji: '🌱' };
}

// 카테고리 정보
const CATEGORY_INFO = {
  r1: { name: '권력/운명', emoji: '👑', color: 'bg-amber-500' },
  r2: { name: '정신/사랑', emoji: '💕', color: 'bg-pink-500' },
  r3: { name: '일/사교/재물', emoji: '💰', color: 'bg-emerald-500' },
  r4: { name: '성실/책임', emoji: '🌟', color: 'bg-blue-500' },
};

// 분석 항목 아이콘
const ANALYSIS_ICONS: { [key: string]: string } = {
  eyeAngle: '👁️',
  eyebrowDistance: '🎯',
  noseLength: '👃',
  philtrumLength: '💋',
  mouthWidth: '😊',
  jawWidth: '🏛️',
  eyeSize: '✨',
};

// 분석 항목 한글명
const ANALYSIS_NAMES: { [key: string]: string } = {
  eyeAngle: '눈꼬리 각도',
  eyebrowDistance: '눈-눈썹 거리',
  noseLength: '코 길이',
  philtrumLength: '인중 길이',
  mouthWidth: '입 너비',
  jawWidth: '하관(턱)',
  eyeSize: '눈 크기',
};

export default function FaceAnalysisResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<FaceAnalysisResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const savedData = sessionStorage.getItem('faceAnalysisResult');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setResult(parsed.result);
      setImage(parsed.image);
      setGender(parsed.gender);
    }
  }, []);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🔮</div>
          <p className="text-gray-600 text-lg mb-6">결과를 불러오는 중...</p>
          <Button onClick={() => router.push('/face-analysis')}>
            다시 분석하기
          </Button>
        </div>
      </div>
    );
  }

  const { grade, color, emoji } = getScoreGrade(result.score);
  const maxCategory = Math.max(result.categories.r1, result.categories.r2, result.categories.r3, result.categories.r4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* 메인 결과 카드 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
          {/* 헤더 그라데이션 */}
          <div className={`bg-gradient-to-r ${color} px-6 py-8 text-white text-center`}>
            <div className="text-5xl mb-3">{emoji}</div>
            <h1 className="text-3xl font-bold mb-1">{grade} 등급</h1>
            <p className="text-white/80">관상 종합 점수</p>
          </div>

          {/* 점수 원형 표시 */}
          <div className="relative -mt-10 flex justify-center">
            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-white">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{result.score}</div>
                <div className="text-xs text-gray-500">/ 100</div>
              </div>
            </div>
          </div>

          {/* 종합 해석 */}
          <div className="px-6 py-6 text-center">
            <p className="text-gray-700 text-lg leading-relaxed">
              {result.summary}
            </p>
          </div>
        </div>

        {/* 4대 운세 카테고리 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            4대 운세 분석
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {(Object.entries(CATEGORY_INFO) as [keyof typeof CATEGORY_INFO, typeof CATEGORY_INFO[keyof typeof CATEGORY_INFO]][]).map(([key, info]) => {
              const value = result.categories[key];
              const percentage = Math.min(100, Math.round((value / maxCategory) * 100));
              return (
                <div key={key} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{info.emoji}</span>
                    <span className="text-sm font-medium text-gray-700">{info.name}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${info.color} h-2 rounded-full transition-all duration-700`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-right text-xs text-gray-500 mt-1">
                    {value}점
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 부위별 상세 분석 */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <span>🔍</span>
              얼굴 부위별 상세 분석
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {Object.entries(result.analysis).map(([key, value]) => (
              <div
                key={key}
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedItem(expandedItem === key ? null : key)}
              >
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ANALYSIS_ICONS[key]}</span>
                    <div>
                      <div className="text-sm text-gray-500">{ANALYSIS_NAMES[key]}</div>
                      <div className="font-medium text-gray-800">{value.label}</div>
                    </div>
                  </div>
                  <span className={`transform transition-transform ${expandedItem === key ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
                {expandedItem === key && (
                  <div className="px-6 pb-4 -mt-2">
                    <div className="bg-amber-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                      {value.description}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 추천사항 */}
        {result.recommendations.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span>💡</span>
                맞춤 조언
              </h3>
            </div>
            <div className="p-6">
              <ul className="space-y-3">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 얼굴 각도 정보 (디버그용, 작게 표시) */}
        <div className="bg-gray-100 rounded-xl p-4 mb-6 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>분석 ID: {result.facecode.slice(0, 8)}</span>
            <span>
              각도 보정: {Math.abs(result.panAngle).toFixed(1)}°
            </span>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => router.push('/face-analysis')}
            className="flex flex-col items-center justify-center gap-2 py-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            <span className="text-2xl">📸</span>
            <span className="text-xs font-semibold text-gray-700">다시 분석</span>
          </button>
          <button
            onClick={handleShare}
            className="flex flex-col items-center justify-center gap-2 py-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            {isCopied ? (
              <>
                <span className="text-2xl text-white">✓</span>
                <span className="text-xs font-semibold text-white">복사 완료</span>
              </>
            ) : (
              <>
                <span className="text-2xl text-white">🔗</span>
                <span className="text-xs font-semibold text-white">공유하기</span>
              </>
            )}
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex flex-col items-center justify-center gap-2 py-4 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            <span className="text-2xl">🏠</span>
            <span className="text-xs font-semibold text-gray-700">홈으로</span>
          </button>
        </div>

        {/* 안내 */}
        <div className="bg-white/80 backdrop-blur rounded-xl p-5 text-center">
          <p className="text-sm text-gray-600">
            🔮 AI 관상 분석은 재미로만 참고해주세요.<br />
            <strong className="text-gray-800">과학적 근거가 아닌 전통 관상학을 기반으로 합니다.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
