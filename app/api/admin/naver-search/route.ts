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
    const stores = data.items.map((item) => {
      // 네이버 좌표를 WGS84로 변환 (카텍 -> WGS84)
      // 네이버 mapx, mapy는 카텍 좌표계 (KATEC)
      const katecX = parseInt(item.mapx);
      const katecY = parseInt(item.mapy);

      // 간단한 변환 공식 (정확도는 떨어지지만 대략적 위치 파악용)
      // 더 정확한 변환을 위해서는 proj4 라이브러리 사용 권장
      const { lat, lng } = katecToWgs84(katecX, katecY);

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
    });

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

// 카텍(KATEC) 좌표를 WGS84 (위도/경도)로 변환
// 네이버 지역검색 API의 mapx, mapy는 카텍 좌표계 사용
function katecToWgs84(x: number, y: number): { lat: number; lng: number } {
  // 카텍 좌표는 미터 단위의 정수로 표현됨
  // 네이버 API에서 반환하는 값은 실제 카텍 좌표 * 10 형태
  const katecX = x / 10;
  const katecY = y / 10;

  // 카텍 -> WGS84 변환 (근사 공식)
  // 참고: 정확한 변환을 위해서는 proj4js 라이브러리 사용 권장
  const KATEC_ORIGIN_LAT = 38.0;
  const KATEC_ORIGIN_LNG = 128.0;
  const KATEC_SCALE = 0.9999;

  // 근사 변환 (대략적인 위치 확인용)
  // TM 좌표계 기반 근사 변환
  const lng = KATEC_ORIGIN_LNG + (katecX - 400000) / (111319.49079 * Math.cos(36 * Math.PI / 180) * KATEC_SCALE);
  const lat = KATEC_ORIGIN_LAT + (katecY - 500000) / (111319.49079 * KATEC_SCALE) - 2.05;

  return {
    lat: Math.round(lat * 1000000) / 1000000,
    lng: Math.round(lng * 1000000) / 1000000,
  };
}
