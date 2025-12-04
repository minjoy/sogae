import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/utils/auth';
import { checkAndCreateMutualMatch } from '@/lib/engines/matchingEngine';

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const body = await request.json();
    const { selectedUserId } = body;

    if (!selectedUserId) {
      return NextResponse.json({ error: 'selectedUserId가 필요합니다.' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘의 후보 목록에 있는지 확인
    const candidate = await prisma.dailyCandidate.findFirst({
      where: {
        ownerUserId: user.userId,
        candidateUserId: selectedUserId,
        date: today,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: '오늘의 후보 목록에 없는 사용자입니다.' },
        { status: 400 }
      );
    }

    // 이미 선택했는지 확인
    const existingSelection = await prisma.dailySelection.findFirst({
      where: {
        userId: user.userId,
        selectedUserId,
        date: today,
      },
    });

    if (existingSelection) {
      return NextResponse.json({ message: '이미 선택한 사용자입니다.' });
    }

    // 선택 기록 생성
    await prisma.dailySelection.create({
      data: {
        userId: user.userId,
        selectedUserId,
        date: today,
      },
    });

    // 상호 매칭 확인
    const isMutualMatch = await checkAndCreateMutualMatch(user.userId, selectedUserId, today);

    return NextResponse.json({
      message: '선택이 완료되었습니다.',
      isMutualMatch,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    console.error('Select error:', error);
    return NextResponse.json({ error: '선택에 실패했습니다.' }, { status: 500 });
  }
}
