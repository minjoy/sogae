import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/utils/auth';
import { sendContactRevealEmail } from '@/lib/utils/email';

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    const body = await request.json();
    const { mutualMatchId } = body;

    if (!mutualMatchId) {
      return NextResponse.json({ error: 'mutualMatchId가 필요합니다.' }, { status: 400 });
    }

    // MutualMatch 조회
    const mutualMatch = await prisma.mutualMatch.findUnique({
      where: { id: mutualMatchId },
      include: {
        userA: true,
        userB: true,
      },
    });

    if (!mutualMatch) {
      return NextResponse.json({ error: '매칭을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 현재 유저가 이 매칭에 포함되어 있는지 확인
    const isUserA = mutualMatch.userAId === user.userId;
    const isUserB = mutualMatch.userBId === user.userId;

    if (!isUserA && !isUserB) {
      return NextResponse.json({ error: '이 매칭에 대한 권한이 없습니다.' }, { status: 403 });
    }

    // 이미 결제했는지 확인
    if ((isUserA && mutualMatch.userAPaid) || (isUserB && mutualMatch.userBPaid)) {
      return NextResponse.json({ message: '이미 결제하셨습니다.' });
    }

    // 결제 시뮬레이션 (MVP)
    const payment = await prisma.payment.create({
      data: {
        payerUserId: user.userId,
        mutualMatchId,
        amount: 3000,
        currency: 'KRW',
        status: 'simulated_success',
      },
    });

    // MutualMatch 업데이트
    const updateData: any = {};
    if (isUserA) {
      updateData.userAPaid = true;
    } else {
      updateData.userBPaid = true;
    }

    // 양쪽 모두 결제했는지 확인
    const otherPaid = isUserA ? mutualMatch.userBPaid : mutualMatch.userAPaid;
    if (otherPaid) {
      updateData.isContactRevealed = true;
    }

    const updatedMatch = await prisma.mutualMatch.update({
      where: { id: mutualMatchId },
      data: updateData,
    });

    // 양쪽 모두 결제했으면 이메일 발송
    if (updatedMatch.isContactRevealed) {
      try {
        const dateStr = updatedMatch.date.toISOString().split('T')[0];

        // userA에게 이메일 발송
        await sendContactRevealEmail(
          mutualMatch.userA.email,
          mutualMatch.userA.name,
          mutualMatch.userB.email,
          mutualMatch.userB.name,
          dateStr
        );

        // userB에게 이메일 발송
        await sendContactRevealEmail(
          mutualMatch.userB.email,
          mutualMatch.userB.name,
          mutualMatch.userA.email,
          mutualMatch.userA.name,
          dateStr
        );
      } catch (error) {
        console.error('Error sending contact reveal emails:', error);
      }
    }

    return NextResponse.json({
      message: '결제가 완료되었습니다.',
      payment: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
      },
      isContactRevealed: updatedMatch.isContactRevealed,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    console.error('Payment error:', error);
    return NextResponse.json({ error: '결제에 실패했습니다.' }, { status: 500 });
  }
}
