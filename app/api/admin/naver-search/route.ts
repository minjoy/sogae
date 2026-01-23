import { NextRequest, NextResponse } from 'next/server';

// Next.js API 캐싱 비활성화
export const dynamic = 'force-dynamic';

const NAVER_CLIENT_ID = 'sr5mXs64vBDaCu0e9lHq';
const NAVER_CLIENT_SECRET = 'jP25Af2Xmu';

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

// GET: 네이버 지역 검색 API
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '두쫀쿠';
    const requestedCount = parseInt(searchParams.get('display') || '10');

    // 네이버 지역검색 API는 한 번에 최대 5개만 반환
    // 페이지네이션으로 여러 번 호출하여 요청된 개수만큼 가져옴
    const NAVER_MAX_PER_REQUEST = 5;
    const maxIterations = Math.ceil(requestedCount / NAVER_MAX_PER_REQUEST);
    const allStores: NonNullable<ReturnType<typeof transformNaverItem>>[] = [];
    const seenKeys = new Set<string>(); // 중복 방지용
    let totalCount = 0;
    let actualIterations = 0; // 디버깅용
    let firstApiResponse: NaverSearchResponse | null = null; // 첫 API 응답 저장

    for (let i = 0; i < maxIterations; i++) {
      actualIterations++;
      const start = i * NAVER_MAX_PER_REQUEST + 1;

      // start가 1000을 넘으면 네이버 API 제한으로 중단
      if (start > 1000) {
        break;
      }

      // sort=comment (정확도순) 사용
      const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=${NAVER_MAX_PER_REQUEST}&start=${start}&sort=comment`;

      const response = await fetch(url, {
        headers: {
          'X-Naver-Client-Id': NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
        },
      });

      if (!response.ok) {
        // 첫 번째 요청이 실패하면 에러 반환
        if (i === 0) {
          const errorText = await response.text();
          console.error('Naver API error:', response.status, errorText);
          return NextResponse.json(
            { error: `네이버 API 오류: ${response.status}` },
            { status: response.status }
          );
        }
        // 이후 요청이 실패하면 현재까지 수집된 결과 반환
        break;
      }

      const data: NaverSearchResponse = await response.json();

      // 첫 요청에서 총 개수 저장 및 raw 응답 저장
      if (i === 0) {
        totalCount = data.total;
        firstApiResponse = data;
      }

      // 더 이상 결과가 없으면 중단
      if (data.items.length === 0) {
        break;
      }

      // HTML 태그 제거 및 좌표 변환
      for (const item of data.items) {
        const store = transformNaverItem(item);
        if (store) {
          // 중복 체크 (같은 좌표의 매장은 제외)
          const key = `${store.lat.toFixed(6)}-${store.lng.toFixed(6)}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            allStores.push(store);
          }
        }

        // 요청된 개수에 도달하면 중단
        if (allStores.length >= requestedCount) {
          break;
        }
      }

      // 요청된 개수에 도달했거나 더 이상 결과가 없으면 중단
      if (allStores.length >= requestedCount || data.items.length < NAVER_MAX_PER_REQUEST) {
        break;
      }

      // API 호출 간 딜레이 (rate limiting 방지)
      if (i < maxIterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return NextResponse.json({
      success: true,
      query,
      total: totalCount,
      stores: allStores.slice(0, requestedCount),
      // 디버깅 정보
      debug: {
        requestedCount,
        maxIterations,
        actualIterations,
        collectedCount: allStores.length,
        naverApiFirstResponse: firstApiResponse ? {
          total: firstApiResponse.total,
          start: firstApiResponse.start,
          display: firstApiResponse.display,
          itemsCount: firstApiResponse.items.length,
        } : null,
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
