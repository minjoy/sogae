import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘의 후보 조회
    const candidates = await prisma.dailyCandidate.findMany({
      where: {
        ownerUserId: user.userId,
        date: today,
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            gender: true,
            birthYear: true,
            region: true,
            surveyResults: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              select: {
                code3: true,
                summaryText: true,
              },
            },
          },
        },
      },
    });

    // 현재 연도
    const currentYear = new Date().getFullYear();

    // 후보 정보 포맷팅
    const formattedCandidates = candidates.map((c) => ({
      id: c.candidate.id,
      name: c.candidate.name,
      age: currentYear - c.candidate.birthYear,
      gender: c.candidate.gender,
      region: c.candidate.region,
      code3: c.candidate.surveyResults[0]?.code3 || 'N/A',
      summaryText: c.candidate.surveyResults[0]?.summaryText || '',
    }));

    return NextResponse.json({
      date: today.toISOString().split('T')[0],
      candidates: formattedCandidates,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    console.error('Today candidates error:', error);
    return NextResponse.json({ error: '후보 조회에 실패했습니다.' }, { status: 500 });
  }
}
