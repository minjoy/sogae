import { NextRequest, NextResponse } from 'next/server';

// GET: URL에서 OG 이미지 추출
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL이 필요합니다' },
        { status: 400 }
      );
    }

    // URL 유효성 검사
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: '유효하지 않은 URL입니다' },
        { status: 400 }
      );
    }

    // 페이지 HTML 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Sogae/1.0; +https://sogae.co.kr)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(5000), // 5초 타임아웃
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '페이지를 가져올 수 없습니다' },
        { status: 400 }
      );
    }

    const html = await response.text();

    // OG 이미지 추출 (og:image 메타 태그)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    // OG 제목 추출
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);

    // OG 설명 추출
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);

    // Twitter 카드 이미지 (fallback)
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

    const ogImage = ogImageMatch?.[1] || twitterImageMatch?.[1] || null;
    const ogTitle = ogTitleMatch?.[1] || null;
    const ogDescription = ogDescMatch?.[1] || null;

    // 상대 경로인 경우 절대 경로로 변환
    let absoluteOgImage = ogImage;
    if (ogImage && !ogImage.startsWith('http')) {
      const urlObj = new URL(url);
      if (ogImage.startsWith('//')) {
        absoluteOgImage = `${urlObj.protocol}${ogImage}`;
      } else if (ogImage.startsWith('/')) {
        absoluteOgImage = `${urlObj.origin}${ogImage}`;
      } else {
        absoluteOgImage = `${urlObj.origin}/${ogImage}`;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ogImage: absoluteOgImage,
        ogTitle,
        ogDescription,
        url,
      },
    });
  } catch (error) {
    console.error('OG image fetch error:', error);
    return NextResponse.json(
      { error: 'OG 이미지를 가져오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
