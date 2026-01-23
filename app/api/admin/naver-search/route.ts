import { NextRequest, NextResponse } from 'next/server';

// Next.js API 캐싱 비활성화
export const dynamic = 'force-dynamic';

const NAVER_CLIENT_ID = 'sr5mXs64vBDaCu0e9lHq';
const NAVER_CLIENT_SECRET = 'jP25Af2Xmu';

// 네이버 지역검색 API 제한: display 최대 5, start 최대 1 (페이지네이션 불가)
// 더 많은 결과를 위해 지역별 분할 검색 사용
const NAVER_MAX_DISPLAY = 5;

// 지역별 분할 검색을 위한 지역 목록 (서울 중심 + 주요 도시)
const SEARCH_REGIONS = [
  '', // 기본 검색 (지역 없음)
  '서울',
  '서울 강남',
  '서울 홍대',
  '서울 성수',
  '서울 잠실',
  '서울 명동',
  '서울 이태원',
  '서울 여의도',
  '서울 신촌',
  '서울 건대',
  '서울 압구정',
  '서울 청담',
  '서울 삼성',
  '서울 송파',
  '서울 마포',
  '서울 종로',
  '서울 신사',
  '서울 가로수길',
  '경기 분당',
  '경기 판교',
  '경기 수원',
  '경기 일산',
  '경기 용인',
  '인천',
  '부산',
  '부산 해운대',
  '부산 서면',
  '대구',
  '대전',
  '광주',
  '제주',
  '제주 애월',
];

interface NaverLocalItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

interface NaverSearchResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverLocalItem[];
}

// 아이템을 변환하는 헬퍼 함수
function transformNaverItem(item: NaverLocalItem) {
  // 네이버 지역검색 API의 mapx, mapy는 WGS84 좌표 * 10000000 형태
  // 예: mapx=1269876543 -> 경도 126.9876543
  const mapxNum = parseInt(item.mapx);
  const mapyNum = parseInt(item.mapy);

  // 좌표가 유효하지 않으면 null 반환
  if (isNaN(mapxNum) || isNaN(mapyNum) || mapxNum === 0 || mapyNum === 0) {
    return null;
  }

  const lng = mapxNum / 10000000;
  const lat = mapyNum / 10000000;

  // 대한민국 좌표 범위 검증 (대략적인 범위)
  if (lat < 33 || lat > 43 || lng < 124 || lng > 132) {
    return null;
  }

  return {
    name: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
    category: item.category,
    description: item.description,
    phone: item.telephone,
    address: item.roadAddress || item.address,
    link: item.link,
    lat,
    lng,
    mapx: item.mapx,
    mapy: item.mapy,
  };
}

// 단일 검색어로 네이버 API 호출
async function searchNaver(query: string): Promise<{
  items: NaverLocalItem[];
  total: number;
  error?: string;
}> {
  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=${NAVER_MAX_DISPLAY}&start=1&sort=comment`;

  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Naver API error:', response.status, errorText);
    return { items: [], total: 0, error: `네이버 API 오류: ${response.status}` };
  }

  const data: NaverSearchResponse = await response.json();
  return { items: data.items, total: data.total };
}

// GET: 네이버 지역 검색 API
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const baseQuery = searchParams.get('query') || '두쫀쿠';
    const requestedCount = parseInt(searchParams.get('display') || '10');

    const allStores: NonNullable<ReturnType<typeof transformNaverItem>>[] = [];
    const seenKeys = new Set<string>(); // 중복 방지용 (좌표 기반)
    const seenNames = new Set<string>(); // 중복 방지용 (이름+주소 기반)
    let totalCount = 0;
    let searchedRegions: string[] = [];
    let apiCallCount = 0;

    // 검색어에서 지역 정보 추출 (예: "두바이 서울 강남" -> baseKeyword="두바이", userRegion="서울 강남")
    const queryParts = baseQuery.split(' ');
    let baseKeyword = baseQuery;
    let userRegion = '';

    // SEARCH_REGIONS에 포함된 지역명이 검색어에 있는지 확인
    for (const region of SEARCH_REGIONS) {
      if (region && baseQuery.includes(region)) {
        userRegion = region;
        baseKeyword = baseQuery.replace(region, '').trim();
        break;
      }
    }

    // 5개 이하 요청이면 단순 검색
    if (requestedCount <= NAVER_MAX_DISPLAY) {
      const result = await searchNaver(baseQuery);
      apiCallCount++;

      if (result.error && apiCallCount === 1) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      totalCount = result.total;
      searchedRegions.push(userRegion || '전체');

      for (const item of result.items) {
        const store = transformNaverItem(item);
        if (store) {
          const coordKey = `${store.lat.toFixed(6)}-${store.lng.toFixed(6)}`;
          const nameKey = `${store.name}-${store.address}`;
          if (!seenKeys.has(coordKey) && !seenNames.has(nameKey)) {
            seenKeys.add(coordKey);
            seenNames.add(nameKey);
            allStores.push(store);
          }
        }
      }
    } else {
      // 5개 초과 요청: 지역별 분할 검색
      // 사용자가 특정 지역을 선택한 경우, 해당 지역 관련 검색을 우선
      let regionsToSearch: string[] = [];

      if (userRegion) {
        // 사용자가 지역을 선택한 경우, 해당 지역 + 관련 세부 지역
        regionsToSearch = SEARCH_REGIONS.filter(r =>
          r === '' || r === userRegion || r.startsWith(userRegion.split(' ')[0])
        );
      } else {
        // 지역 선택 없으면 전체 지역 검색
        regionsToSearch = [...SEARCH_REGIONS];
      }

      // 필요한 API 호출 수 계산 (각 지역당 최대 5개)
      const maxRegions = Math.min(
        Math.ceil(requestedCount / NAVER_MAX_DISPLAY) + 5, // 중복 고려해 여유 있게
        regionsToSearch.length
      );

      for (let i = 0; i < maxRegions && allStores.length < requestedCount; i++) {
        const region = regionsToSearch[i];
        const searchQuery = region ? `${baseKeyword} ${region}` : baseKeyword;

        const result = await searchNaver(searchQuery);
        apiCallCount++;

        if (result.error) {
          console.error(`Region search failed for "${region}":`, result.error);
          continue;
        }

        // 첫 번째 성공한 검색에서 총 개수 저장
        if (totalCount === 0) {
          totalCount = result.total;
        }

        searchedRegions.push(region || '전체');

        for (const item of result.items) {
          const store = transformNaverItem(item);
          if (store) {
            // 중복 체크 (좌표 + 이름/주소)
            const coordKey = `${store.lat.toFixed(6)}-${store.lng.toFixed(6)}`;
            const nameKey = `${store.name}-${store.address}`;

            if (!seenKeys.has(coordKey) && !seenNames.has(nameKey)) {
              seenKeys.add(coordKey);
              seenNames.add(nameKey);
              allStores.push(store);
            }
          }

          if (allStores.length >= requestedCount) {
            break;
          }
        }

        // API 호출 간 딜레이 (rate limiting 방지)
        if (i < maxRegions - 1 && allStores.length < requestedCount) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
    }

    return NextResponse.json({
      success: true,
      query: baseQuery,
      total: totalCount,
      stores: allStores.slice(0, requestedCount),
      // 디버깅 정보
      debug: {
        requestedCount,
        collectedCount: allStores.length,
        apiCallCount,
        searchedRegions,
        baseKeyword,
        userRegion: userRegion || null,
      },
    });
  } catch (error) {
    console.error('Naver search error:', error);
    return NextResponse.json(
      { error: '네이버 검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
