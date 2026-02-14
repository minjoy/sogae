import { NextRequest, NextResponse } from 'next/server';
import { prismaAny as prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scoreTest } from '@/lib/tests/scoring';
import { z } from 'zod';

const submitSchema = z.object({
  testType: z.number().min(1).max(5),
  answers: z.array(
    z.object({
      questionId: z.number(),
      value: z.number().min(1).max(5),
    })
  ),
});

// 비로그인 사용자도 테스트 가능하도록 수정
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = submitSchema.parse(body);

    // 테스트 채점
    const score = scoreTest(validatedData.testType, validatedData.answers);

    // 세션 확인 (로그인 여부)
    const session = await getServerSession(authOptions);
    let resultId: string | null = null;
    let createdAt: Date | null = null;

    // 로그인된 사용자인 경우에만 결과 저장
    if (session?.user?.id) {
      const result = await prisma.testResult.create({
        data: {
          userId: session.user.id,
          testType: validatedData.testType,
          rawAnswers: validatedData.answers as unknown as Record<string, unknown>,
          scores: {
            subscales: score.subscales,
            primaryLabel: score.primaryLabel,
            secondaryLabel: score.secondaryLabel,
          } as Record<string, unknown>,
          label: score.primaryLabel,
        },
      });
      resultId = result.id;
      createdAt = result.createdAt;
    }

    return NextResponse.json({
      success: true,
      result: {
        id: resultId,
        testType: validatedData.testType,
        label: score.primaryLabel,
        secondaryLabel: score.secondaryLabel,
        comment: score.comment,
        recommendations: score.recommendations,
        subscales: score.subscales,
        createdAt: createdAt || new Date(),
        isGuest: !session?.user?.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('Test submission error:', error);
    return NextResponse.json(
      { error: '테스트 제출 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
