import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { calculateReadiness } from '@/lib/tests/readiness';
import { randomBytes } from 'crypto';
import {
  determineAttachmentStyle,
  determineEnergyLevel,
  determineConflictStyle,
  determineLifestyleMode,
  determineSpendingPattern,
  generatePersonalityType,
  type TypeComponents,
} from '@/lib/types/personality-types';

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
    const testScores: { [testType: number]: Record<string, any> } = {};
    results.forEach((result, index) => {
      if (result) {
        const testType = index + 1;
        const scores = result.scores as Record<string, any>;
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

    // 성격 유형 결정
    const test1Subscales = testScores[1].subscales;
    const test4Subscales = testScores[4].subscales;

    const anxSubscale = test1Subscales.find((s: Record<string, any>) => s.subscale === 'ANX');
    const avdSubscale = test1Subscales.find((s: Record<string, any>) => s.subscale === 'AVD');
    const burnoutScore = testScores[5].subscales[0].score;

    const typeComponents: TypeComponents = {
      attachment: determineAttachmentStyle(
        anxSubscale?.score || 3.0,
        avdSubscale?.score || 3.0
      ),
      energy: determineEnergyLevel(burnoutScore),
      conflict: determineConflictStyle(test4Subscales[0].subscale),
      lifestyle: determineLifestyleMode(testScores[3].subscales[0].subscale),
      spending: determineSpendingPattern(testScores[2].subscales[0].subscale),
    };

    const personalityType = generatePersonalityType(typeComponents);

    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true },
    });

    // 통합 카드 데이터 생성
    const cardPayload = {
      // 성격 유형 정보
      personalityType: {
        code: personalityType.code,
        name: personalityType.name,
        emoji: personalityType.emoji,
        summary: personalityType.summary,
        description: personalityType.description,
      },
      summaryTitle: personalityType.name,
      emotionLabel: results[0]!.label,
      spendingLabel: results[1]!.label,
      workLabel: results[2]!.label,
      communicationLabel: results[3]!.label,
      burnoutLabel: results[4]!.label,
      datingMode: readiness.modeLabel,
      datingEmoji: readiness.emoji,
      datingScore: readiness.score,
      nickname: user?.nickname,
      // 성격 유형 기반 맞춤 조언
      doList: personalityType.strengths.slice(0, 3),
      dontList: personalityType.challenges.slice(0, 3),
      phraseForPartner: personalityType.relationshipTips.slice(0, 3),
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
