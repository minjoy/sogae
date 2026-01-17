import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function handleGetCards(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;

    // 사용자의 모든 카드 가져오기 (최신순)
    const cards = await prisma.unifiedCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        shareSlug: true,
        cardPayload: true,
        createdAt: true,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      cards: cards.map((card) => ({
        id: card.id,
        shareSlug: card.shareSlug,
        personalityType: (card.cardPayload as any)?.personalityType || null,
        datingMode: (card.cardPayload as any)?.datingMode || '',
        datingScore: (card.cardPayload as any)?.datingScore || 0,
        createdAt: card.createdAt,
        isActive: card.isActive,
      })),
    });
  } catch (error) {
    console.error('Get cards error:', error);
    return NextResponse.json(
      { error: '카드 목록을 불러오는 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetCards);
