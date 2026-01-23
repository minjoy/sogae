import { NextRequest, NextResponse } from 'next/server';

// Next.js API 캐싱 비활성화
export const dynamic = 'force-dynamic';

const NAVER_CLIENT_ID = 'sr5mXs64vBDaCu0e9lHq';
const NAVER_CLIENT_SECRET = 'jP25Af2Xmu';

// 네이버 지역검색 API: 한 번에 최대 5개 반환
const NAVER_MAX_DISPLAY = 5;

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
  const mapxNum = parseInt(item.mapx);
  const mapyNum = parseInt(item.mapy);

  if (isNaN(mapxNum) || isNaN(mapyNum) || mapxNum === 0 || mapyNum === 0) {
    return null;
  }

  const lng = mapxNum / 10000000;
  const lat = mapyNum / 10000000;

  if (lat < 33 || lat > 43 || lng < 124 || lng > 132) {
    return null;
  }

  return {
    name: item.title.replace(/<[^>]*>/g, ''),
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

// GET: 네이버 지역 검색 API (페이지네이션으로 요청 개수만큼 수집)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '두쫀쿠';
    const requestedCount = parseInt(searchParams.get('display') || '5');

    const allStores: NonNullable<ReturnType<typeof transformNaverItem>>[] = [];
    const seenKeys = new Set<string>();
    let totalCount = 0;
    let apiCallCount = 0;

    // 페이지네이션으로 요청 개수만큼 수집 (start 1~1000 범위)
    const maxIterations = Math.ceil(requestedCount / NAVER_MAX_DISPLAY);

    for (let i = 0; i < maxIterations; i++) {
      const start = i * NAVER_MAX_DISPLAY + 1;

      // start가 1000 초과하면 중단
      if (start > 1000) break;

      const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=${NAVER_MAX_DISPLAY}&start=${start}&sort=comment`;

      const response = await fetch(url, {
        headers: {
          'X-Naver-Client-Id': NAVER_CLIENT_ID,
          'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
        },
      });

      apiCallCount++;

      if (!response.ok) {
        // 첫 요청 실패시 에러 반환, 이후 요청 실패시 현재까지 결과 반환
        if (i === 0) {
          const errorText = await response.text();
          console.error('Naver API error:', response.status, errorText);
          return NextResponse.json(
            { error: `네이버 API 오류: ${response.status}` },
            { status: response.status }
          );
        }
        break;
      }

      const data: NaverSearchResponse = await response.json();

      if (i === 0) {
        totalCount = data.total;
      }

      // 결과가 없으면 중단
      if (data.items.length === 0) break;

      for (const item of data.items) {
        const store = transformNaverItem(item);
        if (store) {
          const key = `${store.lat.toFixed(6)}-${store.lng.toFixed(6)}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            allStores.push(store);
          }
        }

        if (allStores.length >= requestedCount) break;
      }

      // 요청 개수 충족 또는 더 이상 결과 없으면 중단
      if (allStores.length >= requestedCount || data.items.length < NAVER_MAX_DISPLAY) {
        break;
      }

      // API 호출 간 딜레이
      if (i < maxIterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      success: true,
      query,
      total: totalCount,
      stores: allStores.slice(0, requestedCount),
      apiCallCount,
    });
  } catch (error) {
    console.error('Naver search error:', error);
    return NextResponse.json(
      { error: '네이버 검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
