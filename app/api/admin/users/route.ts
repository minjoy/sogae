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

    // 회원 목록 조회 (테스트 수, 카드 수 포함)
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        nickname: true,
        gender: true,
        birthyear: true,
        createdAt: true,
        _count: {
          select: {
            testResults: true,
            unifiedCards: true,
          },
        },
      },
    });

    const formattedUsers = users.map((user: {
      id: string;
      email: string;
      nickname: string;
      gender: string | null;
      birthyear: number | null;
      createdAt: Date;
      _count: { testResults: number; unifiedCards: number };
    }) => ({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      gender: user.gender,
      birthyear: user.birthyear,
      createdAt: user.createdAt,
      testCount: user._count.testResults,
      cardCount: user._count.unifiedCards,
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length,
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: '회원 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
