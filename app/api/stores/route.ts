import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

// 카테고리 상수
const CATEGORIES = ['dujjonku', 'dubai', 'signature'] as const;
type Category = typeof CATEGORIES[number];

// GET: 매장 목록 조회 (맵 바운드 기반 + 카테고리 필터)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const swLat = parseFloat(searchParams.get('swLat') || '0');
    const swLng = parseFloat(searchParams.get('swLng') || '0');
    const neLat = parseFloat(searchParams.get('neLat') || '0');
    const neLng = parseFloat(searchParams.get('neLng') || '0');
    const level = parseInt(searchParams.get('level') || '3');
    const category = searchParams.get('category') || 'all'; // all, dujjonku, dubai, signature

    // 줌 레벨에 따른 최대 개수 제한
    let limit = 100;
    if (level >= 10) limit = 20;
    else if (level >= 7) limit = 50;

    const where: any = {
      isHidden: false,
      lat: { gte: swLat, lte: neLat },
      lng: { gte: swLng, lte: neLng },
    };

    // 카테고리 필터
    if (category !== 'all' && CATEGORIES.includes(category as Category)) {
      where.category = category;
    }

    const stores = await prisma.dujjonkuStore.findMany({
      where,
      select: {
        id: true,
        name: true,
        category: true,
        address: true,
        lat: true,
        lng: true,
        clickCount: true,
      },
      take: limit,
      orderBy: { clickCount: 'desc' },
    });

    return NextResponse.json({
      success: true,
      stores,
      count: stores.length,
    });
  } catch (error) {
    console.error('Store list error:', error);
    return NextResponse.json(
      { error: '매장 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST: 매장 등록 (로그인 필요)
async function handleCreateStore(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;
    const body = await request.json();
    const { name, category, address, lat, lng, phone, description, imageUrl } = body;

    if (!name || !address || !lat || !lng) {
      return NextResponse.json(
        { error: '매장명, 주소, 위치 정보는 필수입니다' },
        { status: 400 }
      );
    }

    // 카테고리 검증
    const validCategory = CATEGORIES.includes(category) ? category : 'dujjonku';

    // 매장 생성
    const store = await prisma.dujjonkuStore.create({
      data: {
        name,
        category: validCategory,
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        phone: phone || null,
        description: description || null,
        imageUrl: imageUrl || null,
        userId,
        isAdmin: false,
      },
    });

    // 사용자에게 달달함 점수 +2
    await prisma.user.update({
      where: { id: userId },
      data: { sweetnessPoints: { increment: 2 } },
    });

    return NextResponse.json({
      success: true,
      store,
      message: '매장이 등록되었습니다! 달달함 점수 +2점!',
    });
  } catch (error) {
    console.error('Store create error:', error);
    return NextResponse.json(
      { error: '매장 등록 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleCreateStore);
