import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ADMIN_KEY = 'sogae-admin-2024';

function isAdmin(request: NextRequest): boolean {
  return request.headers.get('x-admin-key') === ADMIN_KEY;
}

// POST: 좌표 목록으로 등록 여부 확인
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { coordinates } = body;

    if (!coordinates || !Array.isArray(coordinates)) {
      return NextResponse.json(
        { error: '좌표 목록이 필요합니다' },
        { status: 400 }
      );
    }

    // 중복 확인 임계값 (약 10m 반경)
    const DUPLICATE_THRESHOLD = 0.0001;

    // 각 좌표에 대해 등록 여부 확인
    const registeredIndices: number[] = [];

    for (let i = 0; i < coordinates.length; i++) {
      const { lat, lng } = coordinates[i];

      if (lat === undefined || lng === undefined) continue;

      const parsedLat = typeof lat === 'number' ? lat : parseFloat(lat);
      const parsedLng = typeof lng === 'number' ? lng : parseFloat(lng);

      if (isNaN(parsedLat) || isNaN(parsedLng)) continue;

      const existingStore = await prisma.dujjonkuStore.findFirst({
        where: {
          lat: { gte: parsedLat - DUPLICATE_THRESHOLD, lte: parsedLat + DUPLICATE_THRESHOLD },
          lng: { gte: parsedLng - DUPLICATE_THRESHOLD, lte: parsedLng + DUPLICATE_THRESHOLD },
        },
        select: { id: true },
      });

      if (existingStore) {
        registeredIndices.push(i);
      }
    }

    return NextResponse.json({
      success: true,
      registeredIndices,
      totalChecked: coordinates.length,
      registeredCount: registeredIndices.length,
    });
  } catch (error) {
    console.error('Check registered error:', error);
    return NextResponse.json(
      { error: '등록 여부 확인 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
