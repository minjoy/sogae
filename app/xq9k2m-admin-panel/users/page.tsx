'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/useAdminAuth';

interface User {
  id: string;
  email: string | null;
  nickname: string;
  gender: string | null;
  birthYear: string | null;
  createdAt: string;
  testCount: number;
  cardCount: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { password, isAuthenticated, isLoading: authLoading, error: authError, login, getStoredPassword } = useAdminAuth();
  const [inputPassword, setInputPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // 인증 후 사용자 목록 가져오기
  useEffect(() => {
    if (isAuthenticated && password) {
      fetchUsers(password);
    }
  }, [isAuthenticated, password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(inputPassword);
    if (success) {
      fetchUsers(inputPassword);
    }
  };

  const fetchUsers = async (pwd: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.error || '데이터 로드 실패');
      }
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.nickname || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGenderLabel = (gender: string | null) => {
    if (!gender) return '-';
    return gender === 'male' ? '남성' : gender === 'female' ? '여성' : gender;
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
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-sm w-full">
          <h1 className="text-xl font-bold text-white mb-6 text-center">
            관리자 인증
          </h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              placeholder="비밀번호 입력"
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {(error || authError) && (
              <p className="text-red-400 text-sm mb-4 text-center">{error || authError}</p>
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
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/xq9k2m-admin-panel')}
              className="text-gray-400 hover:text-white"
            >
              ← 대시보드
            </button>
            <h1 className="text-2xl font-bold text-white">회원 목록</h1>
            <span className="text-gray-400">({users.length}명)</span>
          </div>
        </div>

        {/* 검색 */}
        <div className="mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="이메일 또는 닉네임 검색..."
            className="w-full max-w-md px-4 py-3 bg-gray-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 회원 테이블 */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                    닉네임
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                    이메일
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                    성별
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                    출생연도
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                    테스트
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                    카드
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                    가입일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 text-white font-medium">
                      {user.nickname}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-sm">
                      {user.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300 text-sm">
                      {getGenderLabel(user.gender)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-300 text-sm">
                      {user.birthYear || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-sm">
                        {user.testCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-lg text-sm">
                        {user.cardCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? '검색 결과가 없습니다' : '회원이 없습니다'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
