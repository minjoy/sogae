import { NextRequest, NextResponse } from 'next/server'
import { getFaceAnalysisByShareCode } from '@/lib/face-analysis-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code || code.length < 6) {
      return NextResponse.json(
        { error: '유효하지 않은 공유 코드입니다.' },
        { status: 400 }
      )
    }

    const result = await getFaceAnalysisByShareCode(code)

    if (!result) {
      return NextResponse.json(
        { error: '결과를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미지 만료 여부 확인
    const isImageExpired = new Date(result.expiresAt) < new Date()

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        isImageExpired,
        // 만료된 경우 이미지 데이터 제거
        imageData: isImageExpired ? null : result.imageData,
        landmarks: isImageExpired ? null : result.landmarks,
      },
    })
  } catch (error) {
    console.error('Face analysis fetch error:', error)
    return NextResponse.json(
      { error: '결과 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
