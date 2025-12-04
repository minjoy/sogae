import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request);

    // 내가 포함된 상호 매칭 조회
    const mutualMatches = await prisma.mutualMatch.findMany({
      where: {
        OR: [{ userAId: user.userId }, { userBId: user.userId }],
      },
      include: {
        userA: {
          select: {
            id: true,
            name: true,
            gender: true,
            birthYear: true,
            region: true,
            email: true,
          },
        },
        userB: {
          select: {
            id: true,
            name: true,
            gender: true,
            birthYear: true,
            region: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const currentYear = new Date().getFullYear();

    // 매칭 정보 포맷팅
    const formattedMatches = mutualMatches.map((match) => {
      // 상대방 정보 결정
      const isUserA = match.userAId === user.userId;
      const partner = isUserA ? match.userB : match.userA;
      const iHavePaid = isUserA ? match.userAPaid : match.userBPaid;

      return {
        id: match.id,
        date: match.date.toISOString().split('T')[0],
        partner: {
          id: partner.id,
          name: partner.name,
          age: currentYear - partner.birthYear,
          gender: partner.gender,
          region: partner.region,
          // 연락처는 공개되었을 때만
          email: match.isContactRevealed ? partner.email : null,
        },
        iHavePaid,
        isContactRevealed: match.isContactRevealed,
      };
    });

    return NextResponse.json({
      matches: formattedMatches,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    console.error('Mutual matches error:', error);
    return NextResponse.json({ error: '매칭 조회에 실패했습니다.' }, { status: 500 });
  }
}
