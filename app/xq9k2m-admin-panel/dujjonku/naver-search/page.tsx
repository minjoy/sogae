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

// 확장된 타입: UI 상태 포함
interface NaverStoreWithState extends NaverStore {
  price?: string;
  isRegistered?: boolean;
}

const SEARCH_KEYWORDS = ['두바이', '두바이 쫀득 쿠키', '두쫀쿠'];
const ADMIN_KEY = 'sogae-admin-2024';

// 조회 개수 옵션
const DISPLAY_OPTIONS = [5, 10, 20, 30, 50];

// 지역 목록
const REGIONS = [
  { value: '', label: '전체 지역' },
  { value: '서울', label: '서울 전체' },
  { value: '서울 강남', label: '서울 강남' },
  { value: '서울 홍대', label: '서울 홍대' },
  { value: '서울 성수', label: '서울 성수' },
  { value: '서울 잠실', label: '서울 잠실' },
  { value: '서울 명동', label: '서울 명동' },
  { value: '서울 이태원', label: '서울 이태원' },
  { value: '서울 여의도', label: '서울 여의도' },
  { value: '경기 분당', label: '경기 분당' },
  { value: '경기 판교', label: '경기 판교' },
  { value: '경기 수원', label: '경기 수원' },
  { value: '인천', label: '인천' },
  { value: '부산', label: '부산' },
  { value: '대구', label: '대구' },
  { value: '대전', label: '대전' },
  { value: '광주', label: '광주' },
  { value: '제주', label: '제주' },
];

// 가격 포맷팅 헬퍼 (천단위 콤마)
const formatPrice = (value: string | number): string => {
  const numStr = String(value).replace(/[^0-9]/g, '');
  if (!numStr) return '';
  return Number(numStr).toLocaleString('ko-KR');
};

// 숫자만 추출
const extractNumber = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

export default function NaverSearchPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedKeyword, setSelectedKeyword] = useState(SEARCH_KEYWORDS[0]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [displayCount, setDisplayCount] = useState(10);
  const [customKeyword, setCustomKeyword] = useState('');
  const [stores, setStores] = useState<NaverStoreWithState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRegistered, setIsCheckingRegistered] = useState(false);
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

  // 등록된 매장 확인
  const checkRegisteredStores = async (storeList: NaverStoreWithState[]) => {
    if (storeList.length === 0) return storeList;

    setIsCheckingRegistered(true);
    try {
      // 좌표 목록으로 등록 여부 확인
      const coords = storeList.map((s) => ({ lat: s.lat, lng: s.lng }));
      const response = await fetch('/api/admin/stores/check-registered', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY,
        },
        body: JSON.stringify({ coordinates: coords }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.registeredIndices) {
          return storeList.map((store, index) => ({
            ...store,
            isRegistered: data.registeredIndices.includes(index),
          }));
        }
      }
    } catch (error) {
      console.error('Check registered error:', error);
    } finally {
      setIsCheckingRegistered(false);
    }
    return storeList;
  };

  // 네이버 검색 실행
  const handleSearch = async (keyword?: string) => {
    const baseQuery = keyword || customKeyword || selectedKeyword;
    if (!baseQuery.trim()) {
      alert('검색어를 입력해주세요');
      return;
    }

    // 지역이 선택된 경우 검색어에 추가
    const query = selectedRegion ? `${baseQuery} ${selectedRegion}` : baseQuery;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/naver-search?query=${encodeURIComponent(query)}&display=${displayCount}`);
      const data = await response.json();

      if (data.success) {
        // 초기 상태로 stores 설정 (가격 필드 포함)
        const storesWithState: NaverStoreWithState[] = data.stores.map((s: NaverStore) => ({
          ...s,
          price: '',
          isRegistered: false,
        }));

        // 등록 여부 확인
        const checkedStores = await checkRegisteredStores(storesWithState);

        setStores(checkedStores);
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

  // 가격 변경 핸들러
  const handlePriceChange = (index: number, value: string) => {
    const formatted = formatPrice(value);
    setStores((prev) =>
      prev.map((store, i) =>
        i === index ? { ...store, price: formatted } : store
      )
    );
  };

  // 매장 등록
  const handleRegisterStore = async (store: NaverStoreWithState, index: number) => {
    const priceValue = store.price ? extractNumber(store.price) : null;

    if (!confirm(`"${store.name}"을(를) 두쫀쿠맵에 등록하시겠습니까?${priceValue ? `\n가격: ${store.price}원` : ''}`)) {
      return;
    }

    // 패스오더 링크 도메인 패턴들
    const passOrderDomains = ['app.passorder', 'events.passorder', 'xn--100--er5pp93d0icp2n2ic5uttwbs3h6zmqsjc2olyj4na.com'];
    const isPassOrderLink = store.link && passOrderDomains.some(domain => store.link!.includes(domain));
    const storeUrl = isPassOrderLink ? null : (store.link || null);
    const passOrderUrl = isPassOrderLink ? store.link : null;

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
          storeUrl,
          passOrderUrl,
          price: priceValue,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`"${store.name}" 매장이 등록되었습니다!`);
        // 등록된 매장 표시를 위해 상태 업데이트
        setStores((prev) =>
          prev.map((s, i) =>
            i === index ? { ...s, isRegistered: true } : s
          )
        );
      } else {
        console.error('Register failed:', { status: response.status, data, store: { lat: store.lat, lng: store.lng } });
        alert(data.error || '등록에 실패했습니다');
      }
    } catch (error) {
      console.error('Register error:', error);
      alert(`등록 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '네트워크 오류'}`);
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
          {/* 지역 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">지역 선택</label>
            <div className="flex flex-wrap gap-2">
              {REGIONS.slice(0, 10).map((region) => (
                <button
                  key={region.value}
                  onClick={() => setSelectedRegion(region.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedRegion === region.value
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {region.label}
                </button>
              ))}
              <select
                value={REGIONS.slice(10).find((r) => r.value === selectedRegion)?.value || ''}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  REGIONS.slice(10).some((r) => r.value === selectedRegion)
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                <option value="">기타 지역...</option>
                {REGIONS.slice(10).map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
            {selectedRegion && (
              <p className="text-xs text-green-600 mt-1">
                선택된 지역: <span className="font-semibold">{selectedRegion}</span>
              </p>
            )}
          </div>

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
                    selectedKeyword === keyword && searchedQuery.includes(keyword)
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
                placeholder={selectedRegion ? `검색어 입력 (지역: ${selectedRegion})` : '검색어 입력 (예: 두바이 쿠키)'}
              />
              <select
                value={displayCount}
                onChange={(e) => setDisplayCount(Number(e.target.value))}
                className="px-3 py-3 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {DISPLAY_OPTIONS.map((count) => (
                  <option key={count} value={count}>
                    {count}개
                  </option>
                ))}
              </select>
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
              {isCheckingRegistered && (
                <span className="ml-2 text-sm text-gray-400">(등록 여부 확인 중...)</span>
              )}
              {stores.filter((s) => s.isRegistered).length > 0 && (
                <span className="ml-2 text-sm text-green-600">
                  ({stores.filter((s) => s.isRegistered).length}건 등록됨)
                </span>
              )}
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
                className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow ${
                  store.isRegistered ? 'border-2 border-green-300 bg-green-50' : ''
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{store.name}</h3>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {store.category}
                      </span>
                      {store.isRegistered && (
                        <span className="px-2 py-0.5 bg-green-500 text-white rounded text-xs font-semibold">
                          등록됨
                        </span>
                      )}
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
                  <div className="flex flex-col gap-2 min-w-[140px]">
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
                    {!store.isRegistered && (
                      <>
                        {/* 가격 입력 필드 */}
                        <div className="relative">
                          <input
                            type="text"
                            value={store.price || ''}
                            onChange={(e) => handlePriceChange(index, e.target.value)}
                            className="w-full px-3 py-1.5 pr-6 border border-yellow-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-yellow-50"
                            placeholder="가격"
                            inputMode="numeric"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">원</span>
                        </div>
                        <button
                          onClick={() => handleRegisterStore(store, index)}
                          className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
                        >
                          매장 등록
                        </button>
                      </>
                    )}
                    {store.isRegistered && (
                      <div className="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-sm text-center">
                        이미 등록됨
                      </div>
                    )}
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
