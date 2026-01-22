import { NextRequest, NextResponse } from 'next/server';

// HTML 엔티티 디코딩
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// OG 이미지 추출 함수
function extractOgImage(html: string): string | null {
  // 다양한 형태의 og:image 메타 태그 매칭
  const patterns = [
    // <meta property="og:image" content="...">
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    // <meta content="..." property="og:image">
    /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    // <meta id="og:image" property="og:image" content="..."> (네이버 형식)
    /<meta[^>]*id=["']og:image["'][^>]*content=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1]);
    }
  }

  return null;
}

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: '페이지를 가져올 수 없습니다' },
        { status: 400 }
      );
    }

    const html = await response.text();

    // OG 이미지 추출
    const ogImage = extractOgImage(html);

    // Twitter 카드 이미지 (fallback)
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

    // OG 제목 추출
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);

    // OG 설명 추출
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);

    const finalOgImage = ogImage || (twitterImageMatch?.[1] ? decodeHtmlEntities(twitterImageMatch[1]) : null);
    const ogTitle = ogTitleMatch?.[1] ? decodeHtmlEntities(ogTitleMatch[1]) : null;
    const ogDescription = ogDescMatch?.[1] ? decodeHtmlEntities(ogDescMatch[1]) : null;

    // 상대 경로인 경우 절대 경로로 변환
    let absoluteOgImage = finalOgImage;
    if (finalOgImage && !finalOgImage.startsWith('http')) {
      const urlObj = new URL(url);
      if (finalOgImage.startsWith('//')) {
        absoluteOgImage = `${urlObj.protocol}${finalOgImage}`;
      } else if (finalOgImage.startsWith('/')) {
        absoluteOgImage = `${urlObj.origin}${finalOgImage}`;
      } else {
        absoluteOgImage = `${urlObj.origin}/${finalOgImage}`;
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
