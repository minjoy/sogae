import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/utils/auth';
import { getCompatibilityInfo } from '@/lib/engines/compatibilityEngine';

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const user = requireAuth(request);

    // 설문 결과 조회
    const surveyResult = await prisma.economicSurveyResult.findFirst({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!surveyResult) {
      return NextResponse.json({ error: '설문 결과를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 궁합 정보 가져오기
    const compatibility = getCompatibilityInfo(surveyResult.code3);

    return NextResponse.json({
      code3: surveyResult.code3,
      summaryText: surveyResult.summaryText,
      answers: surveyResult.answers,
      goodMatches: compatibility.goodMatches,
      warningMatches: compatibility.warningMatches,
      compatibilityDescription: compatibility.description,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    console.error('My result error:', error);
    return NextResponse.json({ error: '설문 결과 조회에 실패했습니다.' }, { status: 500 });
  }
}
