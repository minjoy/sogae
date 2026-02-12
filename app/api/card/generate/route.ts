import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';
import { calculateReadiness } from '@/lib/tests/readiness';
import { TestScore } from '@/lib/tests/scoring';
import { randomBytes } from 'crypto';
import {
  determineAttachmentStyle,
  determineEnergyLevel,
  determineConflictStyle,
  determineLifestyleMode,
  determineSpendingPattern,
  generatePersonalityType,
  calculateRarity,
  type TypeComponents,
} from '@/lib/types/personality-types';

async function handleGenerateCard(request: AuthenticatedRequest) {
  try {
    const userId = request.userId!;

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
    if (results.some((r: typeof results[number]) => r === null)) {
      return NextResponse.json(
        { error: '모든 테스트를 완료해주세요' },
        { status: 400 }
      );
    }

    // TestScore 객체로 변환
    const testScores: { [testType: number]: TestScore } = {};
    results.forEach((result: typeof results[number], index: number) => {
      if (result) {
        const testType = index + 1;
        const scores = result.scores as Record<string, any>;
        testScores[testType] = {
          testType,
          subscales: scores.subscales || [],
          primaryLabel: scores.primaryLabel || '',
          secondaryLabel: scores.secondaryLabel,
          comment: scores.comment || '',
          recommendations: scores.recommendations || [],
        };
      }
    });

    // 연애 준비 상태 계산 (개선된 알고리즘)
    const readiness = calculateReadiness(testScores);

    // 성격 유형 결정 (개선된 알고리즘 - subscales 전체 전달)
    const test1Subscales = testScores[1].subscales;
    const test2Subscales = testScores[2].subscales;
    const test3Subscales = testScores[3].subscales;
    const test4Subscales = testScores[4].subscales;
    const test5Subscales = testScores[5].subscales;

    const anxSubscale = test1Subscales.find((s: Record<string, any>) => s.subscale === 'ANX');
    const avdSubscale = test1Subscales.find((s: Record<string, any>) => s.subscale === 'AVD');
    const burnoutSubscale = test5Subscales.find((s: Record<string, any>) => s.subscale === 'BURN');
    const burnoutScore = burnoutSubscale?.score || test5Subscales[0]?.score || 3.0;

    // 개선된 유형 결정 (상대적 순위 + 점수 차이 기반)
    const typeComponents: TypeComponents = {
      attachment: determineAttachmentStyle(
        anxSubscale?.score || 3.0,
        avdSubscale?.score || 3.0
      ),
      energy: determineEnergyLevel(burnoutScore),
      // 새로운 함수: subscales 전체를 전달하여 상대적 순위 기반 결정
      conflict: determineConflictStyle(test4Subscales),
      lifestyle: determineLifestyleMode(test3Subscales),
      spending: determineSpendingPattern(test2Subscales),
    };

    const personalityType = generatePersonalityType(typeComponents);

    // 희귀도 계산
    const rarity = calculateRarity(typeComponents);

    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { nickname: true },
    });

    // 통합 카드 데이터 생성 (확장된 데이터 포함)
    const cardPayload = {
      // 성격 유형 정보 (compatibleTypes 포함)
      personalityType: {
        code: personalityType.code,
        name: personalityType.name,
        emoji: personalityType.emoji,
        summary: personalityType.summary,
        description: personalityType.description,
        compatibleTypes: personalityType.compatibleTypes,
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
      datingMessage: readiness.message,
      nickname: user?.nickname,
      // 성격 유형 기반 맞춤 조언 (최대 10개)
      doList: personalityType.strengths.slice(0, 10),
      dontList: personalityType.challenges.slice(0, 10),
      phraseForPartner: personalityType.relationshipTips.slice(0, 5),
      // 새로운 데이터: 희귀도
      rarity: {
        percent: rarity.percent,
        label: rarity.label,
        isRare: rarity.isRare,
      },
      // 새로운 데이터: 상세 분석 (마음 상태 연결)
      breakdown: readiness.breakdown ? {
        emotionalStability: readiness.breakdown.emotionalStability,
        selfRegulation: readiness.breakdown.selfRegulation,
        relationshipSkills: readiness.breakdown.relationshipSkills,
        psychologicalResources: readiness.breakdown.psychologicalResources,
        insights: readiness.breakdown.insights,
      } : null,
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
        cardPayload: cardPayload as any,
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

    // 사용자의 성격 코드 업데이트 (매칭용)
    await prisma.user.update({
      where: { id: userId },
      data: { personalityCode: personalityType.code },
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
