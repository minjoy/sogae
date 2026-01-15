import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function handleGetResults(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;

    // 각 테스트 타입별로 최신 결과 1개씩 가져오기
    const results = await Promise.all(
      [1, 2, 3, 4, 5].map(async (testType) => {
        const result = await prisma.testResult.findFirst({
          where: {
            userId,
            testType,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return result;
      })
    );

    // null이 아닌 결과만 필터링
    const validResults = results.filter((r) => r !== null);

    return NextResponse.json({
      success: true,
      results: validResults,
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json(
      { error: '결과 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetResults);
