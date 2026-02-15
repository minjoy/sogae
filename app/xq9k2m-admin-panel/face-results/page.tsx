'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/useAdminAuth';
import Image from 'next/image';

interface SingleAnalysis {
  id: string;
  shareCode: string;
  score: number;
  gender: string;
  categories: { r1: number; r2: number; r3: number; r4: number };
  analysis: Record<string, unknown>;
  hasImage: boolean;
  imageData: string | null;
  panAngle: number | null;
  tiltAngle: number | null;
  rollAngle: number | null;
  clientIp: string | null;
  clientFingerprint: string | null;
  expiresAt: string;
  viewCount: number;
  createdAt: string;
}

interface CompatibilityAnalysis {
  id: string;
  shareCode: string;
  compatibilityScore: number;
  categoryScores: Record<string, number>;
  maleImage: string | null;
  femaleImage: string | null;
  maleAnalysis: { score: number; categories: Record<string, number> } | null;
  femaleAnalysis: { score: number; categories: Record<string, number> } | null;
  clientIp: string | null;
  clientFingerprint: string | null;
  expiresAt: string;
  createdAt: string;
}

interface DailyStats {
  date: string;
  count: number;
}

interface Stats {
  single: {
    daily: DailyStats[];
    total: number;
    uniqueIps: number;
    uniqueFingerprints: number;
  };
  compatibility: {
    daily: DailyStats[];
    total: number;
    uniqueIps: number;
    uniqueFingerprints: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_IMAGE = '/images/default-face.png';

export default function FaceResultsPage() {
  const router = useRouter();
  const { password, isAuthenticated, isLoading: authLoading } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<'stats' | 'single' | 'compatibility'>('stats');
  const [isLoading, setIsLoading] = useState(false);

  // 통계
  const [stats, setStats] = useState<Stats | null>(null);

  // 한 사람 관상
  const [singleAnalyses, setSingleAnalyses] = useState<SingleAnalysis[]>([]);
  const [singlePagination, setSinglePagination] = useState<Pagination | null>(null);

  // 두 사람 궁합
  const [compatibilityAnalyses, setCompatibilityAnalyses] = useState<CompatibilityAnalysis[]>([]);
  const [compatibilityPagination, setCompatibilityPagination] = useState<Pagination | null>(null);

  // 상세 모달
  const [selectedSingle, setSelectedSingle] = useState<SingleAnalysis | null>(null);
  const [selectedCompatibility, setSelectedCompatibility] = useState<CompatibilityAnalysis | null>(null);

  // 사용자 이력 모달
  const [userHistoryModal, setUserHistoryModal] = useState<{
    type: 'ip' | 'fingerprint';
    value: string;
    single: Array<{ id: string; shareCode: string; score: number; gender: string; createdAt: string }>;
    compatibility: Array<{ id: string; shareCode: string; compatibilityScore: number; createdAt: string }>;
  } | null>(null);

  // 통계 로드
  const fetchStats = useCallback(async () => {
    if (!password) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/face-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, type: 'daily-stats' }),
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [password]);

  // 한 사람 관상 로드
  const fetchSingleAnalyses = useCallback(async (page = 1) => {
    if (!password) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/face-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, type: 'single', page, limit: 20 }),
      });
      const data = await response.json();
      if (data.success) {
        setSingleAnalyses(data.analyses);
        setSinglePagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch single analyses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [password]);

  // 두 사람 궁합 로드
  const fetchCompatibilityAnalyses = useCallback(async (page = 1) => {
    if (!password) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/face-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, type: 'compatibility', page, limit: 20 }),
      });
      const data = await response.json();
      if (data.success) {
        setCompatibilityAnalyses(data.compatibilities);
        setCompatibilityPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch compatibility analyses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [password]);

  // 사용자 이력 로드
  const fetchUserHistory = useCallback(async (type: 'ip' | 'fingerprint', value: string) => {
    if (!password) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/face-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          type: 'user-history',
          [type]: value,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setUserHistoryModal({
          type,
          value,
          single: data.history.single,
          compatibility: data.history.compatibility,
        });
      }
    } catch (error) {
      console.error('Failed to fetch user history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [password]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (!isAuthenticated) return;

    if (activeTab === 'stats') {
      fetchStats();
    } else if (activeTab === 'single') {
      fetchSingleAnalyses();
    } else if (activeTab === 'compatibility') {
      fetchCompatibilityAnalyses();
    }
  }, [activeTab, isAuthenticated, fetchStats, fetchSingleAnalyses, fetchCompatibilityAnalyses]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isImageExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // 인증 확인 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-4"></div>
          <p>세션 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/xq9k2m-admin-panel');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/xq9k2m-admin-panel')}
            className="text-gray-400 hover:text-white"
          >
            ← 대시보드
          </button>
          <h1 className="text-2xl font-bold text-white">관상 분석 결과</h1>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'stats', label: '일별 통계' },
            { key: 'single', label: '한 사람 관상' },
            { key: 'compatibility', label: '두 사람 궁합' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 일별 통계 */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* 요약 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-sm">한 사람 관상 (전체)</p>
                <p className="text-2xl font-bold text-white">{stats.single.total.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-sm">두 사람 궁합 (전체)</p>
                <p className="text-2xl font-bold text-white">{stats.compatibility.total.toLocaleString()}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-sm">고유 IP (30일)</p>
                <p className="text-2xl font-bold text-white">
                  {(stats.single.uniqueIps + stats.compatibility.uniqueIps).toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-gray-400 text-sm">고유 방문자 (30일)</p>
                <p className="text-2xl font-bold text-white">
                  {Math.max(stats.single.uniqueFingerprints, stats.compatibility.uniqueFingerprints).toLocaleString()}
                </p>
              </div>
            </div>

            {/* 일별 차트 */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* 한 사람 관상 일별 */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">한 사람 관상 (최근 30일)</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stats.single.daily.map((item) => (
                    <div key={item.date} className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">{item.date}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min((item.count / Math.max(...stats.single.daily.map(d => d.count))) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-white font-medium w-10 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                  {stats.single.daily.length === 0 && (
                    <p className="text-gray-500 text-center py-4">데이터 없음</p>
                  )}
                </div>
              </div>

              {/* 두 사람 궁합 일별 */}
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">두 사람 궁합 (최근 30일)</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {stats.compatibility.daily.map((item) => (
                    <div key={item.date} className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">{item.date}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-pink-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min((item.count / Math.max(...stats.compatibility.daily.map(d => d.count), 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-white font-medium w-10 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                  {stats.compatibility.daily.length === 0 && (
                    <p className="text-gray-500 text-center py-4">데이터 없음</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 한 사람 관상 목록 */}
        {activeTab === 'single' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">사진</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">점수</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">성별</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">카테고리</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">각도</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">FP</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">조회수</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">생성일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        로딩 중...
                      </td>
                    </tr>
                  ) : singleAnalyses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        데이터가 없습니다
                      </td>
                    </tr>
                  ) : (
                    singleAnalyses.map((analysis) => (
                      <tr
                        key={analysis.id}
                        className="hover:bg-gray-750 cursor-pointer"
                        onClick={() => setSelectedSingle(analysis)}
                      >
                        <td className="px-4 py-3">
                          <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-700">
                            {analysis.hasImage && !isImageExpired(analysis.expiresAt) ? (
                              <Image
                                src={analysis.imageData || DEFAULT_IMAGE}
                                alt="관상 사진"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                만료
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-lg font-bold text-white">{analysis.score}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            analysis.gender === 'male' ? 'bg-blue-600/20 text-blue-400' : 'bg-pink-600/20 text-pink-400'
                          }`}>
                            {analysis.gender === 'male' ? '남' : '여'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-400">
                          R1:{analysis.categories.r1} R2:{analysis.categories.r2}<br/>
                          R3:{analysis.categories.r3} R4:{analysis.categories.r4}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-400">
                          {analysis.panAngle?.toFixed(1) || '-'}/{analysis.tiltAngle?.toFixed(1) || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {analysis.clientFingerprint ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchUserHistory('fingerprint', analysis.clientFingerprint!);
                              }}
                              className="text-xs text-blue-400 hover:underline font-mono"
                              title={analysis.clientFingerprint}
                            >
                              {analysis.clientFingerprint.length > 8
                                ? analysis.clientFingerprint.slice(0, 8) + '…'
                                : analysis.clientFingerprint}
                            </button>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-400">
                          {analysis.viewCount}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-400">
                          {formatDate(analysis.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {singlePagination && singlePagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 bg-gray-750">
                {Array.from({ length: Math.min(singlePagination.totalPages, 10) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => fetchSingleAnalyses(page)}
                      className={`w-10 h-10 rounded-lg font-medium ${
                        singlePagination.page === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 두 사람 궁합 목록 */}
        {activeTab === 'compatibility' && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300">사진</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">궁합점수</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">남자점수</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">여자점수</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">카테고리</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">FP</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300">생성일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        로딩 중...
                      </td>
                    </tr>
                  ) : compatibilityAnalyses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        데이터가 없습니다
                      </td>
                    </tr>
                  ) : (
                    compatibilityAnalyses.map((analysis) => (
                      <tr
                        key={analysis.id}
                        className="hover:bg-gray-750 cursor-pointer"
                        onClick={() => setSelectedCompatibility(analysis)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-700">
                              {analysis.maleImage && !isImageExpired(analysis.expiresAt) ? (
                                <Image
                                  src={analysis.maleImage}
                                  alt="남자"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                  남
                                </div>
                              )}
                            </div>
                            <div className="w-12 h-12 relative rounded-lg overflow-hidden bg-gray-700">
                              {analysis.femaleImage && !isImageExpired(analysis.expiresAt) ? (
                                <Image
                                  src={analysis.femaleImage}
                                  alt="여자"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                  여
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-lg font-bold text-pink-400">{analysis.compatibilityScore}%</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-blue-400">{analysis.maleAnalysis?.score || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-pink-400">{analysis.femaleAnalysis?.score || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-400">
                          {analysis.categoryScores ? (
                            <div>
                              감정:{analysis.categoryScores.emotion || '-'}<br/>
                              가치:{analysis.categoryScores.values || '-'}
                            </div>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {analysis.clientFingerprint ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchUserHistory('fingerprint', analysis.clientFingerprint!);
                              }}
                              className="text-xs text-blue-400 hover:underline font-mono"
                              title={analysis.clientFingerprint}
                            >
                              {analysis.clientFingerprint.length > 8
                                ? analysis.clientFingerprint.slice(0, 8) + '…'
                                : analysis.clientFingerprint}
                            </button>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-400">
                          {formatDate(analysis.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {compatibilityPagination && compatibilityPagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 bg-gray-750">
                {Array.from({ length: Math.min(compatibilityPagination.totalPages, 10) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => fetchCompatibilityAnalyses(page)}
                      className={`w-10 h-10 rounded-lg font-medium ${
                        compatibilityPagination.page === page
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 한 사람 관상 상세 모달 */}
      {selectedSingle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedSingle(null)} />
          <div className="relative w-full max-w-2xl bg-gray-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedSingle(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white mb-4">관상 분석 상세</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* 이미지 */}
              <div>
                <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-gray-700">
                  {selectedSingle.hasImage && !isImageExpired(selectedSingle.expiresAt) && selectedSingle.imageData ? (
                    <Image
                      src={selectedSingle.imageData}
                      alt="관상 사진"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      이미지 만료됨
                    </div>
                  )}
                </div>
              </div>

              {/* 정보 */}
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">공유 코드</p>
                  <p className="text-white font-mono">{selectedSingle.shareCode}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">점수</p>
                    <p className="text-2xl font-bold text-white">{selectedSingle.score}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">성별</p>
                    <p className="text-white">{selectedSingle.gender === 'male' ? '남자' : '여자'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">카테고리 점수</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-700 rounded-lg p-2">
                      <p className="text-xs text-gray-400">R1 (운명/권력)</p>
                      <p className="text-white font-bold">{selectedSingle.categories.r1}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <p className="text-xs text-gray-400">R2 (정신/사랑)</p>
                      <p className="text-white font-bold">{selectedSingle.categories.r2}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <p className="text-xs text-gray-400">R3 (일/재물)</p>
                      <p className="text-white font-bold">{selectedSingle.categories.r3}</p>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2">
                      <p className="text-xs text-gray-400">R4 (성실/책임)</p>
                      <p className="text-white font-bold">{selectedSingle.categories.r4}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">얼굴 각도 (검증용)</p>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <p className="text-xs text-gray-400">
                      Pan: {selectedSingle.panAngle?.toFixed(2) || '-'}° |
                      Tilt: {selectedSingle.tiltAngle?.toFixed(2) || '-'}° |
                      Roll: {selectedSingle.rollAngle?.toFixed(2) || '-'}°
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-sm">클라이언트 정보</p>
                  <p className="text-white text-sm">IP: {selectedSingle.clientIp || '-'}</p>
                  <p className="text-white text-sm font-mono text-xs break-all">
                    FP: {selectedSingle.clientFingerprint || '-'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">조회수</p>
                    <p className="text-white">{selectedSingle.viewCount}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">생성일</p>
                    <p className="text-white text-sm">{formatDate(selectedSingle.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 분석 데이터 (JSON) */}
            <div className="mt-6">
              <p className="text-gray-400 text-sm mb-2">분석 데이터 (JSON)</p>
              <pre className="bg-gray-900 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto max-h-48">
                {JSON.stringify(selectedSingle.analysis, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 두 사람 궁합 상세 모달 */}
      {selectedCompatibility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelectedCompatibility(null)} />
          <div className="relative w-full max-w-2xl bg-gray-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCompatibility(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white mb-4">궁합 분석 상세</h2>

            {/* 이미지 */}
            <div className="flex justify-center gap-4 mb-6">
              <div className="text-center">
                <div className="w-24 h-24 relative rounded-xl overflow-hidden bg-gray-700 mx-auto">
                  {selectedCompatibility.maleImage && !isImageExpired(selectedCompatibility.expiresAt) ? (
                    <Image
                      src={selectedCompatibility.maleImage}
                      alt="남자"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">만료</div>
                  )}
                </div>
                <p className="text-blue-400 mt-2">남자</p>
                <p className="text-white font-bold">{selectedCompatibility.maleAnalysis?.score || '-'}점</p>
              </div>

              <div className="flex items-center">
                <span className="text-3xl">❤️</span>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 relative rounded-xl overflow-hidden bg-gray-700 mx-auto">
                  {selectedCompatibility.femaleImage && !isImageExpired(selectedCompatibility.expiresAt) ? (
                    <Image
                      src={selectedCompatibility.femaleImage}
                      alt="여자"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">만료</div>
                  )}
                </div>
                <p className="text-pink-400 mt-2">여자</p>
                <p className="text-white font-bold">{selectedCompatibility.femaleAnalysis?.score || '-'}점</p>
              </div>
            </div>

            {/* 궁합 점수 */}
            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm">궁합 점수</p>
              <p className="text-4xl font-bold text-pink-400">{selectedCompatibility.compatibilityScore}%</p>
            </div>

            {/* 카테고리 점수 */}
            {selectedCompatibility.categoryScores && (
              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2">카테고리별 점수</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(selectedCompatibility.categoryScores).map(([key, value]) => (
                    <div key={key} className="bg-gray-700 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">{key}</p>
                      <p className="text-white font-bold">{value}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 클라이언트 정보 */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm">클라이언트 정보</p>
              <p className="text-white text-sm">IP: {selectedCompatibility.clientIp || '-'}</p>
              <p className="text-white text-sm font-mono text-xs break-all">
                FP: {selectedCompatibility.clientFingerprint || '-'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">공유 코드</p>
                <p className="text-white font-mono">{selectedCompatibility.shareCode}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">생성일</p>
                <p className="text-white text-sm">{formatDate(selectedCompatibility.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 사용자 이력 모달 */}
      {userHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setUserHistoryModal(null)} />
          <div className="relative w-full max-w-lg bg-gray-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setUserHistoryModal(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white mb-2">사용자 이용 내역</h2>
            <p className="text-gray-400 text-sm mb-4">
              {userHistoryModal.type === 'ip' ? 'IP' : 'Fingerprint'}: {userHistoryModal.value}
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">
                  한 사람 관상 ({userHistoryModal.single.length}회)
                </h3>
                {userHistoryModal.single.length > 0 ? (
                  <div className="space-y-2">
                    {userHistoryModal.single.map((item) => (
                      <div key={item.id} className="bg-gray-700 rounded-lg p-3 flex justify-between">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            item.gender === 'male' ? 'bg-blue-600/20 text-blue-400' : 'bg-pink-600/20 text-pink-400'
                          }`}>
                            {item.gender === 'male' ? '남' : '여'}
                          </span>
                          <span className="text-white ml-2">{item.score}점</span>
                        </div>
                        <span className="text-gray-400 text-sm">{formatDate(item.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">이용 내역 없음</p>
                )}
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">
                  두 사람 궁합 ({userHistoryModal.compatibility.length}회)
                </h3>
                {userHistoryModal.compatibility.length > 0 ? (
                  <div className="space-y-2">
                    {userHistoryModal.compatibility.map((item) => (
                      <div key={item.id} className="bg-gray-700 rounded-lg p-3 flex justify-between">
                        <span className="text-pink-400">{item.compatibilityScore}%</span>
                        <span className="text-gray-400 text-sm">{formatDate(item.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">이용 내역 없음</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
