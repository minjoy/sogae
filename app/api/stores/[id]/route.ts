import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: 매장 상세 조회 & 클릭 수 증가
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 클릭 수 증가
    const store = await prisma.dujjonkuStore.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
      include: {
        user: {
          select: { nickname: true },
        },
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: '매장을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      store: {
        id: store.id,
        name: store.name,
        category: store.category,
        dessertName: store.dessertName,
        address: store.address,
        lat: store.lat,
        lng: store.lng,
        phone: store.phone,
        description: store.description,
        imageUrl: store.imageUrl,
        storeUrl: store.storeUrl,
        passOrderUrl: store.passOrderUrl,
        price: store.price,
        clickCount: store.clickCount,
        registeredBy: store.isAdmin ? '관리자' : store.user?.nickname || '알 수 없음',
        createdAt: store.createdAt,
      },
    });
  } catch (error) {
    console.error('Store detail error:', error);
    return NextResponse.json(
      { error: '매장 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
