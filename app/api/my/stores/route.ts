import { NextResponse } from 'next/server';
import { prismaAny as prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function handleGetMyStores(request: AuthenticatedRequest) {
  try {
    const userId = request.userId!;

    const stores = await prisma.dujjonkuStore.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        category: true,
        address: true,
        isHidden: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      stores,
    });
  } catch (error) {
    console.error('Get my stores error:', error);
    return NextResponse.json(
      { error: '매장 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handleGetMyStores);
