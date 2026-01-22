import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_KEY = 'sogae-admin-2024';

function isAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-key') === ADMIN_KEY;
}

// GET: 모든 매장 조회 (관리자)
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const filter = searchParams.get('filter') || 'all'; // all, hidden, reported

    const where: any = {};
    if (filter === 'hidden') where.isHidden = true;
    else if (filter === 'reported') where.reportCount = { gt: 0 };
    else if (['dujjonku', 'dubai', 'signature'].includes(filter)) where.category = filter;

    const [stores, total] = await Promise.all([
      prisma.dujjonkuStore.findMany({
        where,
        include: {
          user: { select: { nickname: true, email: true } },
          _count: { select: { reports: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dujjonkuStore.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      stores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin store list error:', error);
    return NextResponse.json(
      { error: '매장 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// POST: 매장 등록 (관리자)
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, category, address, lat, lng, phone, description, imageUrl, storeUrl, passOrderUrl, dessertName, price } = body;

    if (!name || !address || lat === undefined || lat === null || lng === undefined || lng === null) {
      return NextResponse.json(
        { error: '매장명, 주소, 위치 정보는 필수입니다' },
        { status: 400 }
      );
    }

    const parsedLat = typeof lat === 'number' ? lat : parseFloat(lat);
    const parsedLng = typeof lng === 'number' ? lng : parseFloat(lng);

    // 좌표 유효성 검증
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return NextResponse.json(
        { error: '위치 좌표가 올바르지 않습니다' },
        { status: 400 }
      );
    }

    // 대한민국 좌표 범위 검증
    if (parsedLat < 33 || parsedLat > 43 || parsedLng < 124 || parsedLng > 132) {
      return NextResponse.json(
        { error: '대한민국 범위 내의 좌표만 등록할 수 있습니다' },
        { status: 400 }
      );
    }

    // 위치 기반 중복 체크 (약 10m 반경 내 동일 매장 확인)
    const DUPLICATE_THRESHOLD = 0.0001; // 약 10m
    const existingStore = await prisma.dujjonkuStore.findFirst({
      where: {
        lat: { gte: parsedLat - DUPLICATE_THRESHOLD, lte: parsedLat + DUPLICATE_THRESHOLD },
        lng: { gte: parsedLng - DUPLICATE_THRESHOLD, lte: parsedLng + DUPLICATE_THRESHOLD },
      },
    });

    if (existingStore) {
      return NextResponse.json(
        { error: `이미 등록된 매장입니다: ${existingStore.name}` },
        { status: 400 }
      );
    }

    // 카테고리 검증
    const validCategories = ['dujjonku', 'dubai', 'signature'];
    const validCategory = validCategories.includes(category) ? category : 'dujjonku';

    // 두쫀쿠 카테고리 선택 시 가격 저장
    const parsedPrice = validCategory.includes('dujjonku') && price ? parseInt(price) : null;

    const store = await prisma.dujjonkuStore.create({
      data: {
        name,
        category: validCategory,
        dessertName: dessertName || null,
        address,
        lat: parsedLat,
        lng: parsedLng,
        phone: phone || null,
        description: description || null,
        imageUrl: imageUrl || null,
        storeUrl: storeUrl || null,
        passOrderUrl: passOrderUrl || null,
        price: parsedPrice,
        isAdmin: true,
        userId: null,
      },
    });

    return NextResponse.json({
      success: true,
      store,
    });
  } catch (error) {
    console.error('Admin store create error:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { error: `매장 등록 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
