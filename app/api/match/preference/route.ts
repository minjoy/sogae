import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    const preference = await prisma.matchPreference.findUnique({
      where: { userId: user.userId },
    });

    if (!preference) {
      return NextResponse.json(
        {
          isParticipating: false,
          preferredMinAge: null,
          preferredMaxAge: null,
          preferredRegion: null,
          preferredOppositeCodes: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(preference);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    console.error('Get preference error:', error);
    return NextResponse.json({ error: '설정 조회에 실패했습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const body = await request.json();
    const { isParticipating, preferredMinAge, preferredMaxAge, preferredRegion, preferredOppositeCodes } = body;

    // Upsert (있으면 업데이트, 없으면 생성)
    const preference = await prisma.matchPreference.upsert({
      where: { userId: user.userId },
      update: {
        isParticipating: isParticipating ?? false,
        preferredMinAge: preferredMinAge || null,
        preferredMaxAge: preferredMaxAge || null,
        preferredRegion: preferredRegion || null,
        preferredOppositeCodes: preferredOppositeCodes || null,
      },
      create: {
        userId: user.userId,
        isParticipating: isParticipating ?? false,
        preferredMinAge: preferredMinAge || null,
        preferredMaxAge: preferredMaxAge || null,
        preferredRegion: preferredRegion || null,
        preferredOppositeCodes: preferredOppositeCodes || null,
      },
    });

    return NextResponse.json(preference);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    console.error('Set preference error:', error);
    return NextResponse.json({ error: '설정 저장에 실패했습니다.' }, { status: 500 });
  }
}
