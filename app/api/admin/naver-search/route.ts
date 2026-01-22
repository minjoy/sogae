import { NextRequest, NextResponse } from 'next/server';

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

// GET: 네이버 지역 검색 API
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '두쫀쿠';
    const display = parseInt(searchParams.get('display') || '10');

    const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=${display}&sort=random`;

    const response = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Naver API error:', response.status, errorText);
      return NextResponse.json(
        { error: `네이버 API 오류: ${response.status}` },
        { status: response.status }
      );
    }

    const data: NaverSearchResponse = await response.json();

    // HTML 태그 제거 및 좌표 변환
    const stores = data.items
      .map((item) => {
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
      })
      .filter((store): store is NonNullable<typeof store> => store !== null);

    return NextResponse.json({
      success: true,
      query,
      total: data.total,
      stores,
    });
  } catch (error) {
    console.error('Naver search error:', error);
    return NextResponse.json(
      { error: '네이버 검색 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
