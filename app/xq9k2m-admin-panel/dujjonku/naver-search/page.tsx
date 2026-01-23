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

// 지역 그룹별 목록
const REGION_GROUPS = [
  {
    label: '서울 상권',
    regions: [
      { value: '', label: '전체' },
      { value: '강남역', label: '강남역' },
      { value: '홍대', label: '홍대' },
      { value: '성수동', label: '성수동' },
      { value: '잠실', label: '잠실' },
      { value: '명동', label: '명동' },
      { value: '이태원', label: '이태원' },
      { value: '여의도', label: '여의도' },
      { value: '신촌', label: '신촌' },
      { value: '건대입구', label: '건대입구' },
      { value: '압구정', label: '압구정' },
      { value: '청담', label: '청담' },
      { value: '가로수길', label: '가로수길' },
      { value: '합정', label: '합정' },
      { value: '망원', label: '망원' },
      { value: '연남동', label: '연남동' },
      { value: '한남동', label: '한남동' },
      { value: '을지로', label: '을지로' },
      { value: '익선동', label: '익선동' },
      { value: '광화문', label: '광화문' },
      { value: '삼성역', label: '삼성역' },
      { value: '선릉역', label: '선릉역' },
      { value: '역삼역', label: '역삼역' },
      { value: '논현', label: '논현' },
      { value: '서래마을', label: '서래마을' },
    ],
  },
  {
    label: '서울 구',
    regions: [
      { value: '서울 강남구', label: '강남구' },
      { value: '서울 서초구', label: '서초구' },
      { value: '서울 마포구', label: '마포구' },
      { value: '서울 송파구', label: '송파구' },
      { value: '서울 용산구', label: '용산구' },
      { value: '서울 성동구', label: '성동구' },
      { value: '서울 광진구', label: '광진구' },
      { value: '서울 종로구', label: '종로구' },
      { value: '서울 중구', label: '중구' },
      { value: '서울 영등포구', label: '영등포구' },
      { value: '서울 강서구', label: '강서구' },
      { value: '서울 양천구', label: '양천구' },
      { value: '서울 동작구', label: '동작구' },
      { value: '서울 관악구', label: '관악구' },
      { value: '서울 강동구', label: '강동구' },
      { value: '서울 노원구', label: '노원구' },
    ],
  },
  {
    label: '수도권',
    regions: [
      { value: '분당', label: '분당' },
      { value: '판교', label: '판교' },
      { value: '수원', label: '수원' },
      { value: '일산', label: '일산' },
      { value: '용인', label: '용인' },
      { value: '인천 송도', label: '인천 송도' },
      { value: '인천 부평', label: '인천 부평' },
      { value: '인천', label: '인천 전체' },
      { value: '하남', label: '하남' },
      { value: '김포', label: '김포' },
    ],
  },
  {
    label: '지방',
    regions: [
      { value: '부산 해운대', label: '부산 해운대' },
      { value: '부산 서면', label: '부산 서면' },
      { value: '부산 광안리', label: '부산 광안리' },
      { value: '부산', label: '부산 전체' },
      { value: '대구', label: '대구' },
      { value: '대전', label: '대전' },
      { value: '광주', label: '광주' },
      { value: '제주 애월', label: '제주 애월' },
      { value: '제주 협재', label: '제주 협재' },
      { value: '제주', label: '제주 전체' },
    ],
  },
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
      const response = await fetch(`/api/admin/naver-search?query=${encodeURIComponent(query)}`);
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
          <p className="text-gray-500 text-sm mt-1">
            네이버 지역 검색 API를 통해 매장을 검색하고 등록할 수 있습니다
            <span className="text-xs text-gray-400 ml-2">(API 제한: 검색당 최대 5개)</span>
          </p>
        </div>

        {/* 검색 영역 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* 지역 선택 */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">지역 선택</label>

            {REGION_GROUPS.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="text-xs text-gray-500 mb-1.5">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.regions.map((region) => (
                    <button
                      key={region.value}
                      onClick={() => setSelectedRegion(region.value)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        selectedRegion === region.value
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {region.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {selectedRegion && (
              <p className="text-xs text-green-600 mt-2">
                선택된 지역: <span className="font-semibold">{selectedRegion}</span>
                <button
                  onClick={() => setSelectedRegion('')}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  ✕ 해제
                </button>
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
                    {/* 주소로 검색 버튼 */}
                    <button
                      onClick={() => {
                        const url = `https://map.naver.com/p/search/${encodeURIComponent(store.address)}?c=15.00,0,0,0,dh`;
                        window.open(url, '_blank');
                      }}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 text-center"
                    >
                      주소로 검색
                    </button>
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
