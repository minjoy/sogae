import { NextRequest, NextResponse } from 'next/server';
import { prismaAny as prisma } from '@/lib/prisma';

// GET: 특정 수정 요청 상세 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const editRequest = await prisma.storeEditRequest.findUnique({
      where: { id },
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
            passOrderUrl: true,
            price: true,
          },
        },
      },
    });

    if (!editRequest) {
      return NextResponse.json(
        { error: '수정 요청을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      editRequest,
    });
  } catch (error) {
    console.error('Admin store edit request fetch error:', error);
    return NextResponse.json(
      { error: '수정 요청 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// PATCH: 수정 요청 승인/거절 (선택적 필드 적용)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action, adminNote, applyFields } = body;
    // action: 'approve' | 'reject'
    // applyFields: 승인 시 적용할 필드 목록 (예: ['name', 'phone'])

    const editRequest = await prisma.storeEditRequest.findUnique({
      where: { id },
      include: { store: true },
    });

    if (!editRequest) {
      return NextResponse.json(
        { error: '수정 요청을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    if (editRequest.status !== 'pending') {
      return NextResponse.json(
        { error: '이미 처리된 수정 요청입니다' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // 선택된 필드만 적용
      const fieldsToApply = applyFields || [
        'name', 'category', 'dessertName', 'address', 'lat', 'lng', 'phone', 'description', 'imageUrl', 'storeUrl', 'passOrderUrl', 'price'
      ];

      const updateData: any = {};

      if (fieldsToApply.includes('name') && editRequest.name !== null) {
        updateData.name = editRequest.name;
      }
      if (fieldsToApply.includes('category') && editRequest.category !== null) {
        updateData.category = editRequest.category;
      }
      if (fieldsToApply.includes('dessertName') && editRequest.dessertName !== null) {
        updateData.dessertName = editRequest.dessertName;
      }
      if (fieldsToApply.includes('address') && editRequest.address !== null) {
        updateData.address = editRequest.address;
      }
      if (fieldsToApply.includes('lat') && editRequest.lat !== null) {
        updateData.lat = editRequest.lat;
      }
      if (fieldsToApply.includes('lng') && editRequest.lng !== null) {
        updateData.lng = editRequest.lng;
      }
      if (fieldsToApply.includes('phone') && editRequest.phone !== null) {
        updateData.phone = editRequest.phone;
      }
      if (fieldsToApply.includes('description') && editRequest.description !== null) {
        updateData.description = editRequest.description;
      }
      if (fieldsToApply.includes('imageUrl') && editRequest.imageUrl !== null) {
        updateData.imageUrl = editRequest.imageUrl;
      }
      if (fieldsToApply.includes('storeUrl') && editRequest.storeUrl !== null) {
        updateData.storeUrl = editRequest.storeUrl;
      }
      if (fieldsToApply.includes('passOrderUrl') && editRequest.passOrderUrl !== null) {
        updateData.passOrderUrl = editRequest.passOrderUrl;
      }
      if (fieldsToApply.includes('price') && editRequest.price !== null) {
        updateData.price = editRequest.price;
      }

      // 매장 업데이트
      if (Object.keys(updateData).length > 0) {
        await prisma.dujjonkuStore.update({
          where: { id: editRequest.storeId },
          data: updateData,
        });
      }

      // 수정 요청 상태 업데이트
      await prisma.storeEditRequest.update({
        where: { id },
        data: {
          status: 'approved',
          adminNote: adminNote || null,
          processedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: '수정 요청이 승인되었습니다',
        appliedFields: fieldsToApply,
      });
    } else if (action === 'reject') {
      // 수정 요청 거절
      await prisma.storeEditRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          adminNote: adminNote || null,
          processedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: '수정 요청이 거절되었습니다',
      });
    } else {
      return NextResponse.json(
        { error: '잘못된 action입니다. approve 또는 reject를 사용하세요.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Admin store edit request process error:', error);
    return NextResponse.json(
      { error: '수정 요청 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
