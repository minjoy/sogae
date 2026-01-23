import { NextRequest, NextResponse } from 'next/server';

// Next.js API 캐싱 비활성화
export const dynamic = 'force-dynamic';

const NAVER_CLIENT_ID = 'sr5mXs64vBDaCu0e9lHq';
const NAVER_CLIENT_SECRET = 'jP25Af2Xmu';

// 네이버 지역검색 API 제한: display 최대 5, start 최대 1
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

// GET: 네이버 지역 검색 API (단일 호출, 최대 5개)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '두쫀쿠';

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
      return NextResponse.json(
        { error: `네이버 API 오류: ${response.status}` },
        { status: response.status }
      );
    }

    const data: NaverSearchResponse = await response.json();

    const stores = data.items
      .map(transformNaverItem)
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
