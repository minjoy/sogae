import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    const card = await prisma.unifiedCard.findUnique({
      where: {
        shareSlug: slug,
      },
      include: {
        user: {
          select: {
            nickname: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: '카드를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 공개 설정에 따라 데이터 필터링
    const visibilitySettings = card.visibilitySettings as {
      showNickname?: boolean;
      showScores?: boolean;
      hiddenTests?: number[];
    };
    const cardPayload = card.cardPayload as Record<string, unknown>;

    const publicCard = {
      ...cardPayload,
      nickname: visibilitySettings.showNickname ? card.user.nickname : '익명',
      showScores: visibilitySettings.showScores,
      hiddenTests: visibilitySettings.hiddenTests || [],
    };

    return NextResponse.json({
      success: true,
      card: publicCard,
      createdAt: card.createdAt,
    });
  } catch (error) {
    console.error('Card fetch error:', error);
    return NextResponse.json(
      { error: '카드 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
