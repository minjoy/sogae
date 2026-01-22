import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// POST: 매장 신고
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 인증 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const { id: storeId } = await context.params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: '신고 사유를 입력해주세요' },
        { status: 400 }
      );
    }

    // 이미 신고했는지 확인
    const existingReport = await prisma.storeReport.findUnique({
      where: {
        storeId_userId: { storeId, userId },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: '이미 신고한 매장입니다' },
        { status: 400 }
      );
    }

    // 신고 생성 및 신고 수 증가
    await prisma.$transaction(async (tx: TransactionClient) => {
      await tx.storeReport.create({
        data: {
          storeId,
          userId,
          reason,
        },
      });

      const store = await tx.dujjonkuStore.update({
        where: { id: storeId },
        data: { reportCount: { increment: 1 } },
      });

      // 3회 신고 시 자동 숨김
      if (store.reportCount >= 3 && !store.isHidden) {
        await tx.dujjonkuStore.update({
          where: { id: storeId },
          data: { isHidden: true },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: '신고가 접수되었습니다',
    });
  } catch (error) {
    console.error('Store report error:', error);
    return NextResponse.json(
      { error: '신고 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
