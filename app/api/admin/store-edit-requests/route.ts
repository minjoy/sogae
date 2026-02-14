import { NextRequest, NextResponse } from 'next/server';
import { prismaAny as prisma } from '@/lib/prisma';

// GET: 전체 수정 요청 목록 조회 (관리자용)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all'; // all, pending, approved, rejected
    const storeId = searchParams.get('storeId');

    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (storeId) {
      where.storeId = storeId;
    }

    const editRequests = await prisma.storeEditRequest.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            category: true,
            dessertName: true,
            address: true,
            lat: true,
            lng: true,
            phone: true,
            description: true,
            imageUrl: true,
            storeUrl: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 매장별로 그룹화
    type RequestWithoutStore = Omit<typeof editRequests[number], 'store'>;
    const groupedByStore: Record<string, {
      store: typeof editRequests[number]['store'];
      requests: RequestWithoutStore[];
    }> = {};

    editRequests.forEach((req: typeof editRequests[number]) => {
      if (!groupedByStore[req.storeId]) {
        groupedByStore[req.storeId] = {
          store: req.store,
          requests: [],
        };
      }
      groupedByStore[req.storeId].requests.push({
        id: req.id,
        storeId: req.storeId,
        userId: req.userId,
        name: req.name,
        category: req.category,
        dessertName: req.dessertName,
        address: req.address,
        lat: req.lat,
        lng: req.lng,
        phone: req.phone,
        description: req.description,
        imageUrl: req.imageUrl,
        storeUrl: req.storeUrl,
        passOrderUrl: req.passOrderUrl,
        price: req.price,
        status: req.status,
        adminNote: req.adminNote,
        createdAt: req.createdAt,
        processedAt: req.processedAt,
      });
    });

    return NextResponse.json({
      success: true,
      editRequests,
      groupedByStore: Object.values(groupedByStore),
      total: editRequests.length,
    });
  } catch (error) {
    console.error('Admin store edit requests fetch error:', error);
    return NextResponse.json(
      { error: '수정 요청 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
