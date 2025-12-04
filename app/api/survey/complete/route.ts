import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import {
  calculateEconomicCode3,
  validateSurveyAnswers,
  type SurveyAnswers,
} from '@/lib/engines/surveyEngine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, userId } = body;

    // 답변 유효성 검증
    const validation = validateSurveyAnswers(answers as Partial<SurveyAnswers>);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    // 코드 계산
    const result = calculateEconomicCode3(answers as SurveyAnswers);

    // 설문 결과 저장
    const surveyResult = await prisma.economicSurveyResult.create({
      data: {
        userId: userId || null,
        code3: result.code3,
        answers: answers,
        summaryText: result.summaryText,
      },
    });

    // 임시 토큰 생성 (userId가 없는 경우)
    let tempToken = null;
    if (!userId) {
      tempToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48); // 48시간 후 만료

      await prisma.temporarySurveyToken.create({
        data: {
          surveyResultId: surveyResult.id,
          token: tempToken,
          expiresAt,
        },
      });
    }

    return NextResponse.json({
      code3: result.code3,
      summaryText: result.summaryText,
      details: result.details,
      tempToken,
    });
  } catch (error) {
    console.error('Survey complete error:', error);
    return NextResponse.json({ error: '설문 처리에 실패했습니다.' }, { status: 500 });
  }
}
