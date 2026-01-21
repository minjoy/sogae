import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const codesParam = searchParams.get('codes');

    if (!codesParam) {
      return NextResponse.json(
        { success: false, error: '성격 코드가 필요합니다' },
        { status: 400 }
      );
    }

    const codes = codesParam.split(',').filter(Boolean);

    if (codes.length === 0) {
      return NextResponse.json({ success: true, users: [] });
    }

    // 해당 성격 코드를 가진 사용자 조회
    const users = await prisma.user.findMany({
      where: {
        personalityCode: {
          in: codes,
        },
      },
      select: {
        id: true,
        nickname: true,
        gender: true,
        personalityCode: true,
        isDummy: true,
      },
      take: 20, // 최대 20명
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 실제 사용자를 먼저 보여주고, 그 다음 더미 사용자
    const sortedUsers = users.sort((a: typeof users[number], b: typeof users[number]) => {
      if (a.isDummy === b.isDummy) return 0;
      return a.isDummy ? 1 : -1;
    });

    return NextResponse.json({
      success: true,
      users: sortedUsers.map((user: typeof users[number]) => ({
        id: user.id,
        nickname: user.nickname,
        gender: user.gender,
        personalityCode: user.personalityCode,
      })),
    });
  } catch (error) {
    console.error('Matching users error:', error);
    return NextResponse.json(
      { success: false, error: '사용자 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
