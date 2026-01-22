import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

// 카테고리 상수
const CATEGORIES = ['dujjonku', 'dubai', 'signature'] as const;
type Category = typeof CATEGORIES[number];

// GET: 매장 목록 조회 (맵 바운드 기반 + 카테고리 필터 + 가격 필터)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const swLat = parseFloat(searchParams.get('swLat') || '0');
    const swLng = parseFloat(searchParams.get('swLng') || '0');
    const neLat = parseFloat(searchParams.get('neLat') || '0');
    const neLng = parseFloat(searchParams.get('neLng') || '0');
    const level = parseInt(searchParams.get('level') || '3');
    const category = searchParams.get('category') || 'all'; // all, dujjonku, dubai, signature
    const minPrice = searchParams.get('minPrice'); // 최소 가격
    const maxPrice = searchParams.get('maxPrice'); // 최대 가격

    // 줌 레벨에 따른 최대 개수 제한
    let limit = 100;
    if (level >= 10) limit = 20;
    else if (level >= 7) limit = 50;

    const where: any = {
      isHidden: false,
      lat: { gte: swLat, lte: neLat },
      lng: { gte: swLng, lte: neLng },
    };

    // 카테고리 필터 (복수 카테고리 지원)
    if (category !== 'all' && CATEGORIES.includes(category as Category)) {
      where.category = { contains: category };
    }

    // 가격 필터 (두쫀쿠 카테고리만 해당)
    // 가격 필터가 적용된 경우 가격 정보가 없는 매장은 제외
    if (minPrice || maxPrice) {
      where.price = { not: null };
      if (minPrice) where.price.gte = parseInt(minPrice);
      if (maxPrice) where.price.lte = parseInt(maxPrice);
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
        price: true,
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
    const { name, category, categories, address, lat, lng, phone, description, imageUrl, storeUrl, passOrderUrl, dessertName, price } = body;

    if (!name || !address || !lat || !lng) {
      return NextResponse.json(
        { error: '매장명, 주소, 위치 정보는 필수입니다' },
        { status: 400 }
      );
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    // 위치 기반 중복 체크 (약 10m 반경 내 동일 매장 확인)
    const DUPLICATE_THRESHOLD = 0.0001; // 약 10m
    const existingStore = await prisma.dujjonkuStore.findFirst({
      where: {
        lat: { gte: parsedLat - DUPLICATE_THRESHOLD, lte: parsedLat + DUPLICATE_THRESHOLD },
        lng: { gte: parsedLng - DUPLICATE_THRESHOLD, lte: parsedLng + DUPLICATE_THRESHOLD },
        isHidden: false,
      },
    });

    if (existingStore) {
      return NextResponse.json(
        { error: `이미 등록된 매장입니다: ${existingStore.name}` },
        { status: 400 }
      );
    }

    // 카테고리 검증 (복수 카테고리 지원)
    let validCategory: string;
    let categoryList: string[] = [];
    if (Array.isArray(categories) && categories.length > 0) {
      // 배열로 받은 경우 - 유효한 카테고리만 필터링 후 쉼표로 구분
      const validCategories = categories.filter((c: string) => CATEGORIES.includes(c as Category));
      categoryList = validCategories;
      validCategory = validCategories.length > 0 ? validCategories.join(',') : 'dujjonku';
    } else {
      // 단일 카테고리로 받은 경우 (기존 호환성)
      validCategory = CATEGORIES.includes(category) ? category : 'dujjonku';
      categoryList = [validCategory];
    }

    // 두바이파생 또는 시그니처간식 선택 시 디저트명 필수
    const needsDessertName = categoryList.includes('dubai') || categoryList.includes('signature');
    if (needsDessertName && !dessertName) {
      return NextResponse.json(
        { error: '두바이파생 또는 시그니처간식 선택 시 디저트명을 입력해주세요' },
        { status: 400 }
      );
    }

    // 두쫀쿠 카테고리 선택 시 가격 저장
    const hasDujjonku = categoryList.includes('dujjonku');
    const parsedPrice = hasDujjonku && price ? parseInt(price) : null;

    // 매장 생성
    const store = await prisma.dujjonkuStore.create({
      data: {
        name,
        category: validCategory,
        dessertName: needsDessertName ? dessertName : null,
        address,
        lat: parsedLat,
        lng: parsedLng,
        phone: phone || null,
        description: description || null,
        imageUrl: imageUrl || null,
        storeUrl: storeUrl || null,
        passOrderUrl: passOrderUrl || null,
        price: parsedPrice,
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
