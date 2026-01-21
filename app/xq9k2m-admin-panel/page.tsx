'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  totalUsers: number;
  totalTests: number;
  totalCards: number;
  recentUsers: number;
  testStats: { type: number; name: string; count: number }[];
  readinessStats: { label: string; count: number }[];
  updatedAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setStats(data.stats);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('adminPassword', password);
        }
      } else {
        setError(data.error || '인증 실패');
      }
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch {
      console.error('Failed to refresh stats');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full">
          <h1 className="text-xl font-bold text-white mb-6 text-center">
            관리자 인증
          </h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {error && (
              <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '확인 중...' : '접속'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">관리자 대시보드</h1>
          <button
            onClick={refreshStats}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '로딩...' : '새로고침'}
          </button>
        </div>

        {stats && (
          <>
            {/* 주요 지표 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="총 회원 수"
                value={stats.totalUsers}
                icon="👥"
                onClick={() => router.push('/xq9k2m-admin-panel/users')}
              />
              <StatCard title="총 테스트 수" value={stats.totalTests} icon="📝" />
              <StatCard title="생성된 카드" value={stats.totalCards} icon="🎴" />
              <StatCard title="최근 7일 가입" value={stats.recentUsers} icon="🆕" />
            </div>

            {/* 두쫀쿠맵 관리 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div
                className="bg-gray-800 rounded-xl p-6 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => router.push('/xq9k2m-admin-panel/dujjonku')}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🍪</div>
                  <div>
                    <h3 className="text-lg font-bold text-white">두쫀쿠맵 관리</h3>
                    <p className="text-gray-400 text-sm">매장 등록/수정 요청 관리</p>
                  </div>
                </div>
                <p className="text-xs text-blue-400 mt-3">클릭하여 관리하기 →</p>
              </div>
            </div>

            {/* 테스트별 통계 */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-4">테스트별 완료 횟수</h2>
              <div className="space-y-3">
                {stats.testStats.map((test) => (
                  <div key={test.type} className="flex items-center justify-between">
                    <span className="text-gray-300">{test.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${Math.min((test.count / stats.totalTests) * 100 * 5, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-semibold w-12 text-right">
                        {test.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 연애 준비도 분포 */}
            <div className="bg-gray-800 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-4">연애 준비도 분포</h2>
              <div className="space-y-3">
                {stats.readinessStats.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-gray-300">{item.label}</span>
                    <span className="text-white font-semibold">{item.count}명</span>
                  </div>
                ))}
                {stats.readinessStats.length === 0 && (
                  <p className="text-gray-500">데이터 없음</p>
                )}
              </div>
            </div>

            {/* 마지막 업데이트 */}
            <p className="text-gray-500 text-sm text-center">
              마지막 업데이트: {new Date(stats.updatedAt).toLocaleString('ko-KR')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  onClick,
}: {
  title: string;
  value: number;
  icon: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`bg-gray-800 rounded-xl p-4 ${onClick ? 'cursor-pointer hover:bg-gray-700 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      {onClick && <p className="text-xs text-blue-400 mt-1">클릭하여 상세보기 →</p>}
    </div>
  );
}
