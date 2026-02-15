import { NextRequest, NextResponse } from 'next/server'
import { getFaceAnalysisByShareCode } from '@/lib/face-analysis-db'

/**
 * 관상 분석 이미지 프록시 - CORS 우회용
 * 클라이언트 Canvas에서 CDN 이미지를 사용할 수 있도록 프록시
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code || code.length < 6) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 })
  }

  const result = await getFaceAnalysisByShareCode(code)
  if (!result || !result.imageData) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }

  const isExpired = new Date(result.expiresAt) < new Date()
  if (isExpired) {
    return NextResponse.json({ error: 'Image expired' }, { status: 410 })
  }

  const imageData = result.imageData

  // base64 data URL인 경우
  if (imageData.startsWith('data:')) {
    const matches = imageData.match(/^data:([^;]+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 500 })
    }
    const buffer = Buffer.from(matches[2], 'base64')
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': matches[1],
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  // CDN URL인 경우 서버에서 fetch하여 프록시
  if (imageData.startsWith('http')) {
    try {
      const res = await fetch(imageData)
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 })
      }
      const buffer = await res.arrayBuffer()
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      })
    } catch {
      return NextResponse.json({ error: 'Image fetch failed' }, { status: 502 })
    }
  }

  return NextResponse.json({ error: 'Unknown image format' }, { status: 500 })
}
