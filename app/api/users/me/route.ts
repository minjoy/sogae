import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prismaAny as prisma } from '@/lib/prisma';
import { validateNickname } from '@/lib/nickname';

// 내 정보 조회
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.kakaoId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { kakaoId: session.user.kakaoId },
      select: {
        id: true,
        kakaoId: true,
        email: true,
        nickname: true,
        profileImage: true,
        bio: true,
        gender: true,
        birthYear: true,
        region: true,
        regionCode: true,
        level: true,
        exp: true,
        isOnboarded: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}

// 내 정보 수정
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.kakaoId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nickname, bio, region, regionCode, profileImage, isOnboarded } = body;

    const user = await prisma.user.findUnique({
      where: { kakaoId: session.user.kakaoId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // 닉네임 변경 시 검증
    if (nickname && nickname !== user.nickname) {
      const nicknameValidation = validateNickname(nickname);
      if (!nicknameValidation.valid) {
        return NextResponse.json(
          { success: false, error: nicknameValidation.error },
          { status: 400 }
        );
      }

      // 중복 체크
      const existingUser = await prisma.user.findUnique({
        where: { nickname },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { success: false, error: '이미 사용 중인 닉네임입니다.' },
          { status: 400 }
        );
      }
    }

    // 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(nickname && { nickname }),
        ...(bio !== undefined && { bio }),
        ...(region && { region }),
        ...(regionCode && { regionCode }),
        ...(profileImage !== undefined && { profileImage }),
        ...(isOnboarded !== undefined && { isOnboarded }),
      },
      select: {
        id: true,
        kakaoId: true,
        nickname: true,
        profileImage: true,
        bio: true,
        region: true,
        regionCode: true,
        isOnboarded: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
