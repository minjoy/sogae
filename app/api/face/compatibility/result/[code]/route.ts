import { NextRequest, NextResponse } from 'next/server';
import { prismaAny as prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const result = await prisma.faceCompatibility.findUnique({
      where: { shareCode: code },
    });

    if (!result) {
      return NextResponse.json(
        { error: '결과를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 만료 확인
    const isExpired = new Date() > new Date(result.expiresAt);

    return NextResponse.json({
      success: true,
      data: {
        shareCode: result.shareCode,
        compatibilityScore: result.compatibilityScore,
        categoryScores: result.categoryScores,
        analysis: result.analysis,
        isPaid: result.isPaid,
        isExpired,
        createdAt: result.createdAt,
      },
    });
  } catch (error) {
    console.error('Compatibility result fetch error:', error);
    return NextResponse.json(
      { error: '결과를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
