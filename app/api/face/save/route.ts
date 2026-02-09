import { NextRequest, NextResponse } from 'next/server'
import { saveFaceAnalysis } from '@/lib/face-analysis-db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      score,
      gender,
      categories,
      analysis,
      landmarks,
      imageWidth,
      imageHeight,
      imageData,
      panAngle,
      tiltAngle,
      rollAngle,
    } = body

    // 필수 필드 검증
    if (typeof score !== 'number' || !gender || !categories || !analysis) {
      return NextResponse.json(
        { error: '필수 데이터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 카테고리 검증
    if (
      typeof categories.r1 !== 'number' ||
      typeof categories.r2 !== 'number' ||
      typeof categories.r3 !== 'number' ||
      typeof categories.r4 !== 'number'
    ) {
      return NextResponse.json(
        { error: '카테고리 점수가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    const result = await saveFaceAnalysis({
      score,
      gender,
      categories,
      analysis,
      landmarks,
      imageWidth,
      imageHeight,
      imageData,
      panAngle,
      tiltAngle,
      rollAngle,
    })

    return NextResponse.json({
      success: true,
      id: result.id,
      shareCode: result.shareCode,
      shareUrl: `/face-analysis/result/${result.shareCode}`,
    })
  } catch (error) {
    console.error('Face analysis save error:', error)
    return NextResponse.json(
      { error: '결과 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
