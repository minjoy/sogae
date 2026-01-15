import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { calculateReadiness } from '@/lib/tests/readiness';
import { scoreTest } from '@/lib/tests/scoring';
import { randomBytes } from 'crypto';

async function handleGenerateCard(request: AuthenticatedRequest) {
  try {
    const userId = request.user!.userId;

    // 모든 테스트 결과 가져오기
    const results = await Promise.all(
      [1, 2, 3, 4, 5].map(async (testType) => {
        return await prisma.testResult.findFirst({
          where: { userId, testType },
          orderBy: { createdAt: 'desc' },
        });
      })
    );

    // 5개 테스트 모두 완료했는지 확인
    if (results.some((r) => r === null)) {
      return NextResponse.json(
        { error: '모든 테스트를 완료해주세요' },
        { status: 400 }
      );
    }

    // TestScore 객체로 변환
    const testScores: { [testType: number]: any } = {};
    results.forEach((result, index) => {
      if (result) {
        const testType = index + 1;
        const scores = result.scores as any;
        testScores[testType] = {
          testType,
          subscales: scores.subscales,
          primaryLabel: scores.primaryLabel,
          secondaryLabel: scores.secondaryLabel,
          comment: '',
          recommendations: [],
        };
      }
    });

    // 연애 준비 상태 계산
    const readiness = calculateReadiness(testScores);

    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true },
    });

    // 통합 카드 데이터 생성
    const cardPayload = {
      summaryTitle: `${results[0]!.label} × ${results[1]!.label}`,
      emotionLabel: results[0]!.label,
      spendingLabel: results[1]!.label,
      workLabel: results[2]!.label,
      communicationLabel: results[3]!.label,
      burnoutLabel: results[4]!.label,
      datingMode: readiness.modeLabel,
      datingEmoji: readiness.emoji,
      datingScore: readiness.score,
      nickname: user?.nickname,
      doList: [
        '감정을 솔직하게 표현할 수 있는 환경',
        '충분한 개인 시간과 공간 존중',
      ],
      dontList: [
        '갑작스러운 계획 변경',
        '감정을 무시하거나 억누르는 분위기',
      ],
      phraseForPartner: [
        '나는 이런 사람이에요',
        '함께 성장할 수 있는 관계를 원해요',
      ],
    };

    // 공유 슬러그 생성
    const shareSlug = randomBytes(8).toString('hex');

    // 기존 카드 비활성화
    await prisma.unifiedCard.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // 새 카드 생성
    const card = await prisma.unifiedCard.create({
      data: {
        userId,
        cardPayload,
        visibilitySettings: {
          showNickname: true,
          showScores: true,
          hiddenTests: [],
        },
        shareSlug,
        isActive: true,
      },
    });

    // 연애 준비 상태 저장/업데이트
    await prisma.datingState.upsert({
      where: { userId },
      update: {
        readinessScore: readiness.score,
        modeLabel: readiness.modeLabel,
        blockedReason: readiness.blockedReason,
      },
      create: {
        userId,
        readinessScore: readiness.score,
        modeLabel: readiness.modeLabel,
        blockedReason: readiness.blockedReason,
      },
    });

    return NextResponse.json({
      success: true,
      card: {
        id: card.id,
        shareSlug: card.shareSlug,
        cardPayload: card.cardPayload,
        readiness,
      },
    });
  } catch (error) {
    console.error('Card generation error:', error);
    return NextResponse.json(
      { error: '카드 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handleGenerateCard);
