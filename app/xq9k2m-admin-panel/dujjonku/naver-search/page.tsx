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

// 지역 그룹별 목록 (동 단위)
const REGION_GROUPS = [
  {
    label: '전체',
    regions: [
      { value: '', label: '전체 지역' },
    ],
  },
  {
    label: '서울 강남권',
    regions: [
      { value: '역삼동', label: '역삼동' },
      { value: '삼성동', label: '삼성동' },
      { value: '청담동', label: '청담동' },
      { value: '논현동', label: '논현동' },
      { value: '신사동', label: '신사동' },
      { value: '압구정동', label: '압구정동' },
      { value: '대치동', label: '대치동' },
      { value: '도곡동', label: '도곡동' },
      { value: '개포동', label: '개포동' },
      { value: '일원동', label: '일원동' },
      { value: '세곡동', label: '세곡동' },
    ],
  },
  {
    label: '서울 서초권',
    regions: [
      { value: '서초동', label: '서초동' },
      { value: '방배동', label: '방배동' },
      { value: '반포동', label: '반포동' },
      { value: '잠원동', label: '잠원동' },
      { value: '양재동', label: '양재동' },
      { value: '내곡동', label: '내곡동' },
    ],
  },
  {
    label: '서울 마포/서대문',
    regions: [
      { value: '합정동', label: '합정동' },
      { value: '서교동', label: '서교동(홍대)' },
      { value: '상수동', label: '상수동' },
      { value: '망원동', label: '망원동' },
      { value: '연남동', label: '연남동' },
      { value: '성산동', label: '성산동' },
      { value: '공덕동', label: '공덕동' },
      { value: '마포동', label: '마포동' },
      { value: '신촌동', label: '신촌동' },
      { value: '연희동', label: '연희동' },
    ],
  },
  {
    label: '서울 송파/강동',
    regions: [
      { value: '잠실동', label: '잠실동' },
      { value: '신천동', label: '신천동' },
      { value: '방이동', label: '방이동' },
      { value: '가락동', label: '가락동' },
      { value: '문정동', label: '문정동' },
      { value: '석촌동', label: '석촌동' },
      { value: '천호동', label: '천호동' },
      { value: '길동', label: '길동' },
      { value: '암사동', label: '암사동' },
      { value: '고덕동', label: '고덕동' },
      { value: '강일동', label: '강일동' },
    ],
  },
  {
    label: '서울 용산/성동',
    regions: [
      { value: '이태원동', label: '이태원동' },
      { value: '한남동', label: '한남동' },
      { value: '용산동', label: '용산동' },
      { value: '후암동', label: '후암동' },
      { value: '성수동', label: '성수동' },
      { value: '금호동', label: '금호동' },
      { value: '왕십리동', label: '왕십리동' },
      { value: '행당동', label: '행당동' },
      { value: '옥수동', label: '옥수동' },
    ],
  },
  {
    label: '서울 종로/중구',
    regions: [
      { value: '익선동', label: '익선동' },
      { value: '삼청동', label: '삼청동' },
      { value: '북촌', label: '북촌' },
      { value: '서촌', label: '서촌' },
      { value: '광화문', label: '광화문' },
      { value: '명동', label: '명동' },
      { value: '을지로동', label: '을지로' },
      { value: '충무로', label: '충무로' },
      { value: '회현동', label: '회현동' },
      { value: '동대문', label: '동대문' },
    ],
  },
  {
    label: '서울 영등포/여의도',
    regions: [
      { value: '여의도동', label: '여의도동' },
      { value: '영등포동', label: '영등포동' },
      { value: '당산동', label: '당산동' },
      { value: '문래동', label: '문래동' },
      { value: '신길동', label: '신길동' },
    ],
  },
  {
    label: '서울 광진/동대문',
    regions: [
      { value: '건대입구', label: '건대입구' },
      { value: '자양동', label: '자양동' },
      { value: '화양동', label: '화양동' },
      { value: '구의동', label: '구의동' },
      { value: '회기동', label: '회기동' },
      { value: '청량리동', label: '청량리동' },
      { value: '장안동', label: '장안동' },
    ],
  },
  {
    label: '서울 강서/양천',
    regions: [
      { value: '마곡동', label: '마곡동' },
      { value: '화곡동', label: '화곡동' },
      { value: '등촌동', label: '등촌동' },
      { value: '발산동', label: '발산동' },
      { value: '목동', label: '목동' },
      { value: '신정동', label: '신정동' },
    ],
  },
  {
    label: '서울 동작/관악',
    regions: [
      { value: '사당동', label: '사당동' },
      { value: '흑석동', label: '흑석동' },
      { value: '노량진동', label: '노량진동' },
      { value: '신림동', label: '신림동' },
      { value: '봉천동', label: '봉천동' },
      { value: '낙성대동', label: '낙성대' },
    ],
  },
  {
    label: '서울 노원/도봉/강북',
    regions: [
      { value: '공릉동', label: '공릉동' },
      { value: '상계동', label: '상계동' },
      { value: '중계동', label: '중계동' },
      { value: '월계동', label: '월계동' },
      { value: '창동', label: '창동' },
      { value: '쌍문동', label: '쌍문동' },
      { value: '미아동', label: '미아동' },
      { value: '수유동', label: '수유동' },
    ],
  },
  {
    label: '경기 성남',
    regions: [
      { value: '정자동', label: '정자동(분당)' },
      { value: '서현동', label: '서현동' },
      { value: '수내동', label: '수내동' },
      { value: '판교동', label: '판교동' },
      { value: '야탑동', label: '야탑동' },
      { value: '이매동', label: '이매동' },
      { value: '삼평동', label: '삼평동' },
      { value: '백현동', label: '백현동(판교)' },
      { value: '운중동', label: '운중동' },
    ],
  },
  {
    label: '경기 수원/용인',
    regions: [
      { value: '광교동', label: '광교동' },
      { value: '영통동', label: '영통동' },
      { value: '인계동', label: '인계동' },
      { value: '권선동', label: '권선동' },
      { value: '매탄동', label: '매탄동' },
      { value: '죽전동', label: '죽전동' },
      { value: '동천동', label: '동천동' },
      { value: '보정동', label: '보정동' },
      { value: '기흥동', label: '기흥동' },
    ],
  },
  {
    label: '경기 고양/파주',
    regions: [
      { value: '일산동', label: '일산동' },
      { value: '마두동', label: '마두동' },
      { value: '정발산동', label: '정발산동' },
      { value: '백석동', label: '백석동' },
      { value: '화정동', label: '화정동' },
      { value: '행신동', label: '행신동' },
      { value: '운정동', label: '운정동(파주)' },
    ],
  },
  {
    label: '경기 화성/하남/김포',
    regions: [
      { value: '동탄', label: '동탄' },
      { value: '병점동', label: '병점동' },
      { value: '봉담읍', label: '봉담읍' },
      { value: '미사동', label: '미사동(하남)' },
      { value: '풍산동', label: '풍산동' },
      { value: '감일동', label: '감일동' },
      { value: '장기동', label: '장기동(김포)' },
      { value: '구래동', label: '구래동' },
      { value: '풍무동', label: '풍무동' },
    ],
  },
  {
    label: '경기 안양/군포/의왕',
    regions: [
      { value: '평촌동', label: '평촌동' },
      { value: '범계동', label: '범계동' },
      { value: '호계동', label: '호계동' },
      { value: '산본동', label: '산본동' },
      { value: '금정동', label: '금정동' },
      { value: '내손동', label: '내손동' },
    ],
  },
  {
    label: '인천',
    regions: [
      { value: '송도동', label: '송도동' },
      { value: '청라동', label: '청라동' },
      { value: '부평동', label: '부평동' },
      { value: '구월동', label: '구월동' },
      { value: '연수동', label: '연수동' },
      { value: '간석동', label: '간석동' },
      { value: '작전동', label: '작전동' },
      { value: '계양동', label: '계양동' },
    ],
  },
  {
    label: '부산',
    regions: [
      { value: '해운대동', label: '해운대동' },
      { value: '중동 부산', label: '중동(해운대)' },
      { value: '좌동', label: '좌동' },
      { value: '부전동', label: '부전동(서면)' },
      { value: '전포동', label: '전포동' },
      { value: '광안동', label: '광안동' },
      { value: '민락동', label: '민락동' },
      { value: '남천동', label: '남천동' },
      { value: '센텀시티', label: '센텀시티' },
      { value: '수영동', label: '수영동' },
      { value: '동래동', label: '동래동' },
      { value: '연산동', label: '연산동' },
    ],
  },
  {
    label: '대구',
    regions: [
      { value: '동성로', label: '동성로' },
      { value: '수성동', label: '수성동' },
      { value: '범어동', label: '범어동' },
      { value: '황금동', label: '황금동' },
      { value: '만촌동', label: '만촌동' },
      { value: '죽전동 대구', label: '죽전동' },
      { value: '상인동', label: '상인동' },
      { value: '월성동', label: '월성동' },
    ],
  },
  {
    label: '대전',
    regions: [
      { value: '둔산동', label: '둔산동' },
      { value: '봉명동', label: '봉명동' },
      { value: '궁동', label: '궁동' },
      { value: '도안동', label: '도안동' },
      { value: '노은동', label: '노은동' },
      { value: '관저동', label: '관저동' },
      { value: '유성구', label: '유성구' },
      { value: '서구 대전', label: '서구' },
    ],
  },
  {
    label: '광주',
    regions: [
      { value: '상무지구', label: '상무지구' },
      { value: '충장로', label: '충장로' },
      { value: '봉선동', label: '봉선동' },
      { value: '수완동', label: '수완동' },
      { value: '첨단동', label: '첨단동' },
      { value: '풍암동', label: '풍암동' },
      { value: '동구 광주', label: '동구' },
      { value: '서구 광주', label: '서구' },
    ],
  },
  {
    label: '울산/창원',
    regions: [
      { value: '삼산동 울산', label: '삼산동(울산)' },
      { value: '성남동 울산', label: '성남동(울산)' },
      { value: '남구 울산', label: '남구(울산)' },
      { value: '상남동', label: '상남동(창원)' },
      { value: '중앙동 창원', label: '중앙동(창원)' },
      { value: '성산구', label: '성산구' },
    ],
  },
  {
    label: '제주',
    regions: [
      { value: '연동', label: '연동' },
      { value: '노형동', label: '노형동' },
      { value: '애월읍', label: '애월읍' },
      { value: '협재리', label: '협재리' },
      { value: '함덕리', label: '함덕리' },
      { value: '중문동', label: '중문동' },
      { value: '서귀포시', label: '서귀포시' },
      { value: '제주시', label: '제주시 전체' },
    ],
  },
  {
    label: '기타 지방 (시/군)',
    regions: [
      { value: '전주시', label: '전주' },
      { value: '청주시', label: '청주' },
      { value: '천안시', label: '천안' },
      { value: '포항시', label: '포항' },
      { value: '김해시', label: '김해' },
      { value: '춘천시', label: '춘천' },
      { value: '원주시', label: '원주' },
      { value: '강릉시', label: '강릉' },
      { value: '속초시', label: '속초' },
      { value: '여수시', label: '여수' },
      { value: '순천시', label: '순천' },
      { value: '경주시', label: '경주' },
      { value: '안동시', label: '안동' },
      { value: '목포시', label: '목포' },
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
