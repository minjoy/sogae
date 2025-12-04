/**
 * 궁합 매칭 엔진
 * 경제 성향 코드 간의 궁합을 계산합니다.
 */

export interface CompatibilityInfo {
  goodMatches: string[]; // 잘 맞는 코드들
  warningMatches: string[]; // 주의가 필요한 코드들
  description: string;
}

/**
 * 궁합 매칭 테이블
 * 각 코드별로 잘 맞는 타입과 주의가 필요한 타입을 정의
 */
export const COMPATIBILITY_MAP: Record<string, CompatibilityInfo> = {
  // 절약 + 계획 + 안정 (SPL)
  SPL: {
    goodMatches: ['SPL', 'SPR', 'CPL'], // 유사형: 같은 계획형, 보완형: 경험형이지만 계획적
    warningMatches: ['CFR', 'CFL'], // 정반대 성향
    description:
      '계획적이고 안정적인 당신과 잘 맞는 타입은 비슷하게 미래를 준비하거나, 경험을 중시하되 계획적인 분들입니다.',
  },

  // 절약 + 계획 + 공격 (SPR)
  SPR: {
    goodMatches: ['SPR', 'SPL', 'CPR'],
    warningMatches: ['CFL', 'SFR'],
    description:
      '계획적이면서 투자에도 적극적인 당신은 목표가 명확하고 도전적인 분들과 잘 맞습니다.',
  },

  // 절약 + 유연 + 안정 (SFL)
  SFL: {
    goodMatches: ['SFL', 'SPL', 'CFL'],
    warningMatches: ['CPR', 'CFR'],
    description:
      '절약하면서도 유연한 당신은 안정을 추구하되 융통성 있는 분들과 좋은 관계를 만들 수 있습니다.',
  },

  // 절약 + 유연 + 공격 (SFR)
  SFR: {
    goodMatches: ['SFR', 'CFR', 'SPR'],
    warningMatches: ['CPL', 'SPL'],
    description:
      '절약하지만 투자 기회를 놓치지 않는 당신은 균형감각이 있고 도전적인 분들과 잘 어울립니다.',
  },

  // 소비 + 계획 + 안정 (CPL)
  CPL: {
    goodMatches: ['CPL', 'SPL', 'CPR'],
    warningMatches: ['SFR', 'CFR'],
    description:
      '경험을 즐기되 계획적인 당신은 삶을 즐기면서도 미래를 준비하는 분들과 좋은 파트너가 됩니다.',
  },

  // 소비 + 계획 + 공격 (CPR)
  CPR: {
    goodMatches: ['CPR', 'SPR', 'CFR'],
    warningMatches: ['SPL', 'SFL'],
    description:
      '경험과 투자 모두 적극적인 당신은 도전을 즐기고 목표가 명확한 분들과 시너지를 낼 수 있습니다.',
  },

  // 소비 + 유연 + 안정 (CFL)
  CFL: {
    goodMatches: ['CFL', 'SFL', 'CPL'],
    warningMatches: ['SPR', 'SPL'],
    description:
      '경험을 중시하되 안정적인 당신은 유연하고 현실적인 분들과 편안한 관계를 만들 수 있습니다.',
  },

  // 소비 + 유연 + 공격 (CFR)
  CFR: {
    goodMatches: ['CFR', 'SFR', 'CPR'],
    warningMatches: ['SPL', 'SFL'],
    description:
      '모험을 즐기고 새로운 기회를 추구하는 당신은 비슷하게 도전적이고 자유로운 분들과 잘 맞습니다.',
  },
};

/**
 * 특정 코드의 궁합 정보를 가져옴
 */
export function getCompatibilityInfo(code3: string): CompatibilityInfo {
  return (
    COMPATIBILITY_MAP[code3] || {
      goodMatches: [],
      warningMatches: [],
      description: '궁합 정보를 찾을 수 없습니다.',
    }
  );
}

/**
 * 두 코드 간의 궁합 점수를 계산 (0-100)
 */
export function calculateCompatibilityScore(code1: string, code2: string): number {
  const info = getCompatibilityInfo(code1);

  if (info.goodMatches.includes(code2)) {
    return 85; // 좋은 궁합
  } else if (info.warningMatches.includes(code2)) {
    return 35; // 주의가 필요한 궁합
  } else {
    return 60; // 보통 궁합
  }
}

/**
 * 특정 코드와 가장 잘 맞는 코드들을 필터링
 */
export function filterByCompatibility(
  userCode: string,
  candidateCodes: string[]
): { code: string; score: number }[] {
  return candidateCodes
    .map((code) => ({
      code,
      score: calculateCompatibilityScore(userCode, code),
    }))
    .sort((a, b) => b.score - a.score); // 점수 높은 순으로 정렬
}

/**
 * 선호하는 코드 리스트가 주어졌을 때, 특정 코드가 포함되는지 확인
 */
export function isPreferredCode(
  candidateCode: string,
  preferredCodes: string[] | null
): boolean {
  if (!preferredCodes || preferredCodes.length === 0) {
    return true; // 선호 코드 없으면 모두 허용
  }
  return preferredCodes.includes(candidateCode);
}
