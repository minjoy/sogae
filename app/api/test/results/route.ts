import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function handleGetResults(request: AuthenticatedRequest) {
  try {
    const userId = request.userId!;

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
    const validResults = results.filter((r: typeof results[number]) => r !== null);

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

async function handleDeleteAllResults(request: AuthenticatedRequest) {
  try {
    const userId = request.userId!;

    // 해당 사용자의 모든 테스트 결과 삭제
    const deleteResult = await prisma.testResult.deleteMany({
      where: {
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count}개의 테스트 결과가 삭제되었습니다`,
      deletedCount: deleteResult.count,
    });
  } catch (error) {
    console.error('Delete all results error:', error);
    return NextResponse.json(
      { error: '테스트 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetResults);
export const DELETE = withAuth(handleDeleteAllResults);
