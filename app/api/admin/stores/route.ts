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
    if (filter === 'reported') where.reportCount = { gt: 0 };

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
    const { name, address, lat, lng, phone, description, imageUrl } = body;

    if (!name || !address || !lat || !lng) {
      return NextResponse.json(
        { error: '매장명, 주소, 위치 정보는 필수입니다' },
        { status: 400 }
      );
    }

    const store = await prisma.dujjonkuStore.create({
      data: {
        name,
        address,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        phone: phone || null,
        description: description || null,
        imageUrl: imageUrl || null,
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
    return NextResponse.json(
      { error: '매장 등록 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
