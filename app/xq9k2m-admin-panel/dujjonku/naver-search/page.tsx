'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NaverStore {
  name: string;
  category: string;
  description: string;
  phone: string;
  address: string;
  link: string;
  lat: number;
  lng: number;
  mapx: string;
  mapy: string;
}

const SEARCH_KEYWORDS = ['두바이', '두바이 쫀득 쿠키', '두쫀쿠'];
const ADMIN_KEY = 'sogae-admin-2024';

export default function NaverSearchPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedKeyword, setSelectedKeyword] = useState(SEARCH_KEYWORDS[0]);
  const [customKeyword, setCustomKeyword] = useState('');
  const [stores, setStores] = useState<NaverStore[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [total, setTotal] = useState(0);

  // 세션 확인
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') {
        setIsCheckingAuth(false);
        return;
      }

      const storedData = localStorage.getItem('adminSession');
      if (!storedData) {
        router.push('/xq9k2m-admin-panel');
        return;
      }

      try {
        const { password, expiry } = JSON.parse(storedData);

        if (Date.now() > expiry) {
          localStorage.removeItem('adminSession');
          router.push('/xq9k2m-admin-panel');
          return;
        }

        // 저장된 비밀번호로 인증 확인
        const response = await fetch('/api/admin/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        const data = await response.json();

        if (data.success) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminSession');
          router.push('/xq9k2m-admin-panel');
        }
      } catch {
        localStorage.removeItem('adminSession');
        router.push('/xq9k2m-admin-panel');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  // 네이버 검색 실행
  const handleSearch = async (keyword?: string) => {
    const query = keyword || customKeyword || selectedKeyword;
    if (!query.trim()) {
      alert('검색어를 입력해주세요');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/naver-search?query=${encodeURIComponent(query)}&display=10`);
      const data = await response.json();

      if (data.success) {
        setStores(data.stores);
        setSearchedQuery(data.query);
        setTotal(data.total);
      } else {
        alert(data.error || '검색에 실패했습니다');
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('검색 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 매장 등록
  const handleRegisterStore = async (store: NaverStore) => {
    if (!confirm(`"${store.name}"을(를) 두쫀쿠맵에 등록하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY,
        },
        body: JSON.stringify({
          name: store.name,
          category: 'dujjonku',
          address: store.address,
          lat: store.lat,
          lng: store.lng,
          phone: store.phone || null,
          description: store.description || null,
          storeUrl: store.link || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`"${store.name}" 매장이 등록되었습니다!`);
        // 등록된 매장 표시를 위해 상태 업데이트
        setStores((prev) =>
          prev.map((s) =>
            s.name === store.name && s.address === store.address
              ? { ...s, registered: true } as NaverStore & { registered: boolean }
              : s
          )
        );
      } else {
        alert(data.error || '등록에 실패했습니다');
      }
    } catch (error) {
      console.error('Register error:', error);
      alert('등록 중 오류가 발생했습니다');
    }
  };

  // 인증 확인 중
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">세션 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">관리자 인증이 필요합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <Link href="/xq9k2m-admin-panel/dujjonku" className="text-sm text-gray-500 hover:text-gray-700">
            ← 두쫀쿠맵 관리
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">네이버 검색 결과</h1>
          <p className="text-gray-500 text-sm mt-1">네이버 지역 검색 API를 통해 매장을 검색하고 등록할 수 있습니다</p>
        </div>

        {/* 검색 영역 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">빠른 검색</label>
            <div className="flex flex-wrap gap-2">
              {SEARCH_KEYWORDS.map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => {
                    setSelectedKeyword(keyword);
                    handleSearch(keyword);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedKeyword === keyword && searchedQuery === keyword
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">직접 검색</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="검색어 입력 (예: 두바이 쿠키 강남)"
              />
              <button
                onClick={() => handleSearch()}
                disabled={isLoading}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50"
              >
                {isLoading ? '검색 중...' : '검색'}
              </button>
            </div>
          </div>
        </div>

        {/* 검색 결과 */}
        {searchedQuery && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <p className="text-gray-600">
              &ldquo;<span className="font-bold text-primary-600">{searchedQuery}</span>&rdquo; 검색 결과:{' '}
              <span className="font-bold">{total.toLocaleString()}</span>건 중{' '}
              <span className="font-bold">{stores.length}</span>건 표시
            </p>
          </div>
        )}

        {/* 매장 목록 */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-600">검색 중...</p>
          </div>
        ) : stores.length > 0 ? (
          <div className="space-y-4">
            {stores.map((store, index) => (
              <div
                key={`${store.name}-${store.address}-${index}`}
                className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{store.name}</h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {store.category}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">{store.address}</p>
                    {store.phone && (
                      <p className="text-gray-500 text-sm">
                        <span className="font-medium">전화:</span> {store.phone}
                      </p>
                    )}
                    {store.description && (
                      <p className="text-gray-500 text-sm mt-1">{store.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>위도: {store.lat}</span>
                      <span>경도: {store.lng}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {store.link && (
                      <a
                        href={store.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 text-center"
                      >
                        네이버 보기
                      </a>
                    )}
                    <button
                      onClick={() => handleRegisterStore(store)}
                      className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-200"
                    >
                      매장 등록
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchedQuery ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            검색 결과가 없습니다
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            위 버튼을 클릭하거나 검색어를 입력하여 검색하세요
          </div>
        )}
      </div>
    </div>
  );
}
