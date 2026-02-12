'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { CompatibilityResult } from '@/lib/compatibility-analysis';

interface AnalysisData {
  maleAnalysis: {
    score: number;
    categories: { r1: number; r2: number; r3: number; r4: number };
  };
  femaleAnalysis: {
    score: number;
    categories: { r1: number; r2: number; r3: number; r4: number };
  };
  maleImage?: string;
  femaleImage?: string;
}

type FullCompatibilityResult = CompatibilityResult & AnalysisData;

export default function CompatibilityResultPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FullCompatibilityResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'advice'>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchResult() {
      try {
        const response = await fetch(`/api/face/compatibility/result/${code}`);
        if (!response.ok) {
          throw new Error('결과를 찾을 수 없습니다.');
        }
        const data = await response.json();
        setResult(data.data.analysis as FullCompatibilityResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [code]);

  const handleShare = async () => {
    const url = `${window.location.origin}/face-analysis/compatibility/result/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl animate-pulse mb-4">💕</div>
          <p className="text-white/70">궁합 결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-5xl mb-4">😢</div>
          <p className="text-white mb-4">{error || '결과를 찾을 수 없습니다.'}</p>
          <button
            onClick={() => router.push('/face-analysis/compatibility')}
            className="px-6 py-3 bg-pink-500 text-white rounded-xl"
          >
            다시 분석하기
          </button>
        </div>
      </div>
    );
  }

  // 점수에 따른 색상
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-pink-500 to-rose-500';
    if (score >= 65) return 'from-purple-500 to-pink-500';
    if (score >= 50) return 'from-blue-500 to-purple-500';
    return 'from-slate-500 to-blue-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      {/* 헤더 */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/face-analysis')}
            className="text-white/60 hover:text-white transition-colors"
          >
            ← 뒤로
          </button>
          <h1 className="text-lg font-bold text-white">궁합 분석 결과</h1>
          <button
            onClick={handleShare}
            className="text-white/60 hover:text-white transition-colors"
          >
            {copied ? '✓' : '공유'}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* 메인 점수 카드 */}
        <div className={`bg-gradient-to-br ${getScoreColor(result.totalScore)} rounded-3xl p-6 text-center shadow-2xl`}>
          {/* 두 사람 사진 */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {result.maleImage ? (
              <img
                src={result.maleImage}
                alt="남자"
                className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-500/30 flex items-center justify-center text-3xl border-4 border-white/30">
                👨
              </div>
            )}
            <div className="text-4xl animate-pulse">{result.gradeEmoji}</div>
            {result.femaleImage ? (
              <img
                src={result.femaleImage}
                alt="여자"
                className="w-20 h-20 rounded-full object-cover border-4 border-white/30 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-pink-500/30 flex items-center justify-center text-3xl border-4 border-white/30">
                👩
              </div>
            )}
          </div>

          {/* 궁합 점수 */}
          <div className="mb-4">
            <div className="text-7xl font-black text-white drop-shadow-lg">
              {result.totalScore}
              <span className="text-3xl">점</span>
            </div>
            <div className="text-2xl font-bold text-white/90 mt-2">
              {result.gradeLabel}
            </div>
          </div>

          {/* 오행 관계 */}
          <div className="bg-white/20 backdrop-blur rounded-2xl p-4 text-left">
            <div className="flex items-center justify-center gap-3 text-white mb-2">
              <span className="text-lg font-bold">{result.maleElement}</span>
              <span className="text-sm opacity-70">+</span>
              <span className="text-lg font-bold">{result.femaleElement}</span>
              <span className="text-sm opacity-70">=</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">
                {result.elementRelation}
              </span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              {result.elementDescription}
            </p>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-2 bg-white/5 rounded-2xl p-1">
          {[
            { key: 'overview', label: '한눈에 보기' },
            { key: 'details', label: '상세 분석' },
            { key: 'advice', label: '조언' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠: 한눈에 보기 */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* 카테고리별 점수 */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4">카테고리별 궁합</h3>
              <div className="space-y-3">
                {[
                  { key: 'emotion', label: '감정/소통', emoji: '💬' },
                  { key: 'values', label: '가치관', emoji: '🎯' },
                  { key: 'lifestyle', label: '생활 습관', emoji: '🏠' },
                  { key: 'future', label: '미래 비전', emoji: '🔮' },
                  { key: 'physical', label: '활력/에너지', emoji: '⚡' },
                ].map((cat) => {
                  const score = result.categoryScores[cat.key as keyof typeof result.categoryScores];
                  return (
                    <div key={cat.key} className="flex items-center gap-3">
                      <span className="text-xl">{cat.emoji}</span>
                      <span className="text-white/70 text-sm flex-1">{cat.label}</span>
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${
                            score >= 70 ? 'from-pink-500 to-rose-400' :
                            score >= 50 ? 'from-purple-500 to-pink-400' :
                            'from-blue-500 to-purple-400'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-white font-bold text-sm w-8">{score}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 강점 */}
            <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 backdrop-blur rounded-2xl p-5 border border-pink-500/20">
              <h3 className="text-pink-300 font-semibold mb-4">💕 잘 맞는 부분</h3>
              <div className="space-y-4">
                {result.strengths.map((strength, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-2xl">{strength.emoji}</span>
                    <div>
                      <p className="text-white font-medium">{strength.title}</p>
                      <p className="text-white/60 text-sm leading-relaxed">{strength.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 주의점 */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur rounded-2xl p-5 border border-amber-500/20">
              <h3 className="text-amber-300 font-semibold mb-4">⚠️ 주의할 점</h3>
              <div className="space-y-4">
                {result.challenges.map((challenge, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{challenge.emoji}</span>
                      <div>
                        <p className="text-white font-medium">{challenge.title}</p>
                        <p className="text-white/60 text-sm leading-relaxed">{challenge.description}</p>
                      </div>
                    </div>
                    <div className="ml-10 bg-white/5 rounded-xl p-3">
                      <p className="text-amber-200 text-sm">
                        💡 {challenge.advice}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 탭 콘텐츠: 상세 분석 */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* 시기별 전망 */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4">📅 시기별 관계 전망</h3>
              <div className="space-y-4">
                {[
                  { key: 'early', label: '만남 초기 (1-2년)', emoji: '🌱' },
                  { key: 'middle', label: '안정기 (3-7년)', emoji: '🌳' },
                  { key: 'mature', label: '성숙기 (7년+)', emoji: '🌲' },
                ].map((period) => {
                  const data = result.periodForecast[period.key as keyof typeof result.periodForecast];
                  return (
                    <div key={period.key} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span>{period.emoji}</span>
                          <span className="text-white font-medium text-sm">{period.label}</span>
                        </div>
                        <span className={`font-bold ${
                          data.score >= 70 ? 'text-pink-400' :
                          data.score >= 50 ? 'text-purple-400' :
                          'text-blue-400'
                        }`}>
                          {data.score}점
                        </span>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">
                        {data.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 운명적 메시지 */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur rounded-2xl p-6 border border-purple-500/30">
              <div className="text-center mb-4">
                <span className="text-4xl">✨</span>
              </div>
              <p className="text-white/90 text-center leading-relaxed italic">
                "{result.destinyMessage}"
              </p>
            </div>
          </div>
        )}

        {/* 탭 콘텐츠: 조언 */}
        {activeTab === 'advice' && (
          <div className="space-y-4">
            {/* 서로 배려해야 할 점 */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur rounded-2xl p-5 border border-blue-500/20">
              <h3 className="text-blue-300 font-semibold mb-4">👨 남자분이 배려해야 할 점</h3>
              <div className="space-y-3">
                {result.mutualCare.forMale.map((care, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4">
                    <p className="text-white font-medium text-sm mb-1">{care.point}</p>
                    <p className="text-white/50 text-xs">{care.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 backdrop-blur rounded-2xl p-5 border border-pink-500/20">
              <h3 className="text-pink-300 font-semibold mb-4">👩 여자분이 배려해야 할 점</h3>
              <div className="space-y-3">
                {result.mutualCare.forFemale.map((care, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4">
                    <p className="text-white font-medium text-sm mb-1">{care.point}</p>
                    <p className="text-white/50 text-xs">{care.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 관계 발전 조언 */}
            <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
              <h3 className="text-white font-semibold mb-4">🚀 관계 발전 조언</h3>
              <div className="space-y-4">
                {result.developmentAdvice.map((advice, i) => (
                  <div key={i} className="border-l-2 border-purple-500 pl-4">
                    <p className="text-purple-300 text-sm font-medium mb-1">{advice.phase}</p>
                    <p className="text-white/80 text-sm leading-relaxed mb-2">{advice.advice}</p>
                    <p className="text-white/50 text-xs">
                      💡 핵심: {advice.keyPoint}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 하단 요약 */}
        <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10 text-center">
          <p className="text-white/70 text-sm">{result.summary}</p>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/face-analysis/compatibility')}
            className="py-4 bg-white/10 text-white rounded-2xl font-medium hover:bg-white/20 transition-all"
          >
            💕 다시 분석
          </button>
          <button
            onClick={() => router.push('/face-analysis')}
            className="py-4 bg-white/10 text-white rounded-2xl font-medium hover:bg-white/20 transition-all"
          >
            📸 관상 분석
          </button>
        </div>

        {/* 공유 버튼 */}
        <button
          onClick={handleShare}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-bold hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg shadow-pink-500/25"
        >
          {copied ? '✅ 링크 복사됨!' : '📋 결과 링크 공유하기'}
        </button>

        <p className="text-white/30 text-xs text-center">
          이 결과는 7일 후 자동으로 삭제됩니다
        </p>
      </div>
    </div>
  );
}
