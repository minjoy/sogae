import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_PASSWORD = 'care1234@';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다' },
        { status: 401 }
      );
    }

    // 전체 통계 조회
    const [
      totalUsers,
      totalTests,
      totalCards,
      testsByType,
      recentUsers,
      readinessDistribution,
    ] = await Promise.all([
      // 총 회원 수
      prisma.user.count(),

      // 총 테스트 수
      prisma.testResult.count(),

      // 총 카드 수
      prisma.unifiedCard.count(),

      // 테스트 타입별 횟수
      prisma.testResult.groupBy({
        by: ['testType'],
        _count: { id: true },
      }),

      // 최근 7일 가입자 수
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // 연애 준비도 분포
      prisma.datingState.groupBy({
        by: ['modeLabel'],
        _count: { userId: true },
      }),
    ]);

    // 테스트 타입 이름 매핑
    const testTypeNames: Record<number, string> = {
      1: '애착유형',
      2: '갈등대처',
      3: '연애가치관',
      4: '소비습관',
      5: '번아웃',
    };

    const testStats = testsByType.map((t: { testType: number; _count: { id: number } }) => ({
      type: t.testType,
      name: testTypeNames[t.testType] || `테스트 ${t.testType}`,
      count: t._count.id,
    }));

    const readinessStats = readinessDistribution.map((r: { modeLabel: string; _count: { userId: number } }) => ({
      label: r.modeLabel,
      count: r._count.userId,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalTests,
        totalCards,
        recentUsers,
        testStats,
        readinessStats,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: '통계 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
