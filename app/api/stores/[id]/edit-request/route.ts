import { NextRequest, NextResponse } from 'next/server';
import { prismaAny as prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST: 매장 수정 요청 생성
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id: storeId } = await context.params;
    const body = await request.json();
    const { name, category, dessertName, address, lat, lng, phone, description, imageUrl, storeUrl, passOrderUrl, price } = body;

    // 매장 존재 확인
    const store = await prisma.dujjonkuStore.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json(
        { error: '존재하지 않는 매장입니다' },
        { status: 404 }
      );
    }

    // 이미 대기 중인 수정 요청이 있는지 확인
    const existingRequest = await prisma.storeEditRequest.findFirst({
      where: {
        storeId,
        userId,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: '이미 대기 중인 수정 요청이 있습니다' },
        { status: 400 }
      );
    }

    // 변경 사항 확인 (적어도 하나의 필드가 변경되어야 함)
    const parsedPrice = price !== undefined ? parseInt(price) || null : undefined;
    const hasChanges =
      (name && name !== store.name) ||
      (category && category !== store.category) ||
      (dessertName !== undefined && dessertName !== store.dessertName) ||
      (address && address !== store.address) ||
      (lat && lat !== store.lat) ||
      (lng && lng !== store.lng) ||
      (phone !== undefined && phone !== store.phone) ||
      (description !== undefined && description !== store.description) ||
      (imageUrl !== undefined && imageUrl !== store.imageUrl) ||
      (storeUrl !== undefined && storeUrl !== store.storeUrl) ||
      (passOrderUrl !== undefined && passOrderUrl !== store.passOrderUrl) ||
      (parsedPrice !== undefined && parsedPrice !== store.price);

    if (!hasChanges) {
      return NextResponse.json(
        { error: '변경된 내용이 없습니다' },
        { status: 400 }
      );
    }

    // 수정 요청 생성 (변경된 필드만 저장)
    const editRequest = await prisma.storeEditRequest.create({
      data: {
        storeId,
        userId,
        name: name !== store.name ? name : null,
        category: category !== store.category ? category : null,
        dessertName: dessertName !== store.dessertName ? dessertName : null,
        address: address !== store.address ? address : null,
        lat: lat !== store.lat ? lat : null,
        lng: lng !== store.lng ? lng : null,
        phone: phone !== store.phone ? phone : null,
        description: description !== store.description ? description : null,
        imageUrl: imageUrl !== store.imageUrl ? imageUrl : null,
        storeUrl: storeUrl !== store.storeUrl ? storeUrl : null,
        passOrderUrl: passOrderUrl !== store.passOrderUrl ? passOrderUrl : null,
        price: parsedPrice !== store.price ? parsedPrice : null,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      editRequest,
      message: '수정 요청이 제출되었습니다. 관리자 승인 후 반영됩니다.',
    });
  } catch (error) {
    console.error('Store edit request error:', error);
    return NextResponse.json(
      { error: '수정 요청 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// GET: 특정 매장의 수정 요청 목록 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await context.params;

    const editRequests = await prisma.storeEditRequest.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      editRequests,
    });
  } catch (error) {
    console.error('Store edit requests fetch error:', error);
    return NextResponse.json(
      { error: '수정 요청 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
