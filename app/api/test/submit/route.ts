import { NextResponse } from 'next/server';
import { prismaAny as prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
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

async function handleSubmit(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const validatedData = submitSchema.parse(body);
    const userId = request.userId!;

    // 테스트 채점
    const score = scoreTest(validatedData.testType, validatedData.answers);

    // 결과 저장
    const result = await prisma.testResult.create({
      data: {
        userId,
        testType: validatedData.testType,
        rawAnswers: validatedData.answers as Record<string, any>,
        scores: {
          subscales: score.subscales,
          primaryLabel: score.primaryLabel,
          secondaryLabel: score.secondaryLabel,
        } as Record<string, any>,
        label: score.primaryLabel,
      },
    });

    return NextResponse.json({
      success: true,
      result: {
        id: result.id,
        testType: result.testType,
        label: score.primaryLabel,
        secondaryLabel: score.secondaryLabel,
        comment: score.comment,
        recommendations: score.recommendations,
        subscales: score.subscales,
        createdAt: result.createdAt,
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

export const POST = withAuth(handleSubmit);
