import { NextRequest, NextResponse } from 'next/server';
import { prismaAny as prisma } from '@/lib/prisma';
import { validateNickname } from '@/lib/nickname';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nickname = searchParams.get('nickname');

    if (!nickname) {
      return NextResponse.json(
        { success: false, error: '닉네임을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 닉네임 유효성 검사
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error, available: false },
        { status: 400 }
      );
    }

    // 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { nickname },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        available: false,
        error: '이미 사용 중인 닉네임입니다.',
      });
    }

    return NextResponse.json({
      success: true,
      available: true,
    });
  } catch (error) {
    console.error('Check nickname error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
