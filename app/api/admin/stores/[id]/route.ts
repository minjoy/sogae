import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_KEY = 'sogae-admin-2024';

function isAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-key') === ADMIN_KEY;
}

// GET: 매장 상세 조회 (신고 내역 포함)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    const store = await prisma.dujjonkuStore.findUnique({
      where: { id },
      include: {
        user: { select: { nickname: true, email: true } },
        reports: {
          include: {
            user: { select: { nickname: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
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
      store,
    });
  } catch (error) {
    console.error('Admin store detail error:', error);
    return NextResponse.json(
      { error: '매장 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// PUT: 매장 수정 (관리자)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, address, lat, lng, phone, description, imageUrl, isHidden } = body;

    const store = await prisma.dujjonkuStore.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(lat !== undefined && { lat: parseFloat(lat) }),
        ...(lng !== undefined && { lng: parseFloat(lng) }),
        ...(phone !== undefined && { phone }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isHidden !== undefined && { isHidden }),
      },
    });

    return NextResponse.json({
      success: true,
      store,
    });
  } catch (error) {
    console.error('Admin store update error:', error);
    return NextResponse.json(
      { error: '매장 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// DELETE: 매장 삭제 (관리자)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  try {
    const { id } = await context.params;

    await prisma.dujjonkuStore.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: '매장이 삭제되었습니다',
    });
  } catch (error) {
    console.error('Admin store delete error:', error);
    return NextResponse.json(
      { error: '매장 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
